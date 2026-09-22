"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <main role="alert" style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Ajaia Docs could not start
          </h1>
          <p style={{ opacity: 0.7, margin: "0 0 1.25rem" }}>
            Something failed before the page could load.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid rgba(0,0,0,0.2)",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              background: "transparent",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
