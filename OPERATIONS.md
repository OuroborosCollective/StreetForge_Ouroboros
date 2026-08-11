# StreetForge Operations

## Deterministic simulation

The Level-A core uses Kappa safe integers at scale `1_000_000` and a logical 10-Hz tick (`100 ms`). Run `pnpm check && pnpm test` before every deployment. The current suite contains 39 passing assertions across deterministic simulation, city entry, bounties, and existing game contracts.

## External server handoff

An administrator can select **CORE** in the Control Room and set an HTTPS endpoint. The `external` mode emits a `streetforge-kappa-v1` envelope with tick rate, Kappa scale, source tick, requested tick count, and a stable world hash. The private server must preserve sorted entity order, perform no wall-clock or random Level-A decision, and validate the envelope before writing state.

## GitHub handoff

`node tools/build-github-snapshot.mjs` refreshes the text snapshot. The application’s GitHub dialog creates a branch and draft pull request only after the explicit phrase `PUSH_STREETFORGE_TO_OUROBOROS` is supplied by an authenticated administrator.
