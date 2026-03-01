import { KhalFinalMark } from "../../../components/branding/KhalFinalMark";

export default function KhalLogoPage() {
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
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.18em", textTransform: "uppercase" }}>Khal / Logo</div>
        <h1 style={{ margin: 0, color: "#ff8c00", fontSize: 30, letterSpacing: "0.08em" }}>Khal Logo Variants</h1>

        <section style={{ border: "1px solid #263244", borderRadius: 12, background: "linear-gradient(145deg, #1a1208, #0b0f14)", padding: 20, display: "grid", placeItems: "center" }}>
          <div style={{ color: "#ff8c00", filter: "drop-shadow(0 0 28px rgba(255,140,0,0.45))" }}>
            <KhalFinalMark size={260} />
          </div>
        </section>

        <section style={{ border: "1px solid #263244", borderRadius: 12, background: "#0b0f14", padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.16em", textTransform: "uppercase" }}>Size Variants</div>
          <div style={{ marginTop: 12, display: "flex", gap: 18, alignItems: "end", flexWrap: "wrap", color: "#ff8c00" }}>
            {[128, 96, 64, 48, 32, 16].map((size) => (
              <div key={size} style={{ display: "grid", justifyItems: "center", gap: 8 }}>
                <KhalFinalMark size={size} />
                <span style={{ color: "#6b7280", fontSize: 11 }}>{size}px</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid #263244", borderRadius: 12, background: "#0b0f14", padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.16em", textTransform: "uppercase" }}>Full Logo Pack (Imported)</div>
          <div style={{ marginTop: 12 }}>
            <iframe
              src="/brand-assets/khal-logos-pack.html"
              title="Khal Logos Pack"
              style={{ width: "100%", height: 760, border: "1px solid #263244", borderRadius: 10, background: "#05070a" }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
