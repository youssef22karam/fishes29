//  IchthyoGenesis — the procedural generator.
//
//    habitat + seed + novelty  →  a complete, coherent, 100% de-novo Species genome
// ─────────────────────────────────────────────────────────────────────────────
import type { Species } from '../engine/types';
import { BodyModel, isSuperior } from '../engine/model';
import { SPECIES } from '../data/species';
import { HABITAT, HABITATS, type HabitatId } from './habitats';
import { flourish } from './flourish';
import { growDermis } from './dermis';
import { ANCHORS, LINEAGES, anchorsOf, type Anchor, type Lineage, type LineageId, type Niche } from './lineages';
import { blendSpecies, clone, compatKey, mutate } from './morph';
import { adapt, speedOf, type Note } from './adapt';
import { applyPaint, hueDrift, paint, STRATEGY_INFO, type Strategy } from './pigment';
import { headLivery } from './headlivery';
import { nameFish } from './names';
import { chance, clamp, hashSeed, makeRng, pick, r4, range, wpick, type Rnd } from './util';
import { genesis, type Plan, type SnoutMode } from './genesis';

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export interface GenFish {
  key: string;
  species: Species;
  seed: number;
  habitat: HabitatId;
  novelty: number;
  niche: Niche;
  lineage: LineageId;
  anchor: string;
  parents: { id: string; name: string; share: number }[];
  real: boolean;
  strategy: Strategy | 'inherited';
  motifs: string[];
  notes: Note[];
  common: string;
  latin: string;
  description: string;
  epithetWhy: string;
  genome: { k: string; v: number; lo: string; hi: string }[];
  origin: 'generated' | 'blind' | 'migrated' | 'crossed' | 'atlas' | 'mutated';
  plan?: Plan;
  snoutMode?: SnoutMode;
  clade?: string;
  L?: Lineage;
}

export const lineageOf = (g: Pick<GenFish, 'L' | 'lineage'>): Lineage => g.L ?? LINEAGES[g.lineage];

export function individual(sp: Species, seed: number): Species {
  if (seed === 1) return sp;
  const r = makeRng(seed * 7919);
  const j = (v: number, pct: number) => v * (1 + (r() - 0.5) * 2 * pct);
  return {
    ...sp,
    body: { ...sp.body, D: j(sp.body.D, 0.05), P: j(sp.body.P, 0.06), pD: j(sp.body.pD, 0.03), W: j(sp.body.W, 0.05) },
    mouth: { ...sp.mouth, gape: j(sp.mouth.gape, 0.05), angle: sp.mouth.angle + (r() - 0.5) * 4, sup: isSuperior(sp.mouth) },
    eye: { ...sp.eye, d: j(sp.eye.d, 0.06) },
    fins: {
      ...sp.fins,
      dorsal: sp.fins.dorsal?.map((f) => ({ ...f, h: j(f.h, 0.08) })),
      anal: sp.fins.anal?.map((f) => ({ ...f, h: j(f.h, 0.08) })),
      caudal: { ...sp.fins.caudal, span: j(sp.fins.caudal.span, 0.05) },
    },
  };
}

// ── coherence repair ────────────────────────────────────────────────────────
const finite = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);

export function repair(sp0: Species): Species {
  const sp = clone(sp0);
  sp.HL = r4(clamp(finite(sp.HL, 0.25), 0.05, 0.48));
  sp.lenM = r4(clamp(finite(sp.lenM, 0.3), 0.015, 14));
  const m = sp.mouth;
  if (sp.cephalic) {
    if (sp.plan !== 'ray' || !sp.body.disc || (m.kind ?? 'jaw') !== 'jaw') delete sp.cephalic;
    else {
      sp.cephalic.length = clamp(finite(sp.cephalic.length, 0.123), 0.075, 0.145);
      sp.cephalic.width = clamp(finite(sp.cephalic.width, 0.063), 0.036, 0.079);
      sp.cephalic.curl = clamp(finite(sp.cephalic.curl, 1.24), 0.55, 1.55);
    }
  }
  if (m.gape > 0.004 && sp.plan === 'fish' && !sp.rostrum) m.gape = r4(Math.min(m.gape, sp.HL * 0.9));
  m.open = Math.round(clamp(finite(m.open, 30), 12, 76));
  const f = sp.fins;
  const tidy = (arr: typeof f.dorsal, lo: number) => {
    if (!arr) return arr;
    const a = arr
      .map((x) => ({ ...x, s0: clamp(x.s0, lo, 0.97), s1: clamp(x.s1, lo + 0.01, 0.985), h: r4(clamp(finite(x.h, 0.05), 0.004, 0.44)) }))
      .sort((x, y) => x.s0 - y.s0);
    for (let i = 1; i < a.length; i++) if (a[i].s0 < a[i - 1].s1 + 0.004) a[i].s0 = Math.min(a[i].s1 - 0.01, a[i - 1].s1 + 0.004);
    return a.filter((x) => x.s1 > x.s0 + 0.005);
  };
  f.dorsal = tidy(f.dorsal, 0.06);
  f.anal = tidy(f.anal, 0.2);
  if (f.caudal.type !== 'none') f.caudal.span = r4(Math.max(f.caudal.span, sp.body.P * 2.2, 0.03));
  if (sp.plan === 'fish' && sp.eye.d > 0) {
    const e = sp.eye;
    e.s = r4(clamp(e.s, 0.01, Math.max(0.035, sp.HL * 0.8)));
    for (let i = 0; i < 16; i++) {
      const md = new BodyModel(sp, 1);
      const top = md.top(e.s), bot = md.bot(e.s);
      const yc = md.normY(e.s, md.eyeYn);
      const over = e.y < 0.72 && yc + e.d / 2 > top * 1.03;
      const under = yc - e.d / 2 < -bot * 0.92;
      const big = e.d > (top + bot) * 0.6;
      if (!over && !under && !big) break;
      if (big || i > 8) e.d = r4(e.d * 0.9);
      if (over) e.y = r4(e.y - 0.05);
      if (under) e.y = r4(e.y + 0.05);
      e.d = r4(e.d * 0.97);
    }
  }
  return sp;
}

function genome(sp: Species, g: Pick<GenFish, 'habitat' | 'niche' | 'strategy' | 'novelty'>) {
  const crypsis: Record<string, number> = {
    cryptic: 0.05, kelp: 0.15, grass: 0.15, drab: 0.2, ghost: 0.3, deepBlack: 0.2, deepRed: 0.25, polar: 0.25,
    disruptive: 0.35, riverine: 0.35, silver: 0.3, matte: 0.25, deepSilver: 0.35, pelagicBold: 0.7, streamDisplay: 0.8,
    neon: 0.85, jewel: 0.9, reef: 0.95, tiger: 0.88, iridescent: 0.9, inherited: 0.5,
  };
  return [
    { k: 'Cruising speed', v: speedOf(HABITAT[g.habitat], g.niche), lo: 'hover', hi: 'sprint' },
    { k: 'Body depth', v: clamp(sp.body.D / 0.7), lo: 'eel', hi: 'disc' },
    { k: 'Eye size', v: clamp(sp.eye.d / Math.max(0.05, sp.HL) / 0.5), lo: 'blind', hi: 'huge' },
    { k: 'Gape', v: clamp(sp.mouth.gape / 0.2), lo: 'compact', hi: 'gulper' },
    { k: 'Livery', v: crypsis[g.strategy] ?? 0.5, lo: 'cryptic', hi: 'signal' },
    { k: 'Novelty', v: g.novelty, lo: 'typical', hi: 'wild' },
  ];
}

const sp = (id: string) => SPECIES_BY_ID[id];
function pickAnchor(r: Rnd, pool: Anchor[], hid: HabitatId, nativeOnly: boolean): Anchor | undefined {
  const w: Record<string, number> = {};
  for (const a of pool) if (sp(a.id) && (!nativeOnly || a.habitats.includes(hid))) w[a.id] = a.habitats.includes(hid) ? 3 : 1;
  if (!Object.keys(w).length) return undefined;
  return ANCHORS[wpick(r, w)];
}

export interface GenOpts {
  novelty: number;
  lineage?: LineageId;
  origin?: GenFish['origin'];
  plan?: Plan;
  niche?: Niche;
  avoid?: Plan[];
  avoidSnouts?: SnoutMode[];
}

/**
 * 100% DE-NOVO generation: zero atlas parent. Every body outline, head, jaws, eyes, fins,
 * tail, dermal outgrowths, skin texture and pigment pattern is synthesized from first principles.
 */
export function generateNovo(hid: HabitatId, seed: number, o: GenOpts): GenFish {
  const H = HABITAT[hid];
  const novelty = clamp(o.novelty);
  let last: unknown;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const r = makeRng(hashSeed('novo', hid, seed, attempt));
      const n = genesis(H, r, novelty, { plan: o.plan, niche: o.niche, avoid: o.avoid, avoidSnouts: o.avoidSnouts });
      n.sp = flourish(n.sp, n.plan, H, r, novelty, n.notes);
      n.sp = growDermis(n.sp, n.plan, n.niche, H, r, novelty, n.notes);
      const body = repair(n.sp);
      const p = paint(body, H, n.niche, n.L, r);
      let g = applyPaint(body, p);
      const hlv = headLivery(g, p.strategy, seed);
      g = repair(hlv.sp);
      const motifs = [...p.motifs, ...hlv.motifs];
      const md = new BodyModel(g, 1);
      for (let i = 1; i <= 40; i++) {
        const s = i / 40;
        if (!Number.isFinite(md.top(s) + md.bot(s) + md.hw(s))) throw new Error('non-finite outline');
      }
      const nm = nameFish(g, H, n.L, n.niche, p.strategy, motifs, n.notes, '', novelty, r);
      g.id = `novo-${n.plan}~${(seed >>> 0).toString(36)}${attempt}`;
      g.name = nm.common;
      g.sci = nm.latin;
      g.note = nm.description;
      const info = STRATEGY_INFO[p.strategy];
      const out: GenFish = {
        key: `${hid}-${seed}-${Math.round(novelty * 100)}-novo`,
        species: g, seed, habitat: hid, novelty, niche: n.niche, lineage: n.lineage, anchor: `novo-${n.plan}`,
        parents: [], real: false, strategy: p.strategy, motifs,
        notes: [n.notes[0], { icon: '◐', title: info.name, text: info.why[0].toUpperCase() + info.why.slice(1) + '.' }, ...n.notes.slice(1)],
        common: nm.common, latin: nm.latin, description: nm.description, epithetWhy: nm.epithetWhy, genome: [],
        origin: o.origin ?? 'generated', plan: n.plan, snoutMode: n.snoutMode, clade: n.clade, L: n.L,
      };
      out.genome = genome(g, out);
      return out;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error('genesis failed');
}

export function generate(hid: HabitatId, seed: number, o: GenOpts): GenFish {
  const novelty = clamp(o.novelty);
  if (novelty >= 0.08 && !o.lineage) return generateNovo(hid, seed, o);
  const r = makeRng(hashSeed('gen', hid, seed, Math.round(novelty * 100)));
  const w: Partial<Record<LineageId, number>> = {};
  for (const a of Object.values(ANCHORS)) if (a.habitats.includes(hid)) w[a.lineage] = Math.min(2.2, (w[a.lineage] ?? 0) + 1);
  const lineage = o.lineage ?? wpick(r, w, 'perch');
  const pool = anchorsOf(lineage);
  const anchor = pickAnchor(r, pool, hid, true) ?? pickAnchor(r, pool, hid, false)!;
  const base = sp(anchor.id);
  const s = individual(base, seed === 1 ? 2 : seed);
  return finalizeReal(s, base, hid, seed, novelty, anchor.niche, lineage, anchor.id, o.origin ?? 'generated');
}

function finalizeReal(
  s: Species, base: Species, hid: HabitatId, seed: number, novelty: number,
  niche: Niche, lineage: LineageId, anchor: string, origin: GenFish['origin'],
): GenFish {
  const out: GenFish = {
    key: `${hid}-${seed}-${Math.round(novelty * 100)}`,
    species: s, seed, habitat: hid, novelty, niche, lineage, anchor,
    parents: [{ id: base.id, name: base.name, share: 1 }],
    real: true, strategy: 'inherited', motifs: ['natural pattern'],
    notes: [{ icon: '✓', title: 'Measured reference species', text: `A real species from the reference atlas (${base.sci}), shown with subtle individual variation.` }],
    common: base.name, latin: base.sci, description: base.note, epithetWhy: '', genome: [], origin,
  };
  out.genome = genome(s, out);
  return out;
}

export function fromSpecies(s: Species): GenFish {
  const a = ANCHORS[s.id.split('~')[0]];
  const hid = a?.habitats[0] ?? 'reef';
  return finalizeReal(s, s, hid, 1, 0, a?.niche ?? 'picker', a?.lineage ?? 'perch', s.id, 'atlas');
}

export function blind(seed: number): GenFish {
  const r = makeRng(hashSeed('blind', seed));
  const h = pick(r, HABITATS).id;
  const nov = r4(clamp(range(r, 0.38, 0.96)));
  return { ...generateNovo(h, seed, { novelty: nov, origin: 'blind' }), origin: 'blind' };
}

export function census(hid: HabitatId, seed: number, n: number, novelty: number): GenFish[] {
  const out: GenFish[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const f = generateNovo(hid, hashSeed('census', seed, i) % 1e9, {
      novelty: clamp(Math.max(0.25, novelty) + ((i % 3) - 1) * 0.08),
      avoid: out.slice(-3).reverse().map((x) => x.plan).filter((x): x is Plan => !!x),
      avoidSnouts: out.slice(-2).map((x) => x.snoutMode).filter((x): x is SnoutMode => !!x),
    });
    const k = `${f.plan}-${f.niche}-${f.species.fins.caudal.type}`;
    if (seen.has(k) && i < n * 4) continue;
    seen.add(k);
    out.push(f);
  }
  return out;
}

export function migrate(src: GenFish, hid: HabitatId, seed: number, novelty: number): GenFish {
  const H = HABITAT[hid], L = lineageOf(src);
  const r = makeRng(hashSeed('migrate', src.key, hid, seed));
  const nw: Partial<Record<Niche, number>> = {};
  for (const n of L.niches) nw[n] = H.niches[n] ?? 0.05;
  const niche = wpick(r, nw, src.niche);
  const nov = Math.max(0.5, novelty);
  const ad = adapt(clone(src.species), { H, niche, L, r, k: clamp(0.55 + 0.45 * nov), novelty: nov });
  const p = paint(ad.sp, H, niche, L, r);
  let g = applyPaint(ad.sp, p);
  const hlv = headLivery(g, p.strategy, seed);
  g = repair(hlv.sp);
  p.motifs.push(...hlv.motifs);
  const nm = nameFish(g, H, L, niche, p.strategy, p.motifs, ad.notes, src.anchor, nov, r);
  g = { ...g, id: `${src.anchor}~m${(seed >>> 0).toString(36)}`, name: nm.common, sci: nm.latin, note: nm.description };
  const out: GenFish = {
    ...src, key: `mig-${src.key}-${hid}-${seed}`, species: g, seed, habitat: hid, novelty: nov, niche, real: false,
    strategy: p.strategy, motifs: p.motifs,
    notes: [
      { icon: '➜', title: `Colonised the ${H.name}`, text: `Descendant of ${src.common} reshaped by new habitat physics.` },
      { icon: '◐', title: STRATEGY_INFO[p.strategy].name, text: STRATEGY_INFO[p.strategy].why[0].toUpperCase() + STRATEGY_INFO[p.strategy].why.slice(1) + '.' },
      ...ad.notes,
    ],
    common: nm.common, latin: nm.latin, description: nm.description, epithetWhy: nm.epithetWhy, origin: 'migrated',
    parents: [{ id: src.species.id, name: src.common, share: 1 }],
  };
  out.genome = genome(g, out);
  return out;
}

export function offspring(src: GenFish, seed: number): GenFish {
  const L = lineageOf(src);
  const r = makeRng(hashSeed('kid', src.key, seed));
  let g = mutate(src.species, r, 0.9, L.mouth);
  if (!src.real && chance(r, 0.55)) g = hueDrift(g, r, 0.4);
  g = repair(g);
  g = { ...g, id: `${src.anchor}~k${(seed >>> 0).toString(36)}` };
  const out: GenFish = {
    ...src, key: `kid-${src.key}-${seed}`, species: g, seed, real: false, origin: 'mutated',
    parents: [{ id: src.species.id, name: src.common, share: 1 }],
    notes: [{ icon: '❦', title: 'Offspring', text: `A descendant of ${src.common}: heritable variation in proportions, fins and colour.` }, ...src.notes.filter((n) => n.title !== 'Measured reference species')],
  };
  if (src.real) { out.common = `${src.common} (variant)`; g.name = out.common; }
  out.genome = genome(g, out);
  return out;
}

export function cross(a: GenFish, b: GenFish, seed: number, share = 0.4): GenFish {
  const r = makeRng(hashSeed('cross', a.key, b.key, seed));
  const A = a.species, B = b.species;
  const ok = compatKey(A) === compatKey(B);
  let g: Species;
  const notes: Note[] = [];
  if (ok) {
    g = blendSpecies(A, B, share);
    notes.push({ icon: '⚭', title: 'Hybrid', text: `Silhouettes, fins, jaws and colours interpolated ${Math.round((1 - share) * 100)} : ${Math.round(share * 100)} between parents.` });
  } else {
    g = clone(A);
    g.color = clone(B.color);
    g.fins = { ...g.fins, color: B.fins.color, tip: B.fins.tip, caudal: { ...g.fins.caudal, color: B.fins.caudal.color, tip: B.fins.caudal.tip, pattern: B.fins.caudal.pattern } };
    g.eye = { ...g.eye, iris: B.eye.iris, iris2: B.eye.iris2 };
    notes.push({ icon: '⚭', title: 'Introgression', text: `Incompatible body plans: offspring keeps ${a.common}'s anatomy and inherits ${b.common}'s livery.` });
  }
  g = repair(mutate(g, r, 0.4, lineageOf(a).mouth));
  const H = HABITAT[a.habitat], L = lineageOf(a);
  const nm = nameFish(g, H, L, a.niche, 'inherited', [...a.motifs, ...b.motifs], notes, a.anchor, 0.6, r);
  g = { ...g, id: `${a.anchor}~x${(seed >>> 0).toString(36)}`, name: nm.common, sci: `${nm.latin.split(' ')[0]} × ${(b.latin.split(' ')[1] ?? 'hybrida')}`, note: nm.description };
  const out: GenFish = {
    ...a, key: `x-${a.key}-${b.key}-${seed}`, species: g, seed, real: false, origin: 'crossed', strategy: 'inherited',
    motifs: [...a.motifs.slice(0, 2), ...b.motifs.slice(0, 2)],
    parents: [{ id: A.id, name: a.common, share: r4(1 - share) }, { id: B.id, name: b.common, share: r4(share) }],
    notes: [...notes, ...a.notes.slice(0, 2)],
    common: nm.common, latin: g.sci, description: nm.description, epithetWhy: nm.epithetWhy,
  };
  out.genome = genome(g, out);
  return out;
}
