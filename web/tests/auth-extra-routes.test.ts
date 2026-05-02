import { Wallet } from "ethers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { clearMockCookies, setMockCookie } from "@/test-utils/mock-next-headers";

describe("Auth extra route coverage", () => {
  beforeEach(() => {
    clearMockCookies();
    process.env.SESSION_SECRET = "test-secret";
  });

  it("returns authenticated payload from /api/auth/me when cookie is valid", async () => {
    const wallet = Wallet.createRandom();
    const session = createSessionToken(wallet.address);
    setMockCookie(AUTH_COOKIE_NAME, session.token);

    const response = await meGet();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { authenticated: boolean; walletAddress: string };
    expect(body.authenticated).toBe(true);
    expect(body.walletAddress).toBe(wallet.address);
  });

  it("clears auth cookie on /api/auth/logout", async () => {
    const response = await logoutPost();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`${AUTH_COOKIE_NAME}=`);
  });
});

