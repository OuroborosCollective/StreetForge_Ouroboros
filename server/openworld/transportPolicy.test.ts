import { describe, expect, it } from "vitest";
import { validateTransportEnvelope } from "./transportPolicy";

describe("StreetForge P2P trust boundary", () => {
  it("permits only bounded, non-authoritative peer messages", () => {
    expect(validateTransportEnvelope({ origin: "peer", kind: "presence", bytes: 240 })).toMatchObject({ accepted: true, route: "presence_relay" });
    expect(validateTransportEnvelope({ origin: "peer", kind: "emote", bytes: 120 })).toMatchObject({ accepted: true, route: "presence_relay" });
  });

  it("rejects peer attempts to mutate combat, economy or character state", () => {
    expect(validateTransportEnvelope({ origin: "peer", kind: "combat", bytes: 64, sequence: 3 })).toMatchObject({ accepted: false, reason: "peer_cannot_authorize_state" });
    expect(validateTransportEnvelope({ origin: "peer", kind: "economy", bytes: 64, sequence: 3 })).toMatchObject({ accepted: false, reason: "peer_cannot_authorize_state" });
    expect(validateTransportEnvelope({ origin: "peer", kind: "character", bytes: 64, sequence: 3 })).toMatchObject({ accepted: false, reason: "peer_cannot_authorize_state" });
  });

  it("requires an authoritative sequence for server-side mutations", () => {
    expect(validateTransportEnvelope({ origin: "server", kind: "input", bytes: 64 })).toMatchObject({ accepted: false, reason: "missing_authoritative_sequence" });
    expect(validateTransportEnvelope({ origin: "server", kind: "combat", bytes: 64, sequence: 9 })).toMatchObject({ accepted: true, route: "authoritative_shard" });
  });
});
