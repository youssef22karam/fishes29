//  IchthyoGenesis — DE-NOVO MORPHOGENESIS (v2).
//
//  Every specimen is grown from first principles — zero atlas parent morphing:
//
//    habitat physics ─┐
//    ecological niche ─┼─► cruising speed, manoeuvring demand, light, substrate
//    seed             ─┘
//         │
//         ▼
//    18 EVOLUTIONARY BAUPLANS — each a continuous multi-zone shape space
//         │
//         ▼
//    MULTI-ZONE SILHOUETTE SYNTHESIS
//         │  independent snout/forehead, dorsal arch, ventral belly & peduncle
//         │  curves → smooth Fritsch-Carlson ProfileSpec
//         ▼
//    ANATOMICALLY COHERENT ORGANS
//         │  jaws scaled to head & diet (no pinhole mouths or accidental straws),
//         │  eyes by light × allometry, 10 dorsal × 4 anal × 23 caudal tails,
//         │  paired fins from gait, skin & scales from clade & lifestyle
//         ▼
//    HABITAT SIGNATURES — keels & finlets offshore, lures in the abyss,
//         barbels in mud, periscope eyes on mudflats, fronds in kelp …
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Barbel, CaudalSpec, CaudalType, FinShape, GillSpec, MedianFin,
  MouthSpec, PairedFin, SkinSpec, Species, Spike, TeethKind,
} from '../engine/types';
type SkinKind = SkinSpec['kind'];
import { A, M, Pf, make, type SP } from '../data/factory';
import type { Habitat, HabitatId } from './habitats';
import type { Kind, Lineage, LineageId, Niche } from './lineages';
import { buildProfile, remeasure, STATIONS } from './morph';
import { caudalGeom, type Note } from './adapt';
import { chance, clamp, irange, lerp, pick, r4, range, sstep, wpick, type Rnd } from './util';

export type Plan =
  | 'fusiform'
  | 'perch'
  | 'disc'
  | 'cliffhead'
  | 'pike'
  | 'benthic'
  | 'armored'
  | 'hatchet'
  | 'serpent'
  | 'ribbon'
  | 'abyssalMaw'
  | 'grenadier'
  | 'sunfish'
  | 'sturgeon'
  | 'seahorse'
  | 'shark'
  | 'ray'
  | 'flatfish';

export type SnoutMode = 'blunt-cliff' | 'rounded-brow' | 'concave-sniper' | 'wedge-torpedo' | 'broad-flat' | 'humped-nape';
export type BellyMode = 'taut' | 'deep-keel' | 'flat-benthic' | 'potbelly' | 'angular-diamond';

export interface Novo {
  sp: Species;
  plan: Plan;
  snoutMode: SnoutMode;
  niche: Niche;
  L: Lineage;
  lineage: LineageId;
  clade: string;
  notes: Note[];
  speed: number;
}

// ── habitat-driven construction weights (broad evolutionary diversity) ───────
const PLANS: Record<HabitatId, Partial<Record<Plan, number>>> = {
  reef: { disc: 2.3, perch: 2.2, cliffhead: 1.8, armored: 1.5, benthic: 1.2, pike: 0.7, serpent: 0.8, fusiform: 1.1, shark: 0.65, ray: 0.45, seahorse: 0.35, sunfish: 0.2 },
  kelp: { perch: 2.1, fusiform: 1.6, benthic: 1.6, cliffhead: 1.1, disc: 1.1, pike: 1.0, serpent: 0.8, armored: 0.65, ribbon: 0.45, shark: 0.65, seahorse: 0.35 },
  seagrass: { perch: 1.9, disc: 1.3, pike: 1.2, fusiform: 1.2, armored: 0.9, benthic: 1.1, seahorse: 0.7, ray: 0.75, flatfish: 0.75, serpent: 0.6, cliffhead: 0.7 },
  pelagic: { fusiform: 2.8, cliffhead: 1.4, shark: 1.6, disc: 0.9, sunfish: 0.7, ribbon: 0.65, ray: 0.7, pike: 1.1, hatchet: 0.5 },
  twilight: { hatchet: 1.9, abyssalMaw: 1.8, fusiform: 1.3, ribbon: 1.3, grenadier: 1.1, serpent: 0.7, shark: 0.55, cliffhead: 0.45 },
  abyss: { abyssalMaw: 2.3, grenadier: 1.8, serpent: 1.2, ribbon: 1.1, armored: 0.7, benthic: 0.8, shark: 0.45 },
  hadal: { grenadier: 2.6, serpent: 1.4, ribbon: 1.0, benthic: 1.1, abyssalMaw: 0.7 },
  sandflat: { flatfish: 2.5, ray: 2.1, benthic: 1.8, perch: 1.1, fusiform: 0.9, pike: 0.7, shark: 0.7, serpent: 0.55, cliffhead: 0.5 },
  rocky: { benthic: 2.4, perch: 1.9, cliffhead: 1.1, serpent: 1.2, armored: 0.9, disc: 0.75, shark: 0.5, flatfish: 0.4, pike: 0.6 },
  polar: { benthic: 2.0, fusiform: 1.8, grenadier: 1.3, perch: 1.2, flatfish: 1.0, serpent: 0.8, armored: 0.7, shark: 0.55 },
  estuary: { perch: 1.9, benthic: 1.9, fusiform: 1.3, pike: 1.1, flatfish: 0.8, ray: 0.75, hatchet: 0.65, armored: 0.6, serpent: 0.7, sturgeon: 0.55, shark: 0.45 },
  stream: { fusiform: 2.2, benthic: 2.1, perch: 1.8, pike: 0.7, serpent: 0.5, sturgeon: 0.35 },
  river: { perch: 2.0, benthic: 1.9, fusiform: 1.6, sturgeon: 1.1, pike: 1.1, ribbon: 0.75, hatchet: 0.7, serpent: 0.7, ray: 0.35, shark: 0.25 },
  amazon: { disc: 1.9, perch: 1.8, hatchet: 1.3, ribbon: 1.2, benthic: 1.5, pike: 1.0, armored: 0.7, serpent: 0.6, ray: 0.55, cliffhead: 0.8 },
  lake: { perch: 2.4, fusiform: 2.0, disc: 1.3, pike: 1.1, benthic: 1.2, cliffhead: 0.75, sturgeon: 0.5 },
  swamp: { perch: 1.8, disc: 1.6, serpent: 1.4, benthic: 1.3, pike: 1.1, ribbon: 0.7, hatchet: 0.6, armored: 0.5 },
  cave: { benthic: 2.1, serpent: 1.7, perch: 1.4, grenadier: 1.0, fusiform: 1.0, ribbon: 0.6 },
};

// ── ecological diet affinity per construction ───────────────────────────────
const AFF: Record<Plan, Partial<Record<Niche, number>>> = {
  fusiform: { pursuit: 2.2, apex: 1.6, planktivore: 1.7, picker: 0.9, scavenger: 1.0, filter: 0.6, grazer: 0.6 },
  perch: { pursuit: 1.4, apex: 1.2, picker: 1.5, crusher: 1.3, grazer: 1.2, benthivore: 1.2, ambush: 1.1, planktivore: 1.0, scavenger: 1.0 },
  disc: { picker: 2.2, grazer: 2.1, planktivore: 1.5, crusher: 1.1, ambush: 0.3 },
  cliffhead: { grazer: 1.8, crusher: 1.7, pursuit: 1.5, picker: 1.4, apex: 0.9, planktivore: 0.9 },
  pike: { ambush: 2.2, apex: 2.0, pursuit: 1.9, crevice: 0.7 },
  benthic: { benthivore: 2.5, ambush: 1.8, scavenger: 1.3, crusher: 1.1, grazer: 1.0, cryptic: 1.0, lure: 0.6 },
  armored: { crusher: 2.2, grazer: 1.7, picker: 1.4, benthivore: 0.9, lure: 0.7, planktivore: 0.5 },
  hatchet: { planktivore: 2.5, picker: 1.2, pursuit: 0.9, apex: 0.6 },
  serpent: { crevice: 2.4, ambush: 1.7, benthivore: 1.3, scavenger: 1.2, apex: 0.8 },
  ribbon: { planktivore: 1.6, pursuit: 1.4, ambush: 1.1, picker: 0.9, scavenger: 0.8 },
  abyssalMaw: { lure: 2.6, ambush: 2.1, apex: 1.2, pursuit: 0.8 },
  grenadier: { benthivore: 2.2, scavenger: 2.1, ambush: 0.9, picker: 0.6 },
  sunfish: { planktivore: 1.8, grazer: 1.5, crusher: 1.4, picker: 1.1 },
  sturgeon: { benthivore: 2.3, scavenger: 1.3, apex: 1.1, filter: 0.9, ambush: 0.7 },
  seahorse: { cryptic: 2.6, picker: 1.5 },
  shark: { apex: 2.1, pursuit: 1.6, scavenger: 1.1, benthivore: 1.1, crusher: 0.7, ambush: 0.6, filter: 0.5 },
  ray: { benthivore: 2.3, crusher: 1.5, ambush: 0.9, filter: 0.6 },
  flatfish: { ambush: 2.1, benthivore: 2.0, crusher: 0.6 },
};

const SPEED: Record<Niche, number> = {
  apex: 0.86, pursuit: 0.9, planktivore: 0.56, filter: 0.52, picker: 0.36, grazer: 0.36,
  ambush: 0.28, lure: 0.1, benthivore: 0.3, crusher: 0.32, scavenger: 0.42, cryptic: 0.12, crevice: 0.34, parasite: 0.4,
};
const PLAN_SPEED: Partial<Record<Plan, number>> = {
  fusiform: 0.12, disc: -0.1, cliffhead: 0.04, armored: -0.24, benthic: -0.14,
  abyssalMaw: -0.14, serpent: -0.06, grenadier: -0.16, hatchet: -0.08, sunfish: -0.18,
  seahorse: -0.35, pike: 0.08, sturgeon: 0.02,
};

interface PlanInfo { clade: string; kind: Kind; lineage: LineageId; roots: string[]; nouns: string[]; what: string }
const INFO: Record<Plan, PlanInfo> = {
  fusiform: { clade: 'Fusiform open-water cruisers', kind: 'bony', lineage: 'tuna', roots: ['Thunn', 'Scombr', 'Carang', 'Rheon', 'Thalass', 'Drom', 'Salm', 'Lampr'], nouns: ['runner', 'fusilier', 'mackerel', 'jack', 'trevally', 'bonito', 'salmonid', 'scad'], what: 'A muscular hydrodynamic teardrop built for sustained cruising and burst acceleration.' },
  perch: { clade: 'Perciform bony swimmers', kind: 'bony', lineage: 'perch', roots: ['Lutjan', 'Epineph', 'Chrom', 'Perca', 'Spar', 'Haemul', 'Sciaen', 'Cichl'], nouns: ['snapper', 'perch', 'bass', 'bream', 'drum', 'grunt', 'grouper', 'cichlid'], what: 'A deep-shouldered, agile bony body with powerful jaws and manoeuvring fins.' },
  disc: { clade: 'Deep-bodied disc fishes', kind: 'bony', lineage: 'reefDeep', roots: ['Platy', 'Selen', 'Aspid', 'Chaet', 'Pomac', 'Ephipp', 'Zancl'], nouns: ['discfish', 'angelfish', 'moonfish', 'spadefish', 'bannerfish', 'batfish', 'tang'], what: 'A tall, laterally compressed disc that pivots on a dime among structure and resists gape-limited predators.' },
  cliffhead: { clade: 'Steep-browed fishes', kind: 'bony', lineage: 'wrasse', roots: ['Coryph', 'Scar', 'Balist', 'Capr', 'Vomer', 'Scutic', 'Front'], nouns: ['dolphinfish', 'parrotfish', 'triggerfish', 'boarfish', 'lookdown', 'hogfish', 'browfish'], what: 'A bold, cliff-faced forehead rising steeply above the jaws into a towering anterior shoulder.' },
  pike: { clade: 'Muscular ambush torpedoes', kind: 'bony', lineage: 'pike', roots: ['Esoc', 'Sphyraen', 'Lepis', 'Centrop', 'Chann', 'Hopl', 'Belon'], nouns: ['pike', 'barracuda', 'snook', 'snakehead', 'muskellunge', 'gar', 'lance-pike'], what: 'A parallel-sided, broad-backed ambush torpedo with heavy jaws and rear-set thrust paddles.' },
  benthic: { clade: 'Bottom-hugging fishes', kind: 'bony', lineage: 'goby', roots: ['Cottid', 'Gobio', 'Blenni', 'Platyceph', 'Silur', 'Synanc', 'Trigl'], nouns: ['sculpin', 'goby', 'blenny', 'bullhead', 'flathead', 'catfish', 'loach', 'gudgeon'], what: 'A broad, depressed cranium and flat belly anchored by wide, prop-like pectoral fins.' },
  armored: { clade: 'Armoured & box-hulled fishes', kind: 'bony', lineage: 'tetraodont', roots: ['Ostrac', 'Tetrod', 'Diodon', 'Cyclopt', 'Monac', 'Sphaer', 'Loric'], nouns: ['boxfish', 'cowfish', 'puffer', 'burrfish', 'lumpfish', 'trunkfish', 'filefish'], what: 'A rigid polygonal or globular hull propelled by precise sculling fins and armoured against bites.' },
  hatchet: { clade: 'Keel-bellied fishes', kind: 'bony', lineage: 'lantern', roots: ['Pelec', 'Sterno', 'Carin', 'Osteogl', 'Gastr', 'Argyr'], nouns: ['hatchetfish', 'keelfish', 'arowana', 'silverblade', 'axefish'], what: 'A straight back over a razor-deep ventral keel that hides its silhouette from below.' },
  serpent: { clade: 'Serpentine fishes', kind: 'eel', lineage: 'eel', roots: ['Muraen', 'Congr', 'Angu', 'Ophid', 'Polypter', 'Cobit'], nouns: ['moray', 'conger', 'eel', 'snake-eel', 'reedfish', 'loach-eel'], what: 'A flexible, muscular serpentine body that threads crevices with whole-body waves.' },
  ribbon: { clade: 'Ribbon & blade fishes', kind: 'eel', lineage: 'oarfish', roots: ['Taeni', 'Trachyp', 'Gymn', 'Apteron', 'Regalec', 'Xiphid'], nouns: ['ribbonfish', 'knifefish', 'bladefish', 'oarfish', 'cutlassfish', 'bandfish'], what: 'A blade-thin body propelled by travelling waves of a continuous dorsal or anal ribbon fin.' },
  abyssalMaw: { clade: 'Great-jawed deep predators', kind: 'bony', lineage: 'deepPredator', roots: ['Melanoc', 'Chauliod', 'Anopl', 'Malacost', 'Stomi', 'Saccol'], nouns: ['angler', 'viperfish', 'fangtooth', 'dragonfish', 'gulper', 'swallower'], what: 'A towering cranium dominated by cavernous, fang-lined jaws built to engulf rare deep-sea prey.' },
  grenadier: { clade: 'Tadpole & rattail fishes', kind: 'bony', lineage: 'deepBenthic', roots: ['Macrur', 'Lipar', 'Coryph', 'Careproct', 'Psychr', 'Bathyg'], nouns: ['grenadier', 'rattail', 'snailfish', 'tadpolefish', 'jellynose'], what: 'A heavy, bulbous head tapering smoothly into a hovering whip tail.' },
  sunfish: { clade: 'Clavus-ruddered sunfishes', kind: 'bony', lineage: 'tetraodont', roots: ['Molid', 'Ranzan', 'Lampr', 'Mastur', 'Orbic'], nouns: ['sunfish', 'mola', 'opah', 'moon-disc'], what: 'A deep, truncated oval driven by tall opposing dorsal and anal blades and a scalloped clavus rudder.' },
  sturgeon: { clade: 'Armoured ganoid & lobe-fin forms', kind: 'odd', lineage: 'sturgeon', roots: ['Acipens', 'Latimer', 'Polypter', 'Amia', 'Scaphir'], nouns: ['sturgeon', 'bichir', 'bowfin', 'coelacanth', 'scute-fish'], what: 'An ancient armoured architecture with bony scutes, lobed or heterocercal propulsion, and sensory barbels.' },
  seahorse: { clade: 'Ring-armoured upright swimmers', kind: 'bony', lineage: 'syngnathid', roots: ['Hippoc', 'Phyllop', 'Syngnath', 'Solenost'], nouns: ['seahorse', 'seadragon', 'pipehorse'], what: 'A curved, bony-ringed posture sculled delicately by a single dorsal fan among weeds and corals.' },
  shark: { clade: 'Cartilaginous sharks', kind: 'shark', lineage: 'sharkPelagic', roots: ['Carchar', 'Lamn', 'Squal', 'Sphyrn', 'Orectol', 'Scyli'], nouns: ['shark', 'dogfish', 'houndshark', 'carpet-shark', 'mako'], what: 'A cartilaginous torpedo with naked gill slits, dermal denticles and a heterocercal lifting tail.' },
  ray: { clade: 'Winged batoids', kind: 'batoid', lineage: 'stingray', roots: ['Myliob', 'Dasy', 'Raj', 'Mobul', 'Uro', 'Torped'], nouns: ['ray', 'skate', 'manta', 'whipray', 'eagle-ray'], what: 'Pectoral fins fused to the skull as soaring wings for effortless benthic or pelagic flight.' },
  flatfish: { clade: 'Side-lying flatfishes', kind: 'bony', lineage: 'flatfish', roots: ['Pleur', 'Both', 'Sole', 'Scophth', 'Cynogl'], nouns: ['flounder', 'sole', 'turbot', 'halibut', 'tonguefish'], what: 'A flattened, asymmetrical body resting on one flank with both eyes migrated to the upper face.' },
};

export const PLAN_NAMES: Record<Plan, string> = {
  fusiform: 'Fusiform cruiser (tuna / salmon / jack)',
  perch: 'Perciform generalist (snapper / bass / cichlid)',
  disc: 'Deep disc (angel / butterfly / tang)',
  cliffhead: 'Steep-browed cliffhead (mahi / parrot / trigger)',
  pike: 'Muscular ambush torpedo (pike / barracuda / gar)',
  benthic: 'Bottom hugger (sculpin / catfish / mudskipper)',
  armored: 'Box & globe hull (cowfish / puffer / lumpfish)',
  hatchet: 'Keel-bellied swimmer (hatchet / arowana / herring)',
  serpent: 'Serpentine swimmer (moray / conger / reedfish)',
  ribbon: 'Blade & knifefish (oarfish / cutlass / knifefish)',
  abyssalMaw: 'Great-jawed predator (angler / viperfish / fangtooth)',
  grenadier: 'Rattail & snailfish (grenadier / tadpole-fish)',
  sunfish: 'Clavus disc (ocean sunfish / opah)',
  sturgeon: 'Ganoid & lobe-fin (sturgeon / bichir / coelacanth)',
  seahorse: 'Curved ring-armour (seahorse / seadragon)',
  shark: 'Cartilaginous shark (requiem / hammerhead / carpet)',
  ray: 'Winged batoid (manta / stingray / skate)',
  flatfish: 'Side-lying flatfish (flounder / sole / turbot)',
};

// ── Multi-zone continuous profile synthesis ─────────────────────────────────
interface ShapeGenes {
  D: number;        // max total depth (SL)
  df: number;       // dorsal fraction of D above snout axis
  pD: number;       // station of dorsal apex
  pV: number;       // station of ventral apex
  P: number;        // caudal peduncle depth
  pedY: number;     // peduncle vertical offset
  sP: number;       // station where trunk meets tail root
  snoutMode: SnoutMode;
  bellyMode: BellyMode;
  foreSlope: number;  // 0.35 (steep cliff) .. 1.15 (sleek wedge)
  dFull: number;      // dorsal mid-trunk fullness 0.4 .. 1.5
  vFull: number;      // ventral mid-trunk fullness 0.4 .. 1.5
  tD: number;         // dorsal posterior taper exponent
  tV: number;         // ventral posterior taper exponent
  n: number;          // tip bluntness exponent for compileProfile
  sn?: number;        // rare forceps snout length
  snR?: number;       // rare forceps snout half-depth
  humps?: [number, number, number, number][];
}

function synthesizeSilhouette(g: ShapeGenes) {
  const Dd = g.D * g.df;
  const Dv = g.D * (1 - g.df);
  const Pd = Math.max(0.0025, g.P / 2 + g.pedY);
  const Pv = Math.max(0.0025, g.P / 2 - g.pedY);
  const sn = g.sn ?? 0;
  const snR = g.snR ?? 0;

  const evalDorsal = (s: number): number => {
    let y: number;
    if (s <= g.pD) {
      const x0 = sn * 0.78;
      const x = clamp((s - x0) / Math.max(1e-4, g.pD - x0));
      let rise: number;
      switch (g.snoutMode) {
        case 'blunt-cliff':
          // steep vertical brow rising quickly near the front, plateauing toward pD
          rise = Math.pow(clamp(1 - Math.pow(1 - x, 2.9)), 0.46);
          break;
        case 'concave-sniper': {
          // low snout bridge followed by a sweeping upward forehead curve
          const lin = Math.pow(x, 1.35);
          const late = Math.pow(Math.sin(x * Math.PI * 0.5), 0.72);
          rise = lerp(lin, late, sstep(0.18, 0.85, x));
          break;
        }
        case 'humped-nape': {
          const base = Math.pow(Math.sin(x * Math.PI * 0.5), 0.72);
          const crest = 0.18 * Math.exp(-(((x - 0.62) / 0.24) ** 2));
          rise = clamp(base + crest, 0, 1.08);
          break;
        }
        case 'broad-flat':
          // low flat skull roof rising gently to the nape
          rise = 0.36 * Math.pow(x, 0.65) + 0.64 * Math.pow(sstep(0.2, 1.0, x), 0.9);
          break;
        case 'wedge-torpedo':
          rise = Math.pow(Math.sin(x * Math.PI * 0.5), lerp(0.95, 1.25, clamp(g.foreSlope - 0.6)));
          break;
        default: // rounded-brow
          rise = Math.pow(Math.sin(x * Math.PI * 0.5), clamp(g.foreSlope, 0.45, 1.15));
      }
      if (sn > 0) {
        const tube = snR * Math.min(1, 0.65 + 0.35 * (s / sn)) * Math.min(1, Math.sqrt(s / 0.012));
        y = tube + Math.max(0, Dd - snR) * rise;
      } else {
        y = Dd * rise;
      }
    } else {
      const x = clamp((s - g.pD) / Math.max(1e-4, g.sP - g.pD));
      const a = lerp(2.8, 0.75, clamp((g.tD - 0.4) / 1.5));
      const fullness = lerp(1.05, 1.45, clamp(g.dFull - 0.5));
      y = Pd + (Dd - Pd) * Math.pow(Math.max(0, 1 - Math.pow(x, a)), fullness);
    }
    for (const [hs, hh, hw, sd] of g.humps ?? []) {
      if (sd === 1) y += hh * Math.exp(-(((s - hs) / hw) ** 2));
    }
    return Math.max(0.0014, y);
  };

  const evalVentral = (s: number): number => {
    let y: number;
    if (s <= g.pV) {
      const x0 = sn * 0.78;
      const x = clamp((s - x0) / Math.max(1e-4, g.pV - x0));
      let rise: number;
      switch (g.bellyMode) {
        case 'deep-keel':
          // razor-sharp chest dropping rapidly under the throat
          rise = Math.pow(clamp(1 - Math.pow(1 - x, 2.4)), 0.52);
          break;
        case 'flat-benthic':
          // chin slopes down quickly, then runs horizontally flat
          rise = Math.pow(sstep(0, 0.55, x), 0.75);
          break;
        case 'potbelly':
          rise = Math.pow(Math.sin(x * Math.PI * 0.5), 0.85) * (1 + 0.1 * Math.sin(x * Math.PI));
          break;
        case 'angular-diamond':
          rise = Math.pow(x, 0.76);
          break;
        default: // taut
          rise = Math.pow(Math.sin(x * Math.PI * 0.5), clamp(g.foreSlope * 0.95, 0.55, 1.25));
      }
      if (sn > 0) {
        const tube = snR * Math.min(1, 0.65 + 0.35 * (s / sn)) * Math.min(1, Math.sqrt(s / 0.012));
        y = tube + Math.max(0, Dv - snR) * rise;
      } else {
        y = Dv * rise;
      }
    } else {
      const x = clamp((s - g.pV) / Math.max(1e-4, g.sP - g.pV));
      const a = lerp(2.75, 0.78, clamp((g.tV - 0.4) / 1.5));
      const fullness = lerp(1.05, 1.45, clamp(g.vFull - 0.5));
      y = Pv + (Dv - Pv) * Math.pow(Math.max(0, 1 - Math.pow(x, a)), fullness);
    }
    for (const [hs, hh, hw, sd] of g.humps ?? []) {
      if (sd === -1) y += hh * Math.exp(-(((s - hs) / hw) ** 2));
    }
    return Math.max(0.0014, y);
  };

  return {
    d: STATIONS.map(evalDorsal),
    v: STATIONS.map(evalVentral),
  };
}

// ── Proportionate, anatomically coherent jaws (NO pinhole mouths!) ──────────
interface DietSpec {
  /** gape as a fraction of head length HL */
  gHL: [number, number];
  a: [number, number];
  o: [number, number];
  teeth: TeethKind[];
  pro: number;
  lip: number;
  gul: number;
  pos?: 'inf' | 'sup';
}

const DIET: Record<Niche, DietSpec> = {
  apex: { gHL: [0.38, 0.56], a: [14, 26], o: [36, 44], teeth: ['fang', 'cone', 'tri'], pro: 0.2, lip: 0.24, gul: 0.34 },
  pursuit: { gHL: [0.32, 0.48], a: [14, 28], o: [32, 40], teeth: ['cone', 'fang', 'needle', 'fine'], pro: 0.25, lip: 0.26, gul: 0.3 },
  ambush: { gHL: [0.42, 0.64], a: [22, 42], o: [40, 52], teeth: ['fine', 'cone', 'fang'], pro: 0.36, lip: 0.35, gul: 0.58 },
  lure: { gHL: [0.54, 0.78], a: [34, 56], o: [56, 74], teeth: ['fang'], pro: 0.1, lip: 0.2, gul: 0.62, pos: 'sup' },
  planktivore: { gHL: [0.22, 0.35], a: [24, 40], o: [30, 38], teeth: ['none', 'fine'], pro: 0.6, lip: 0.26, gul: 0.34 },
  filter: { gHL: [0.42, 0.64], a: [6, 16], o: [40, 48], teeth: ['none'], pro: 0.12, lip: 0.22, gul: 0.85 },
  grazer: { gHL: [0.19, 0.29], a: [6, 20], o: [28, 34], teeth: ['fine', 'beak'], pro: 0.32, lip: 0.58, gul: 0.24 },
  picker: { gHL: [0.18, 0.28], a: [8, 22], o: [26, 32], teeth: ['fine', 'cone'], pro: 0.45, lip: 0.44, gul: 0.25 },
  benthivore: { gHL: [0.24, 0.40], a: [2, 12], o: [30, 38], teeth: ['none', 'fine', 'cone'], pro: 0.65, lip: 0.72, gul: 0.42, pos: 'inf' },
  crusher: { gHL: [0.22, 0.35], a: [4, 14], o: [28, 34], teeth: ['cone', 'beak', 'fine'], pro: 0.16, lip: 0.58, gul: 0.24 },
  scavenger: { gHL: [0.28, 0.44], a: [10, 22], o: [32, 38], teeth: ['fine', 'cone'], pro: 0.24, lip: 0.34, gul: 0.32 },
  cryptic: { gHL: [0.20, 0.32], a: [18, 34], o: [30, 38], teeth: ['none', 'fine'], pro: 0.55, lip: 0.32, gul: 0.46 },
  crevice: { gHL: [0.34, 0.52], a: [8, 16], o: [28, 36], teeth: ['fang', 'cone', 'fine'], pro: 0.12, lip: 0.24, gul: 0.24 },
  parasite: { gHL: [0.25, 0.38], a: [8, 18], o: [30, 36], teeth: ['fine'], pro: 0.2, lip: 0.4, gul: 0.3 },
};

const DIET_TXT: Record<Niche, string> = {
  apex: 'Long, powerful terminal jaws armed with gripping teeth for seizing large prey.',
  pursuit: 'Crisp, sharp-toothed snapping jaws proportioned for overtaking fleeing fishes.',
  ambush: 'A wide, muscular mouth that flares open explosively to engulf prey by suction.',
  lure: 'A cavernous, upturned trap lined with long glassy fangs.',
  planktivore: 'An oblique, protrusible mouth that expands into a round funnel to pipette plankton.',
  filter: 'A broad, cavernous sieve gape that filters suspended plankton from the water column.',
  grazer: 'Stout scraping jaws or fused dental plates for cropping algae and coral.',
  picker: 'Agile, precisely controlled jaws for extracting invertebrates from reef crevices.',
  benthivore: 'A downturned, fleshy, protrusible mouth that vacuums and sifts the substrate.',
  crusher: 'Heavy muscular jaws and stout teeth or beaks built to crack shells and crustaceans.',
  scavenger: 'Broad generalist jaws suited to tearing carrion and bottom prey.',
  cryptic: 'Quick-snapping suction jaws tucked cleanly into a camouflaged head.',
  crevice: 'Deep-cleft gripping jaws built for seizing prey inside tight rocky holes.',
  parasite: 'Rasping jaws adapted for clinging to larger hosts.',
};

function buildJaws(niche: Niche, HL: number, D: number, r: Rnd, scale = 1): MouthSpec {
  const T = DIET[niche];
  const teeth = pick(r, T.teeth);
  const fang = teeth === 'fang';
  // Gape is proportional to HL and bounded safely so it NEVER shrinks to a pinhole or clips past the skull
  const rawGape = range(r, T.gHL[0], T.gHL[1]) * HL * scale;
  const minGape = Math.max(0.038, HL * 0.17);
  const maxGape = Math.min(HL * 0.84, Math.max(0.065, D * 0.72, HL * 0.75));
  const gape = clamp(rawGape, minGape, Math.max(minGape + 0.01, maxGape));
  const angle = range(r, T.a[0], T.a[1]);
  const m: MouthSpec = {
    s: 0,
    y: range(r, -0.18, 0.12),
    gape: r4(gape),
    angle: r4(angle),
    curve: range(r, -0.04, 0.05),
    open: Math.round(range(r, T.o[0], T.o[1])),
    jut: 0,
    lip: r4(T.lip * range(r, 0.85, 1.2)),
    protrude: r4(T.pro * range(r, 0.75, 1.15)),
    gular: r4(T.gul * range(r, 0.85, 1.15)),
    teeth,
    tn: teeth === 'none' ? 0 : teeth === 'beak' ? 4 : fang ? irange(r, 10, 16) : teeth === 'needle' ? irange(r, 15, 22) : irange(r, 9, 15),
    ts: r4(
      fang
        ? (niche === 'lure' ? range(r, 0.015, 0.028) : range(r, 0.008, 0.013))
        : teeth === 'cone'
          ? range(r, 0.005, 0.009)
          : teeth === 'needle'
            ? range(r, 0.006, 0.010)
            : teeth === 'tri'
              ? range(r, 0.007, 0.011)
              : range(r, 0.0035, 0.0065),
    ),
    kind: 'jaw',
  };
  if (teeth === 'beak') {
    m.beak = pick(r, ['#ebe4ce', '#dde7e0', '#cce0d8', '#f2e8d2']);
    m.sup = false;
    m.lip = Math.max(m.lip, 0.65);
  }
  if (T.pos === 'inf') {
    m.s = r4(range(r, 0.016, 0.042));
    m.y = r4(range(r, -0.68, -0.38));
    m.sup = false;
  } else if (T.pos === 'sup' || (niche === 'ambush' && angle >= 32)) {
    m.sup = true;
    m.jut = r4(range(r, 0.005, 0.014));
    m.y = r4(range(r, -0.02, 0.22));
  } else if (niche === 'apex' || niche === 'pursuit') {
    m.jut = r4(range(r, 0, 0.011));
  }
  return m;
}

const softShape = (speed: number, still: boolean, r: Rnd): FinShape =>
  speed > 0.72
    ? pick(r, ['falcate', 'tri', 'falcate', 'marlin'] as FinShape[])
    : speed > 0.44
      ? pick(r, ['tri', 'round', 'even', 'rect', 'falcate', 'lobe'] as FinShape[])
      : pick(r, (still ? ['round', 'even', 'veil', 'rect', 'plume', 'lobe'] : ['round', 'even', 'rect', 'round', 'lobe']) as FinShape[]);

// ── Main De-Novo Morphogenesis Entry ────────────────────────────────────────
export function genesis(
  H: Habitat,
  r: Rnd,
  wild: number,
  force?: { plan?: Plan; niche?: Niche; avoid?: Plan[]; avoidSnouts?: SnoutMode[] },
): Novo {
  const notes: Note[] = [];

  // 1 ── choose evolutionary bauplan & ecological diet
  const pw: Partial<Record<Plan, number>> = { ...PLANS[H.id] };
  for (const p of Object.keys(AFF) as Plan[]) {
    if (!(p in pw) && wild > 0.6 && !['hatchet', 'abyssalMaw', 'grenadier', 'flatfish', 'ray', 'seahorse'].includes(p)) {
      pw[p] = 0.22 * wild;
    }
  }
  (force?.avoid ?? []).forEach((p, i) => {
    if (pw[p]) pw[p] = pw[p]! * (i === 0 ? 0.02 : i === 1 ? 0.14 : 0.4);
  });
  const plan: Plan = force?.plan ?? wpick(r, pw, 'perch');

  const nw: Partial<Record<Niche, number>> = {};
  for (const [n, a] of Object.entries(AFF[plan]) as [Niche, number][]) {
    nw[n] = a * ((H.niches[n] ?? 0.05) + 0.06);
  }
  let niche: Niche = force?.niche ?? wpick(r, nw, 'picker');
  if (niche === 'parasite') niche = 'scavenger';
  if (niche === 'lure' && H.light > 0.35 && plan !== 'benthic' && plan !== 'abyssalMaw') niche = 'ambush';

  const I = INFO[plan];
  const speed = clamp(SPEED[niche] + (H.flow - 0.4) * 0.35 + (PLAN_SPEED[plan] ?? 0));
  const still = H.flow < 0.32;
  const deep = H.light < 0.2 && H.id !== 'cave';
  const fresh = H.realm === 'Freshwater' || H.realm === 'Subterranean';
  const hide = niche === 'ambush' || niche === 'cryptic' || niche === 'lure';

  // 2 ── body scale (log-uniform across habitat bounds)
  const [z0, z1] = H.size;
  const big = niche === 'apex' || niche === 'filter' ? 0.45 : niche === 'picker' || niche === 'planktivore' || niche === 'cryptic' ? -0.22 : niche === 'grazer' ? -0.08 : 0.05;
  let lenM = Math.exp(lerp(Math.log(z0), Math.log(z1 * (niche === 'filter' ? 2.2 : 1)), clamp(r() * 0.78 + 0.1 + big)));
  if (plan === 'shark' || plan === 'ray' || plan === 'sturgeon') lenM = Math.max(lenM * 1.6, 0.38);
  if (plan === 'sunfish') lenM = Math.max(lenM * 1.8, 0.45);
  if (plan === 'hatchet' || plan === 'seahorse') lenM = Math.min(lenM, 0.16);
  if (plan === 'serpent' || plan === 'ribbon') lenM *= 1.45;
  lenM = r4(clamp(lenM, 0.02, 12));

  // 3 ── eyes from light × body-size allometry
  const light = H.light * (1 - 0.5 * H.turb);
  let eyeF = range(r, 0.92, 1.12);
  let eyeWhy = '';
  let shine: number | undefined;
  if (H.id === 'cave') {
    eyeF = chance(r, 0.65) ? 0 : 0.38;
