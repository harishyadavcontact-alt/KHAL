import Link from "next/link";
import { KhalWordmark } from "../../components/branding/KhalWordmark";

export default function BrandHubPage() {
  return (
    <main
      className="khal-compact"
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#d1d5db",
        padding: "32px 20px"
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 14 }}>
        <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.18em", textTransform: "uppercase" }}>Khal Brand</div>
        <KhalWordmark size={46} />
        <h1 style={{ margin: 0, color: "#ff8c00", fontSize: 24, letterSpacing: "0.06em" }}>Brand Assets</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>Only two asset classes are active: Logo and Wordmark.</p>

        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
          <Link
            href="/khal/logo"
            style={{
              border: "1px solid #263244",
              borderRadius: 10,
              background: "#111827",
              padding: 16,
              textDecoration: "none",
              color: "#cbd5e1"
            }}
          >
            <div style={{ color: "#ff8c00", fontSize: 18, marginBottom: 4 }}>Khal Logo</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>All logo variants (Kalachakra + reticle + bindu)</div>
          </Link>

          <Link
            href="/khal/wordmark"
            style={{
              border: "1px solid #263244",
              borderRadius: 10,
              background: "#111827",
              padding: 16,
              textDecoration: "none",
              color: "#cbd5e1"
            }}
          >
            <div style={{ color: "#ff8c00", fontSize: 18, marginBottom: 4 }}>Khal Wordmark</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Wordmark-only variants</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
