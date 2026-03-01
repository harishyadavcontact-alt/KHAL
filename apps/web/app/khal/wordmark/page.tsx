import { KhalWordmark } from "../../../components/branding/KhalWordmark";

const variants = [
  { name: "Primary Orange", bg: "#0b0f14", variant: "primary" as const },
  { name: "Muted Orange", bg: "#0b0f14", variant: "muted" as const },
  { name: "Inverted Dark", bg: "#ff8c00", variant: "inverted" as const },
  { name: "Neutral White", bg: "#ffffff", variant: "muted" as const, colorOverride: "#cc5500" }
];

export default function KhalWordmarkPage() {
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
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.18em", textTransform: "uppercase" }}>Khal / Wordmark</div>
        <h1 style={{ margin: 0, color: "#ff8c00", fontSize: 30, letterSpacing: "0.08em" }}>Khal Wordmark Variants</h1>

        <section style={{ border: "1px solid #263244", borderRadius: 12, background: "#0b0f14", padding: 16, display: "grid", gap: 12 }}>
          {variants.map((v) => (
            <div
              key={v.name}
              style={{
                border: "1px solid #263244",
                borderRadius: 10,
                background: v.bg,
                padding: "20px 16px"
              }}
            >
              <div style={v.colorOverride ? { color: v.colorOverride } : undefined}>
                <KhalWordmark size={52} variant={v.variant} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280", letterSpacing: "0.14em", textTransform: "uppercase" }}>{v.name}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
