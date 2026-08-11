export function bountyReward(baseReward: number, fundedReward: number) {
  if (!Number.isSafeInteger(baseReward) || !Number.isSafeInteger(fundedReward) || baseReward < 0 || fundedReward < 0) throw new Error("Bounty rewards must be non-negative safe integers.");
  return baseReward + fundedReward;
}

export function validateBountyContribution(amount: number, availableStreetCred: number) {
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error("A bounty contribution must be a positive whole amount.");
  if (amount > availableStreetCred) throw new Error("Insufficient Street Cred to fund this bounty.");
  return amount;
}
