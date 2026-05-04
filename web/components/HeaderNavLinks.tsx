"use client";

import Link from "next/link";
import { useWalletAuth } from "@/hooks/useWalletAuth";

export function HeaderNavLinks() {
  const { isAuthenticated, isAdmin, isCreator } = useWalletAuth();
  const isRespondent = isAuthenticated && !isAdmin && !isCreator;

  return (
    <div className="nav-links">
      <Link href="/surveys" className="nav-link">
        Surveys
      </Link>

      {isRespondent && (
        <Link href="/kyc" className="nav-link">
          KYC
        </Link>
      )}

      {(isRespondent || isCreator) && (
        <Link href="/rewards" className="nav-link">
          Rewards
        </Link>
      )}

      {isCreator && (
        <Link href="/surveys" className="nav-link">
          Create Survey
        </Link>
      )}

      {isAdmin && (
        <Link href="/admin" className="nav-link">
          Admin
        </Link>
      )}
    </div>
  );
}
