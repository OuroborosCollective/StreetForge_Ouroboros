export type TransportOrigin = "server" | "peer";
export type TransportKind = "presence" | "emote" | "input" | "combat" | "economy" | "character" | "asset";

const peerPermitted = new Set<TransportKind>(["presence", "emote"]);
const serverAuthoritative = new Set<TransportKind>(["input", "combat", "economy", "character", "asset"]);

export function validateTransportEnvelope(input: { origin: TransportOrigin; kind: TransportKind; bytes: number; sequence?: number }) {
  if (!Number.isInteger(input.bytes) || input.bytes < 0 || input.bytes > 16_384) return { accepted: false as const, reason: "invalid_payload_size" };
  if (input.origin === "peer" && !peerPermitted.has(input.kind)) return { accepted: false as const, reason: "peer_cannot_authorize_state" };
  if (serverAuthoritative.has(input.kind) && (!Number.isInteger(input.sequence) || (input.sequence ?? -1) < 0)) return { accepted: false as const, reason: "missing_authoritative_sequence" };
  return { accepted: true as const, route: input.origin === "peer" ? "presence_relay" as const : "authoritative_shard" as const };
}
