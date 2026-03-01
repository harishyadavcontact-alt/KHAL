import React from "react";

type KhalFinalMarkProps = {
  size?: number;
  className?: string;
};

export function KhalFinalMark({ size = 220, className }: KhalFinalMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KHAL Final Brand Mark"
      role="img"
    >
      <circle cx="110" cy="110" r="104" stroke="currentColor" strokeWidth="2" opacity="0.88" />
      <g fill="currentColor" opacity="0.9">
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(0 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(15 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(30 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(45 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(60 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(75 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(90 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(105 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(120 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(135 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(150 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(165 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(180 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(195 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(210 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(225 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(240 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(255 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(270 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(285 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(300 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(315 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(330 110 110)" />
        <rect x="108" y="3" width="4" height="12" rx="2" transform="rotate(345 110 110)" />
      </g>
      <line x1="110" y1="20" x2="110" y2="90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="130" x2="110" y2="200" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="110" x2="90" y2="110" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="130" y1="110" x2="200" y2="110" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="45" y1="45" x2="94" y2="94" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="126" y1="126" x2="175" y2="175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="175" y1="45" x2="126" y2="94" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="94" y1="126" x2="45" y2="175" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="110" cy="110" r="76" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <g fill="currentColor" opacity="0.9">
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(0 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(45 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(90 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(135 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(180 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(225 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(270 110 110)" />
        <polygon points="110,34 114,44 110,54 106,44" transform="rotate(315 110 110)" />
      </g>
      <circle cx="110" cy="110" r="62" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="110" cy="110" r="36" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" />
      <circle cx="110" cy="110" r="24" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
      <circle cx="110" cy="110" r="8" fill="currentColor" />
      <circle cx="110" cy="110" r="2.5" fill="#0b0f14" />
    </svg>
  );
}
