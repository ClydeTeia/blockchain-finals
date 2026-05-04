"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

export type AuthState = {
  isAuthenticated: boolean;
  walletAddress: string | null;
  isAdmin: boolean;
  isCreator: boolean;
  isLoading: boolean;
  error: string | null;
  login: (address: string, provider: BrowserProvider) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const WalletAuthContext = createContext<AuthState | null>(null);

function isUserRejectedWalletAction(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    code?: string | number;
    message?: string;
    info?: { error?: { code?: number; message?: string } };
  };

  return (
    err.code === "ACTION_REJECTED" ||
    err.code === 4001 ||
    err.info?.error?.code === 4001 ||
    err.message?.toLowerCase().includes("user rejected") === true ||
    err.info?.error?.message?.toLowerCase().includes("user rejected") === true
  );
}

function useWalletAuthState(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as {
          walletAddress: string;
          roles?: { isAdmin?: boolean; isCreator?: boolean };
        };
        setIsAuthenticated(true);
        setWalletAddress(data.walletAddress);
        setIsAdmin(data.roles?.isAdmin === true);
        setIsCreator(data.roles?.isCreator === true);
      } else {
        setIsAuthenticated(false);
        setWalletAddress(null);
        setIsAdmin(false);
        setIsCreator(false);
      }
    } catch {
      setIsAuthenticated(false);
      setWalletAddress(null);
      setIsAdmin(false);
      setIsCreator(false);
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
      const attemptLogin = async (): Promise<{ walletAddress: string; verifyError?: string }> => {
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
          return {
            walletAddress: address,
            verifyError: err.error ?? "Signature verification failed."
          };
        }

        return (await verifyRes.json()) as { walletAddress: string };
      };

      let data = await attemptLogin();
      if (data.verifyError === "Nonce is missing or expired.") {
        data = await attemptLogin();
      }

      if (data.verifyError) {
        throw new Error(data.verifyError);
      }

      await checkAuth();
    } catch (e: unknown) {
      if (!isUserRejectedWalletAction(e)) {
        setError(e instanceof Error ? e.message : "Login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setWalletAddress(null);
    setIsAdmin(false);
    setIsCreator(false);
  }, []);

  return {
    isAuthenticated,
    walletAddress,
    isAdmin,
    isCreator,
    isLoading,
    error,
    login,
    logout,
    checkAuth
  };
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
