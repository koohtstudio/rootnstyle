"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "var(--cream)" }}>
      <div style={{ display: "grid", gap: 16, justifyItems: "center", maxWidth: 480 }}>
        <h1 className="display" style={{ fontSize: "clamp(2.4rem, 7vw, 3.6rem)" }}>
          Something <em>slipped.</em>
        </h1>
        <p style={{ color: "var(--muted)" }}>We hit a snag loading this page. Your information is safe. Please try again.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
