import Link from "next/link";
import { KhalFinalMark } from "../../components/branding/KhalFinalMark";
import { KhalWordmark } from "../../components/branding/KhalWordmark";

const links = [
  { href: "/war-room", action: "Find War Room", alias: "leader+wr" },
  { href: "/war-gaming", action: "Find War Gaming", alias: "leader+wg" },
  { href: "/missionCommand", action: "Find Mission Command", alias: "leader+mc" },
  { href: "/dashboard", action: "Find Dashboard", alias: "leader+db" },
  { href: "/brand", action: "Find Brand", alias: "leader+br" },
  { href: "/home", action: "Find Home", alias: "leader+hm" }
];

export default function HomePage() {
  return (
    <main
      className="khal-compact"
      style={{
        minHeight: "100vh",
        background: "#0a0b14",
        color: "#c9d1d9",
        padding: "14px 16px 56px",
        position: "relative",
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", border: "1px solid #1f2430", borderRadius: 6, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#101625",
            borderBottom: "1px solid #1f2430",
            padding: "4px 8px",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "#8b9ab3"
          }}
        >
          <span>khal startup</span>
          <span>public • 39°F • Bridgeport, Connecticut</span>
        </div>

        <div style={{ padding: "26px 20px 24px", background: "#0b1020", minHeight: 520 }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 20 }}>
            <KhalWordmark size={78} />
          </div>

          <div style={{ maxWidth: 620, margin: "0 auto", border: "1px solid #232b3a", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px",
                gap: 10,
                padding: "6px 10px",
                background: "#0f162a",
                borderBottom: "1px solid #232b3a",
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "#7787a1",
                textTransform: "uppercase"
              }}
            >
              <span>Command</span>
              <span>Alias</span>
            </div>
            <div style={{ display: "grid" }}>
              {links.map((item) => (
                <Link
                  key={item.href + item.action}
                  href={item.href}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 10px",
                    borderBottom: "1px solid #1b2130",
                    background: "transparent",
                    color: "#d8dee9",
                    textDecoration: "none",
                    fontSize: 13
                  }}
                >
                  <span style={{ color: "#c9d1d9" }}>◈ {item.action}</span>
                  <span style={{ color: "#8fa0bc", fontSize: 12 }}>{item.alias}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#101625",
            borderTop: "1px solid #1f2430",
            padding: "4px 8px",
            fontSize: 10,
            color: "#7c8ba3"
          }}
        >
          <span>startup.khal</span>
          <span>core 6 loaded</span>
        </div>
      </div>

      <div style={{ position: "fixed", left: "50%", bottom: 12, transform: "translateX(-50%)", color: "#ff8c00", opacity: 0.24 }}>
        <KhalFinalMark size={38} />
      </div>
    </main>
  );
}
