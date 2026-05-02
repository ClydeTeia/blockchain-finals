import { vi } from "vitest";

import { makeCookieStore } from "./test-utils/mock-next-headers";

vi.mock("next/headers", () => ({
  cookies: async () => makeCookieStore()
}));

