import { describe, expect, it } from "vitest";
import { confidenceToSignalBand, signalBandTone } from "../lib/war-room/signal-language";

describe("signal-language", () => {
  it("maps confidence to normalized operator signal bands", () => {
    expect(confidenceToSignalBand(undefined)).toBe("WATCH");
    expect(confidenceToSignalBand({ confidence: "HIGH", evidenceCount: 4, recencyMinutes: 5 })).toBe("STRONG");
    expect(confidenceToSignalBand({ confidence: "MEDIUM", evidenceCount: 2, recencyMinutes: 25 })).toBe("WATCH");
    expect(confidenceToSignalBand({ confidence: "LOW", evidenceCount: 1, recencyMinutes: 90 })).toBe("WEAK");
  });

  it("returns stable display tones per signal band", () => {
    expect(signalBandTone("STRONG")).toBe("text-emerald-300");
    expect(signalBandTone("WATCH")).toBe("text-amber-300");
    expect(signalBandTone("WEAK")).toBe("text-red-300");
  });
});
