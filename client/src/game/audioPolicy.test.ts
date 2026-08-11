import { describe, expect, it } from "vitest";
import { clampAudioVolume, shouldPlayActionSfx, shouldPlayAmbience } from "./audioPolicy";

describe("audio policy", () => {
  it("spielt Atmosphäre nur nach Einwilligung während eines aktiven Einsatzes", () => {
    expect(shouldPlayAmbience(true, true)).toBe(true);
    expect(shouldPlayAmbience(false, true)).toBe(false);
    expect(shouldPlayAmbience(true, false)).toBe(false);
  });

  it("beschränkt die zugängliche Lautstärke und ordnet nur Angriffsaktionen dem Nahkampfsound zu", () => {
    expect(clampAudioVolume(-2)).toBe(0);
    expect(clampAudioVolume(0.9)).toBe(0.5);
    expect(clampAudioVolume(0.22)).toBe(0.22);
    expect(shouldPlayActionSfx(true, "attack")).toBe(true);
    expect(shouldPlayActionSfx(true, "heavy")).toBe(true);
    expect(shouldPlayActionSfx(true, "collect")).toBe(false);
    expect(shouldPlayActionSfx(false, "attack")).toBe(false);
  });
});
