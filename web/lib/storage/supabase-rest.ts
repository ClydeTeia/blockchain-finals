type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function buildHeaders(config: SupabaseConfig): HeadersInit {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

async function runRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; data: T | null; status: number; error: unknown | null }> {
  const config = getSupabaseConfig();
  if (!config) {
    return { ok: false, data: null, status: 0, error: "Supabase REST is not configured." };
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...buildHeaders(config),
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      const text = await response.text();
      errorBody = text ? JSON.parse(text) : null;
    } catch {
      errorBody = null;
    }
    return { ok: false, data: null, status: response.status, error: errorBody };
  }

  if (response.status === 204) {
    return { ok: true, data: null, status: response.status, error: null };
  }

  const json = (await response.json()) as T;
  return { ok: true, data: json, status: response.status, error: null };
}

export function hasSupabaseRestConfig(): boolean {
  return getSupabaseConfig() !== null;
}

export async function supabaseInsert<T extends object>(
  table: string,
  row: T
): Promise<boolean> {
  const result = await runRequest(`${table}`, {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(row)
  });

  return result.ok;
}

export async function supabaseInsertDetailed<T extends object>(
  table: string,
  row: T
): Promise<{ ok: boolean; status: number; error: unknown | null }> {
  const result = await runRequest(`${table}`, {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(row)
  });
  return {
    ok: result.ok,
    status: result.status,
    error: result.error
  };
}

export async function supabaseSelect<T>(
  tableWithQuery: string
): Promise<T[] | null> {
  const result = await runRequest<T[]>(tableWithQuery, {
    method: "GET"
  });

  if (!result.ok) {
    return null;
  }

  return result.data ?? [];
}

export async function supabasePatch(
  tableWithQuery: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const result = await runRequest(tableWithQuery, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(patch)
  });

  return result.ok;
}
