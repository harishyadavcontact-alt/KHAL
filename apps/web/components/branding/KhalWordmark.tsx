import React from "react";

type KhalWordmarkVariant = "primary" | "muted" | "inverted";

type KhalWordmarkProps = {
  size?: number;
  variant?: KhalWordmarkVariant;
  className?: string;
};

const variantStyles: Record<KhalWordmarkVariant, { color: string; textShadow?: string }> = {
  primary: {
    color: "#ff8c00",
    textShadow: "0 0 24px rgba(255,140,0,0.35)"
  },
  muted: {
    color: "rgba(255,140,0,0.65)"
  },
  inverted: {
    color: "#111111"
  }
};

export function KhalWordmark({ size = 52, variant = "primary", className }: KhalWordmarkProps) {
  const style = variantStyles[variant];
  return (
    <div
      className={className}
      style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "0.18em",
        lineHeight: 1,
        color: style.color,
        textShadow: style.textShadow
      }}
    >
      KHAL
    </div>
  );
}

