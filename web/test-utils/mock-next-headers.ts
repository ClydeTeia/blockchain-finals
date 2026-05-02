const cookieJar = new Map<string, string>();

export function setMockCookie(name: string, value: string): void {
  cookieJar.set(name, value);
}

export function clearMockCookies(): void {
  cookieJar.clear();
}

export function getMockCookie(name: string): string | undefined {
  return cookieJar.get(name);
}

export function makeCookieStore() {
  return {
    get(name: string) {
      const value = cookieJar.get(name);
      return value ? { name, value } : undefined;
    }
  };
}

