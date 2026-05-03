"use client";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx/";

export type TxStatus = "idle" | "pending" | "confirmed" | "failed";

type TransactionStatusProps = {
  status: TxStatus;
  txHash?: string | null;
  errorMessage?: string | null;
};

export function TransactionStatus({
  status,
  txHash,
  errorMessage,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  if (status === "pending") {
    return (
      <p>
        Transaction pending
        {txHash && (
          <>
            {" — "}
            <a
              href={`${SEPOLIA_EXPLORER}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Etherscan
            </a>
          </>
        )}
      </p>
    );
  }

  if (status === "confirmed") {
    return (
      <p>
        Transaction confirmed
        {txHash && (
          <>
            {" — "}
            <a
              href={`${SEPOLIA_EXPLORER}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Etherscan
            </a>
          </>
        )}
      </p>
    );
  }

  return (
    <p style={{ color: "red" }}>
      Transaction failed{errorMessage ? `: ${errorMessage}` : ""}
    </p>
  );
}
