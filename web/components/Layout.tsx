"use client";

import type { ReactNode } from "react";

type LayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function Layout({ title, description, children }: LayoutProps) {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {description ? (
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

