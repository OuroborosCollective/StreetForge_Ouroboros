# StreetForge Open-World Foundation

## Scope and truth boundaries

StreetForge expands the present playable district into an **extendable open-world foundation**. “Open world” means a connected, seed-driven city lattice of districts that can generate and stream additional blocks through deterministic contracts. It does not claim that an infinite number of districts are simultaneously rendered or persisted in a single browser session.

The browser remains a visual client. A future real-time server must own multiplayer truth; until then, this build treats the authenticated profile, gang state, content records, asset metadata, and campaign progression as persistent application truth. All combat figures and progression curves use integers.

| Boundary | Owns | Must not own |
|---|---|---|
| `world` content module | District seed, encounter budget, visual grammar, spawn anchors | Player inventory or damage truth |
| `progression` module | XP curve, level milestones, skill points and unlocks | Mesh state or DOM state |
| `content` module | NPC, quest, item, ability and drop definitions | Generated player-specific state |
| `gang` module | Membership, territory claim and territory unlocks | Upload bytes |
| `assets` module | S3 key, MIME metadata, ownership and unlock gate | Runtime use of unverified user files |
| `admin` module | Versioned content changes and LLM policy settings | Personal user MCP configuration |

## Module contracts

```text
WorldSeed + DistrictIndex + ContentRegistry
    -> DistrictDefinition + EncounterAnchors + NPC/Quest candidates

ProfileProgress + QuestEvents + Drops
    -> XP + Level + SkillPoints + Inventory changes

GangMembership + TerritoryClaim
    -> territory asset-upload eligibility

AssetUploadRequest + eligibility + file validation
    -> S3 object key + customAsset record
```

Each data-driven content record carries `moduleKey`, `version`, and `status`. A new module can therefore be added without rewriting the game core. The registries admit **active** records into play, keep **draft** records for admin review, and retain **archived** content for evidence.

## Procedural district grammar

Each district derives from a compact integer seed and grid coordinates. The generator selects a district archetype, road graph variation, faction pressure, vendor and encounter anchors, while generated art stays grounded in the existing Asphalt Opera palette.

| Archetype | World role | Primary content contract |
|---|---|---|
| `market` | Safe-ish commerce crossroads | Vendors, social NPCs, delivery quests |
| `yard` | Industrial gang pressure zone | Combat packs, material drops, territory encounters |
| `underpass` | Dense traversal/ambush connector | Timed objectives, elite NPCs, short events |
| `rooftop` | Vertical reward district | Mobility tests, caches, rare drops |
| `hideout` | Gang-owned interior edge | Upgrade stations, custom environment model anchor |

Chunk visual generation is deterministic from `worldSeed`, `districtX`, `districtZ`, and the content version. This lets authored content override only meaningful named anchors while the street graph remains extendable.

## Progression model

Level has **no configured cap**. XP requirements are calculated with an integer curve and checked at each reward event; the client displays the current next-level target rather than a maximum level. Every level grants a skill point. Milestones at regular intervals unlock talent slots, cosmetic tiers, and later high-tier territory permissions.

```text
requiredXp(level) = 100 + 55 × level + 18 × level²
```

The calculation is deliberately simple, monotonic and integer-only. Balance values remain stored as module data, so the curve can be versioned without changing player history.

## Gang territory and asset unlocks

A player can request a character-model upload only after their profile reaches the configured **Personal Forge** milestone. A gang territory upload becomes available only when the player is a gang owner or officer and the gang owns an active territory. The UI must never infer eligibility locally; the server returns the gate state.

| Asset type | Gate | Accepted formats | Runtime use |
|---|---|---|---|
| Character model | Profile milestone; owner only | `.glb`, `.gltf`, `.png`, `.jpg`, `.webp` | Pending validation, then cosmetic/character anchor |
| Territory environment model | Gang officer/owner + owned territory | `.glb`, `.gltf`, `.png`, `.jpg`, `.webp` | Pending validation, then hideout anchor |

The first implementation stores the bytes in S3 and records metadata plus review status. It does **not** parse, execute or dynamically import arbitrary uploaded geometry. A later asset-pipeline worker should validate GLB structure, texture budgets, triangle limits, names, and material policy before publishing to the world.

## Weapon mastery and player economy

StreetForge uses **fictionalized urban weapon categories inspired by the broad gameplay categories of GTA-style open-world action games**. The content contract names categories rather than real-world product models: `melee`, `sidearm`, `smg`, `shotgun`, `rifle`, `marksman`, `heavy`, and `thrown`. Every weapon item identifies exactly one category, drop table and mastery tree.

Each action carries its equipped category into the authoritative reward reducer. Only a valid action with that category can produce `weaponMasteryXp`; it never increases every weapon at once. Mastery levels are uncapped and apply a modest, data-driven damage modifier to weapons of that same category. Unlock nodes can add situational accuracy, reload, stamina or critical modifiers but are stored as content data rather than hardcoded mesh behavior.

The Auktionshaus is a **server-authoritative escrow market**. Creating a listing moves a specific inventory row into an open listing. Every offer must exceed the current valid price and reserve the bidder’s Street Cred; cancellation, buyout and expiry resolve through a single transaction so an item or currency unit cannot appear twice. Listing UI is only a request surface; the database resolves state.

## Admin and LLM policy

The admin area manages world content records, moderation of uploaded assets, territory claims, and a **server-side LLM policy**. It does not expose user-local or Manus session MCP connectors. LLM policy supplies a named mode, optional allowed model identifier, prompt purpose, maximum output length, and whether generated text needs human review before content becomes active.

Any future call to the built-in model proxy remains server-side and must discover the live model catalog before saving a model choice. Generated narrative is content input, never a direct mutation of combat, loot or inventory truth.
