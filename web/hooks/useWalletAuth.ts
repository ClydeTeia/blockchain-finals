"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export type AuthState = {
  isAuthenticated: boolean;
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  login: (address: string, provider: BrowserProvider) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const WalletAuthContext = createContext<AuthState | null>(null);

function useWalletAuthState(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as { walletAddress: string };
        setIsAuthenticated(true);
        setWalletAddress(data.walletAddress);
      } else {
        setIsAuthenticated(false);
        setWalletAddress(null);
      }
    } catch {
      setIsAuthenticated(false);
      setWalletAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (address: string, provider: BrowserProvider) => {
    setIsLoading(true);
    setError(null);
    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address })
      });
      if (!nonceRes.ok) {
        const err = (await nonceRes.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to get nonce.");
      }
      const { nonce, message } = (await nonceRes.json()) as { nonce: string; message: string };
      const signature = await (await provider.getSigner()).signMessage(message);
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, signature, nonce })
      });
      if (!verifyRes.ok) {
        const err = (await verifyRes.json()) as { error?: string };
        throw new Error(err.error ?? "Signature verification failed.");
      }
      const data = (await verifyRes.json()) as { walletAddress: string };
      setIsAuthenticated(true);
      setWalletAddress(data.walletAddress);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed.");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setWalletAddress(null);
  }, []);

  return { isAuthenticated, walletAddress, isLoading, error, login, logout, checkAuth };
}

export function useWalletAuth(): AuthState {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error("useWalletAuth must be used inside WalletAuthProvider.");
  }
  return context;
}

export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useWalletAuthState();
  return React.createElement(WalletAuthContext.Provider, { value: auth }, children);
}
