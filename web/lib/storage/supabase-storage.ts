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

export async function uploadPrivateObject(input: {
  bucket: string;
  objectPath: string;
  contentType: string;
  data: Uint8Array;
}): Promise<boolean> {
  const config = getStorageConfig();
  if (!config) {
    return isExplicitTestMode();
  }

  const response = await fetch(
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

  return response.ok;
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
