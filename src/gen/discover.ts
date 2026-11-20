// ─────────────────────────────────────────────────────────────────────────────
//  DISCOVERY · every click synthesises a 100% de-novo procedural species.
//  Zero atlas species are returned or morphed during generation — every click
//  builds an original evolutionary form from habitat physics, diet and rules.
// ─────────────────────────────────────────────────────────────────────────────
import { generateNovo, type GenFish } from './generate';
import type { HabitatId } from './habitats';
import type { Plan, SnoutMode } from './genesis';
import { TAIL_INFO, FIN_INFO } from './flourish';
import { hashSeed } from './util';

export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type FindKind = 'living' | 'hybrid' | 'novo';

export const TIERS: Record<Tier, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8fe3d6' },
  uncommon: { label: 'Uncommon', color: '#7cd0ff' },
  rare: { label: 'Rare', color: '#6f9dff' },
  epic: { label: 'Epic', color: '#b78cff' },
  legendary: { label: 'Legendary', color: '#ffc75e' },
  mythic: { label: 'Mythic', color: '#ff74d4' },
};

export interface Discovery {
  fish: GenFish;
  kind: FindKind;
  tier: Tier;
  label: string;
  color: string;
  power: number;
}

const PLAN_RARITY: Partial<Record<Plan, number>> = {
  perch: 0.08,
  fusiform: 0.1,
  disc: 0.16,
  benthic: 0.16,
  cliffhead: 0.24,
  pike: 0.22,
  serpent: 0.26,
  shark: 0.3,
  armored: 0.34,
  ribbon: 0.4,
  hatchet: 0.42,
  grenadier: 0.42,
  ray: 0.42,
  flatfish: 0.42,
  sturgeon: 0.48,
  abyssalMaw: 0.5,
  sunfish: 0.54,
  seahorse: 0.56,
};

const tierOf = (x: number): Tier =>
  x < 0.34 ? 'common' : x < 0.5 ? 'uncommon' : x < 0.67 ? 'rare' : x < 0.83 ? 'epic' : x < 0.98 ? 'legendary' : 'mythic';

const power: Record<Tier, number> = { common: 0.25, uncommon: 0.4, rare: 0.55, epic: 0.72, legendary: 0.88, mythic: 1 };

export function rate(f: GenFish, kind?: FindKind): Omit<Discovery, 'fish'> {
  if (f.real) {
    return { kind: 'living', tier: 'rare', label: 'Atlas reference', color: '#7dffb0', power: power.rare };
  }
  const sp = f.species, fs = sp.fins;
  let x = (f.plan ? PLAN_RARITY[f.plan] ?? 0.22 : 0.22) + 0.3 * f.novelty;
  if (TAIL_INFO[fs.caudal.type]) x += 0.16;
  if ([...(fs.dorsal ?? []), ...(fs.anal ?? [])].some((d) => FIN_INFO[d.shape])) x += 0.1;
  if (fs.pec && (fs.pec.shape === 'wing' || fs.pec.shape === 'fan')) x += 0.14;
  if (fs.pel?.shape === 'thread') x += 0.06;
  if (sp.rostrum || sp.body.wbumps || sp.cephalic) x += 0.24;
  if (sp.barbels?.some((b) => b.bulb)) x += 0.12;
  if (sp.eye.d === 0) x += 0.1;
  if (sp.tags?.length) x += Math.min(0.18, 0.06 * sp.tags.length);
  if ((sp.color.trans ?? 0) > 0.3) x += 0.08;
  x += ((hashSeed('tier', sp.id) % 1000) / 1000 - 0.5) * 0.1;
  const k: FindKind = kind ?? 'novo';
  const tier = tierOf(x);
  const what = f.origin === 'mutated' ? 'Offspring' : f.origin === 'migrated' ? 'Colonist' : f.origin === 'crossed' ? 'Cross-bred' : 'De-novo species';
  return { kind: k, tier, label: `${TIERS[tier].label} · ${what}`, color: TIERS[tier].color, power: power[tier] };
}

export function discover(
  hid: HabitatId,
  seed: number,
  novelty: number,
  plan?: Plan,
  avoid?: Plan[],
  avoidSnouts?: SnoutMode[],
): Discovery {
  const nov = Math.max(0.12, novelty);
  const fish = generateNovo(hid, seed, { novelty: nov, plan, avoid, avoidSnouts });
  return { fish, ...rate(fish, 'novo') };
}
