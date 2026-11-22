import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function NotFound() {
  return (
    <main id="main" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "var(--cream)" }}>
      <div style={{ display: "grid", gap: 16, justifyItems: "center", maxWidth: 480 }}>
        <Logo size={88} />
        <h1 className="display" style={{ fontSize: "clamp(2.6rem, 8vw, 4rem)" }}>
          That page is <em>not here.</em>
        </h1>
        <p style={{ color: "var(--muted)" }}>The link may be old, or the page moved. Let us get you back to something lovely.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/book" className="btn btn-ghost">Book online</Link>
        </div>
      </div>
    </main>
  );
}
