export const v03Flags = {
  tripwire: process.env.NEXT_PUBLIC_V03_TRIPWIRE !== "0",
  blastRadius: process.env.NEXT_PUBLIC_V03_BLAST_RADIUS !== "0",
  optionality: process.env.NEXT_PUBLIC_V03_OPTIONALITY !== "0",
  replay: process.env.NEXT_PUBLIC_V03_REPLAY !== "0",
  confidence: process.env.NEXT_PUBLIC_V03_CONFIDENCE !== "0"
} as const;

