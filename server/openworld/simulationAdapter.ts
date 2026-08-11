import { KAPPA, TICK_RATE_HZ, compareStable, requireKappaInt } from "./kappa";

export type SimulationExecutionMode = "embedded" | "external";
export type ExternalSimulationEnvelope = {
  protocol: "streetforge-kappa-v1";
  tickRateHz: number;
  kappaScale: number;
  fromTick: number;
  tickCount: number;
  stateHash: number;
};

export function validateExternalEndpoint(endpoint: string | null | undefined) {
  if (!endpoint) return null;
  const parsed = new URL(endpoint);
  if (parsed.protocol !== "https:") throw new Error("External simulation endpoints must use HTTPS.");
  return parsed.toString();
}

export function buildExternalSimulationEnvelope(input: { fromTick: number; tickCount: number; stateHash: number }): ExternalSimulationEnvelope {
  return {
    protocol: "streetforge-kappa-v1",
    tickRateHz: TICK_RATE_HZ,
    kappaScale: KAPPA,
    fromTick: requireKappaInt(input.fromTick),
    tickCount: requireKappaInt(input.tickCount),
    stateHash: requireKappaInt(input.stateHash),
  };
}

/** Stable payload serialisation lets an external runner verify the exact request before work begins. */
export function serializeExternalEnvelope(envelope: ExternalSimulationEnvelope) {
  return [envelope.protocol, String(envelope.tickRateHz), String(envelope.kappaScale), String(envelope.fromTick), String(envelope.tickCount), String(envelope.stateHash)].sort(compareStable).join("|");
}
