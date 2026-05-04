type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
};

function isExplicitTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.SUPABASE_TEST_MODE === "1";
}

function getStorageConfig(): SupabaseStorageConfig | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }
  return { url, serviceRoleKey };
}

function storageHeaders(config: SupabaseStorageConfig): HeadersInit {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`
  };
}

async function createBucketIfMissing(
  config: SupabaseStorageConfig,
  bucket: string
): Promise<boolean> {
  const response = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      ...storageHeaders(config),
      "content-type": "application/json"
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false
    }),
    cache: "no-store"
  });

  if (response.ok) {
    return true;
  }

  return response.status === 409;
}

export async function uploadPrivateObject(input: {
  bucket: string;
  objectPath: string;
  contentType: string;
  data: Uint8Array;
}): Promise<boolean> {
  const result = await uploadPrivateObjectDetailed(input);
  return result.ok;
}

export async function uploadPrivateObjectDetailed(input: {
  bucket: string;
  objectPath: string;
  contentType: string;
  data: Uint8Array;
}): Promise<{ ok: boolean; status: number; error: string | null }> {
  const config = getStorageConfig();
  if (!config) {
    return {
      ok: isExplicitTestMode(),
      status: isExplicitTestMode() ? 200 : 503,
      error: isExplicitTestMode() ? null : "Supabase storage is not configured."
    };
  }

  const upload = async () =>
    fetch(
      `${config.url}/storage/v1/object/${input.bucket}/${input.objectPath}`,
      {
        method: "POST",
        headers: {
          ...storageHeaders(config),
          "x-upsert": "false",
          "content-type": input.contentType
        },
        body: input.data,
        cache: "no-store"
      }
    );

  let response = await upload();

  if (!response.ok && response.status === 404) {
    const body = await response.text().catch(() => "");
    if (body.toLowerCase().includes("bucket not found")) {
      const created = await createBucketIfMissing(config, input.bucket);
      if (created) {
        response = await upload();
      } else {
        response = new Response(body, { status: 404 });
      }
    }
  }

  if (response.ok) {
    return { ok: true, status: response.status, error: null };
  }

  let detail: string | null = null;
  try {
    const text = await response.text();
    detail = text.trim() || null;
  } catch {
    detail = null;
  }

  return {
    ok: false,
    status: response.status,
    error: detail
  };
}

export function isSupabaseStorageConfigured(): boolean {
  return getStorageConfig() !== null;
}

export function isSupabaseStorageTestMode(): boolean {
  return isExplicitTestMode();
}

export async function createSignedObjectUrl(input: {
  bucket: string;
  objectPath: string;
  expiresInSeconds: number;
}): Promise<string | null> {
  const config = getStorageConfig();
  if (!config) {
    if (!isExplicitTestMode()) {
      return null;
    }
    const safePath = encodeURIComponent(input.objectPath);
    return `https://example.local/storage/${input.bucket}/${safePath}?exp=${input.expiresInSeconds}`;
  }

  const response = await fetch(
    `${config.url}/storage/v1/object/sign/${input.bucket}/${input.objectPath}`,
    {
      method: "POST",
      headers: {
        ...storageHeaders(config),
        "content-type": "application/json"
      },
      body: JSON.stringify({ expiresIn: input.expiresInSeconds }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    signedURL?: string;
    signedUrl?: string;
  };
  const signedPath = json.signedURL ?? json.signedUrl;
  if (!signedPath) {
    return null;
  }

  if (signedPath.startsWith("http://") || signedPath.startsWith("https://")) {
    return signedPath;
  }

  return `${config.url}/storage/v1${signedPath}`;
}
