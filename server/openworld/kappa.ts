/**
 * Authoritative simulation contract. All Level-A state uses whole Kappa units;
 * no random source, wall-clock value or floating-point decision is permitted.
 */
export const KAPPA = 1_000_000;
export const TICK_RATE_HZ = 10;
export const TICK_DURATION_MS = 100;
export type KappaInt = number;
const RNG_MODULUS = 2_147_483_647;

export const requireKappaInt = (value: number) => {
  if (!Number.isSafeInteger(value)) throw new Error("Kappa values must be safe integers.");
  return value;
};
export const clampKappa = (value: KappaInt, minimum = 0, maximum = KAPPA) => value < minimum ? minimum : value > maximum ? maximum : value;
export const absKappa = (value: KappaInt) => value < 0 ? -value : value;
export const compareStable = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
export const quotient = (numerator: KappaInt, denominator: KappaInt) => denominator === 0 ? 0 : (numerator - (numerator % denominator)) / denominator;

/** Deterministic and traceable PRNG step for rule-based tie breaking only. */
export const nextSeed = (seed: KappaInt) => (requireKappaInt(seed) * 48_271) % RNG_MODULUS;

export const hashKappa = (parts: readonly string[]) => {
  let hash = 5381;
  for (const part of parts) for (let index = 0; index < part.length; index += 1) {
    hash = (hash * 33 + part.charCodeAt(index)) % RNG_MODULUS;
  }
  return hash;
};

/** Validates the persisted safe-integer scalar before Level-A processing. */
export const toKappa = (value: number) => requireKappaInt(value);
export const fromKappa = (value: KappaInt) => requireKappaInt(value);
