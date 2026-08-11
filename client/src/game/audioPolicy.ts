import type { Action } from "./input";

export const clampAudioVolume = (value: number) => Math.max(0, Math.min(0.5, value));

export const shouldPlayAmbience = (audioEnabled: boolean, gameActive: boolean) => audioEnabled && gameActive;

export const shouldPlayActionSfx = (audioEnabled: boolean, action: Action) => audioEnabled && (action === "attack" || action === "heavy");
