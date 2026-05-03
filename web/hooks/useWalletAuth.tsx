"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrowserProvider } from "ethers";

type SessionPayload = {
  authenticated: boolean;
  walletAddress?: string;
};

export function useWalletAuth() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session by calling /api/auth/me
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithWallet = async () => {
    if (!(window as any).ethereum) throw new Error("MetaMask required");
    const provider = new BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const wallet = accounts[0];

    // Step 1: Get nonce from server
    const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
    if (!nonceRes.ok) throw new Error("Failed to get nonce");
    const { nonce, message } = await nonceRes.json();

    // Step 2: Sign message with MetaMask
    const signature = await provider.send("personal_sign", [message, wallet]);

    // Step 3: Verify with server
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: wallet, signature, nonce })
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || "Verification failed");
    }

    // Refresh session state
    const meRes = await fetch("/api/auth/me");
    if (meRes.ok) {
      const data = await meRes.json();
      setSession(data);
    }
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.refresh();
  };

  return { session, loading, loginWithWallet, logout, connected: !!session };
}
