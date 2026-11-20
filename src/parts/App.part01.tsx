import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  Activity, ArrowDown, ArrowDownRight, ArrowLeftRight, Bird, BookOpen, Box, ChevronDown,
  ChevronRight, CircleHelp, Crosshair, Dices, Dna, Droplets, Eye, Fish, FishSymbol, FlaskConical,
  GitBranch, Keyboard, Layers3, Leaf, Minus, Mountain, Mouse, PanelLeft, Plus,
  ScanLine, Search, Shell, SlidersHorizontal, Snowflake, Sparkles, Sprout, Waves, X, Zap,
  type LucideIcon,
} from 'lucide-react';
import Viewer, { type CameraAction, type ViewName } from './components/Viewer';
import FieldGuide, { RefImg } from './components/FieldGuide';
import Thumb from './components/Thumb';
import { GROUPS, SPECIES } from './data/species';
import type { Species } from './engine/types';
import { HABITAT, HABITATS, type HabitatId } from './gen/habitats';
import { LINEAGES, NICHE_INFO, type LineageId } from './gen/lineages';
import { PLAN_NAMES, type Plan } from './gen/genesis';
import { blind, census as makeCensus, cross, fromSpecies, generate, migrate, offspring, SPECIES_BY_ID, type GenFish } from './gen/generate';
import { discover, rate, type Discovery } from './gen/discover';

let audioCtx: AudioContext | null = null;
function chime(power: number, living: boolean) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx ??= new AC();
    const ac = audioCtx;
    if (ac.state === 'suspended') void ac.resume();
    const t0 = ac.currentTime + 0.03;
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.11, t0 + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    master.connect(ac.destination);
    const base = living ? 523.25 : 392 * Math.pow(2, Math.round(power * 7) / 12);
    const steps = living
      ? [0, 4, 7, 12, 16]
      : power > 0.85
        ? [0, 7, 12, 16, 19, 24, 28]
        : power > 0.6
          ? [0, 4, 7, 11, 14]
          : power > 0.4
            ? [0, 7, 12, 16]
            : [0, 7, 12];
    steps.forEach((st, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = base * Math.pow(2, st / 12);
      o.detune.value = ((i % 3) - 1) * 4;
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.42 / (1 + i * 0.3), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 + power);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 1.6 + power);
    });
  } catch {
    /* audio unavailable */
  }
}

const qs = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
function numberParam(key: string, fallback: number) {
  const n = Number(qs.get(key));
  return qs.has(key) && Number.isFinite(n) ? n : fallback;
}
const UI = numberParam('ui', 1) > 0;
const randSeed = () => Math.floor(Math.random() * 1e9) + 2;
const VIEWS: [ViewName, string][] = [
  ['side', 'Lateral'],
  ['three', '¾ View'],
  ['front', 'Mouth'],
  ['top', 'Dorsal'],
  ['below', 'Ventral'],
  ['portrait', 'Portrait'],
];
const NOVELTY = [
  [0.08, 'De-novo · natural', '100% procedural morphogenesis from first principles — favours the commonest evolutionary body plans of this water.'],
  [0.45, 'De-novo · diverse', 'Every click grows a new silhouette, forehead geometry, jaw mechanics, fin architecture, tail and livery from ecology.'],
  [0.78, 'De-novo · wild', 'Unlocks rare evolutionary builds, dramatic sails, streamers, horns, dermal flaps and bioluminescent lures — still coherent.'],
] as const;

const PRESETS: { id: string; label: string; focus: string; anchor: string; hab: HabitatId; seed: number; lineage?: LineageId; view: ViewName; gape?: number }[] = [
  { id: 'shark', label: 'Reef shark', focus: 'Dorsal foil', anchor: 'tiger-shark', hab: 'reef', seed: 23, lineage: 'sharkPelagic', view: 'three' },
  { id: 'manta', label: 'Reef manta', focus: 'Cephalic lobes', anchor: 'reef-manta-ray', hab: 'reef', seed: 308, lineage: 'manta', view: 'three' },
  { id: 'frogfish', label: 'Frogfish', focus: 'Jaw hinge', anchor: 'warty-frogfish', hab: 'reef', seed: 36, view: 'three', gape: 0.68 },
  { id: 'cowfish', label: 'Cowfish', focus: 'Horn roots', anchor: 'longhorn-cowfish', hab: 'reef', seed: 22, lineage: 'tetraodont', view: 'three' },
  { id: 'flounder', label: 'Flounder', focus: 'Dorsal eyes', anchor: 'peacock-flounder', hab: 'reef', seed: 198, view: 'three' },
  { id: 'porcupine', label: 'Porcupinefish', focus: 'Beak & lips', anchor: 'porcupinefish', hab: 'reef', seed: 101, lineage: 'tetraodont', view: 'three', gape: 0.5 },
  { id: 'guppy', label: 'Guppy', focus: 'Eye socket', anchor: 'guppy', hab: 'swamp', seed: 1, lineage: 'labyrinth', view: 'side' },
];
const presetFromUrl = PRESETS.find((p) => p.id === qs.get('preset'));
const initialView = VIEWS.some(([v]) => v === qs.get('view')) ? (qs.get('view') as ViewName) : presetFromUrl?.view ?? 'three';
const iconFor: Partial<Record<HabitatId, LucideIcon>> = {
  reef: Shell, kelp: Sprout, seagrass: Leaf, pelagic: Waves, twilight: Layers3, abyss: Eye,
  hadal: ArrowDown, sandflat: Shell, rocky: Mountain, polar: Snowflake, estuary: Sprout,
  stream: Mountain, river: Droplets, amazon: Leaf, lake: Waves, swamp: Leaf, cave: Mountain,
};
const tones: Partial<Record<HabitatId, string>> = {
  reef: '#63dfec', kelp: '#91c98f', seagrass: '#80cabc', pelagic: '#77bff3', twilight: '#ab9ce8',
  abyss: '#bd91d5', sandflat: '#e7bb8d', swamp: '#b5c67e', river: '#8bca93', polar: '#b3e3f5',
};
const mainBiomes = ['reef', 'kelp', 'seagrass', 'pelagic', 'twilight', 'abyss', 'sandflat', 'swamp'];
const photoBiomes = ['reef', 'pelagic', 'seagrass', 'sandflat', 'kelp', 'rocky'];
const depthLabel = (d: number) => (d >= 1000 ? `${+(d / 1000).toFixed(1)} km` : `${d} m`);

function loadPreset(p: (typeof PRESETS)[number]) {
  return SPECIES_BY_ID[p.anchor] ? fromSpecies(SPECIES_BY_ID[p.anchor]) : generate(p.hab, p.seed, { novelty: 0.68, lineage: p.lineage });
}

function initialFish() {
  const id = qs.get('sp');
  if (id && SPECIES_BY_ID[id]) return fromSpecies(SPECIES_BY_ID[id]);
  if (qs.has('blind')) return blind(numberParam('blind', 14));
  if (presetFromUrl) return loadPreset(presetFromUrl);
  const habitat = qs.get('hab') as HabitatId | null;
  const lineage = qs.get('lineage') as LineageId | null;
  if (habitat || qs.has('seed') || qs.has('nov')) {
    const plan = qs.get('plan') as Plan | null;
    if (qs.get('d') === '1' && !plan && !lineage) {
      return discover(habitat && HABITAT[habitat] ? habitat : 'reef', numberParam('seed', 7), numberParam('nov', 0.68)).fish;
    }
    return generate(habitat && HABITAT[habitat] ? habitat : 'reef', numberParam('seed', 7), {
      novelty: Math.max(0.12, numberParam('nov', 0.68)),
      lineage: lineage && LINEAGES[lineage] ? lineage : undefined,
      plan: plan && PLAN_NAMES[plan] ? plan : undefined,
    });
  }
  return discover('reef', Math.floor(Math.random() * 1e9) + 2, 0.68).fish;
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button className="motion-switch" type="button" role="switch" aria-checked={on} onClick={() => set(!on)}>
      <span className="switch-track" aria-hidden="true"><span /></span>
      {label}
    </button>
  );
}

function Slider({
  label, value, step, min = 0, max = 1, display, onChange, kind = '', disabled = false,
}: {
  label: string; value: number; step: number; min?: number; max?: number; display: string; onChange: (v: number) => void; kind?: string; disabled?: boolean;
}) {
  return (
    <label className={`slider-control ${kind}`}>
      <span className="slider-head"><span>{label}</span><output>{display}</output></span>
      <input
        type="range" value={value} aria-label={label} min={min} max={max} step={step} disabled={disabled}
        onChange={(e) => onChange(+e.currentTarget.value)}
        style={{ '--progress': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </label>
  );
}

function Help({ close }: { close: () => void }) {
  const el = useRef<HTMLDialogElement>(null);
  useEffect(() => { el.current?.showModal(); }, []);
  const keys = [
    ['G', 'Generate a completely new de-novo species'],
    ['B', 'Surprise specimen from any Earth biome'],
    ['O', 'Produce mutated offspring'],
    ['Space', 'Trigger a feeding strike'],
    ['R', 'Reset the current camera view'],
  ];
  return (
    <dialog ref={el} className="help-dialog" onClose={close} onClick={(e) => { if (e.target === e.currentTarget) close(); }} aria-labelledby="help-title">
      <div className="help-card">
        <button className="icon-button dialog-close" onClick={close} aria-label="Close shortcuts"><X size={17} /></button>
        <span className="section-label"><Keyboard size={15} /> Viewer controls</span>
        <h2 id="help-title">Inspect the specimen</h2>
        <p>Drag to orbit, scroll or pinch to zoom, and choose a view to study a particular part of the anatomy.</p>
        {keys.map(([key, task]) => <div className="key-item" key={key}><span>{task}</span><kbd>{key}</kbd></div>)}
      </div>
    </dialog>
  );
}

export default function App() {
  const [fish, setFish] = useState<GenFish>(initialFish);
  const [hab, setHab] = useState<HabitatId>(fish.habitat);
  const [novelty, setNovelty] = useState(Math.max(0.12, numberParam('nov', 0.68)));
  const [planPick, setPlanPick] = useState<Plan | ''>(() => {
    const p = qs.get('plan') as Plan | null;
    return p && PLAN_NAMES[p] ? p : '';
  });
  const [log, setLog] = useState<GenFish[]>(() => [fish]);
  const [tab, setTab] = useState<'gen' | 'atlas'>(qs.has('sp') ? 'atlas' : 'gen');
  const [pending, setPending] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [censusSeed, setCensusSeed] = useState(1);
  const [allBiomes, setAllBiomes] = useState(false);
  const [allPresets, setAllPresets] = useState(false);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');
  const [gape, setGape] = useState(numberParam('gape', presetFromUrl?.gape ?? 0));
  const [maxJaw, setMaxJaw] = useState(fish.species.mouth.open);
  const [autoFeed, setAutoFeed] = useState(numberParam('feed', 0) > 0);
  const [swim, setSwim] = useState(numberParam('swim', 1) > 0);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewName>(initialView);
  const [viewNonce, setViewNonce] = useState(0);
  const [cameraAction, setCameraAction] = useState<CameraAction>();
  const [strike, setStrike] = useState(0);
  const [wire, setWire] = useState(numberParam('wire', 0) > 0);
  const [panel, setPanel] = useState(UI && numberParam('panel', 1) > 0 && window.innerWidth >= 1040);
  const [list, setList] = useState(UI && numberParam('list', 1) > 0 && window.innerWidth >= 720);
  const [fins, setFins] = useState(numberParam('fins', 1) > 0);
  const [eyes, setEyes] = useState(numberParam('eyes', 1) > 0);
  const [breathe, setBreathe] = useState(numberParam('breathe', 1) > 0);
  const [help, setHelp] = useState(false);
  const [magic, setMagic] = useState(() => {
    const d = rate(fish);
    return { color: d.color, label: d.label, tier: d.tier, kind: d.kind, power: d.power, nonce: 0 };
  });
  const [codex, setCodex] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ig-codex-plans') || '[]') as string[]; } catch { return []; }
  });
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem('ig-sound') !== '0'; } catch { return true; }
  });
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sp = fish.species, H = HABITAT[fish.habitat], sel = HABITAT[hab];
  const census = useMemo(
    () => makeCensus(fish.habitat, censusSeed * 7919 + fish.habitat.length, 9, fish.novelty),
    [fish.habitat, fish.novelty, censusSeed],
  );

  const run = useCallback((fn: () => GenFish, url?: string, pose?: { view: ViewName; gape?: number }, found?: Discovery) => {
    clearTimeout(timer.current);
    setPending(true);
    timer.current = setTimeout(() => {
      try {
        const f = fn();
        setFish(f);
        const d = found ?? rate(f);
        setMagic((m) => ({ color: d.color, label: d.label, tier: d.tier, kind: d.kind, power: d.power, nonce: m.nonce + 1 }));
        if (soundRef.current) chime(d.power, d.kind === 'living');
        if (f.plan) {
          setCodex((c) => {
            if (c.includes(f.plan!)) return c;
            const n = [...c, f.plan!];
            try { localStorage.setItem('ig-codex-plans', JSON.stringify(n)); } catch { /* private mode */ }
            return n;
          });
        }
        setHab(f.habitat);
        setMaxJaw(f.species.mouth.open);
        setGape(pose?.gape ?? 0);
        if (pose) { setView(pose.view); setAutoFeed(false); }
        setLog((l) => [f, ...l.filter((x) => x.key !== f.key)].slice(0, 40));
        if (url !== undefined) history.replaceState(null, '', location.pathname + url);
        if (window.innerWidth < 720) setList(false);
        setPending(false);
      } catch (error) {
        console.error('Unable to build specimen', error);
        setPending(false);
      }
    }, 54);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Every click generates a 100% de-novo specimen with a distinct bauplan & forehead architecture
  const doGenerate = (h = hab) => {
    const recentPlans = [fish, ...log].filter((f) => f.plan).slice(0, 4).map((f) => f.plan!);
    const recentSnouts = [fish, ...log].filter((f) => f.snoutMode).slice(0, 2).map((f) => f.snoutMode!);
    const plan = planPick || undefined;
    let seed = randSeed();
    let d = discover(h, seed, novelty, plan, recentPlans, recentSnouts);
    for (let i = 0; !plan && i < 6 && d.fish.plan && recentPlans.slice(0, i < 3 ? 3 : 1).includes(d.fish.plan); i++) {
      seed = randSeed();
      d = discover(h, seed, novelty, undefined, recentPlans, recentSnouts);
    }
    const made = d;
    run(() => made.fish, `?hab=${h}&seed=${seed}&nov=${novelty.toFixed(2)}${plan ? `&plan=${plan}` : '&d=1'}`, undefined, made);
  };

  const doBlind = () => {
    const seed = randSeed();
    run(() => blind(seed), `?blind=${seed}`);
  };
  const doOffspring = () => {
    const seed = randSeed();
    run(() => offspring(fish, seed));
  };
  const doMigrate = (h: HabitatId) => {
    const seed = randSeed();
    setMigrating(false);
    run(() => migrate(fish, h, seed, novelty));
  };
  const doAtlas = (s: Species) => run(() => fromSpecies(s), `?sp=${s.id}`);
  const fire = () => { if (maxJaw > 0) { setGape(0); setStrike((n) => n + 1); } };
  const camera = (kind: CameraAction['kind']) => setCameraAction((a) => ({ kind, nonce: (a?.nonce ?? 0) + 1 }));
  const pickFish = (f: GenFish) => {
    if (crossing && f.key !== fish.key) {
      setCrossing(false);
      const seed = randSeed();
      run(() => cross(fish, f, seed));
    } else if (f.key !== fish.key) {
      run(() => f);
    }
  };

  const shortcuts = useRef({ doGenerate, doBlind, doOffspring, fire, camera, help });
  shortcuts.current = { doGenerate, doBlind, doOffspring, fire, camera, help };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || shortcuts.current.help || (e.target as HTMLElement | null)?.closest('input,select,textarea,button,[contenteditable]')) return;
      const actions = shortcuts.current;
      switch (e.key.toLowerCase()) {
        case 'g': actions.doGenerate(); break;
        case 'b': actions.doBlind(); break;
        case 'o': actions.doOffspring(); break;
        case 'r': actions.camera('fit'); break;
        case ' ': e.preventDefault(); actions.fire(); break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const filtered = SPECIES.filter((s) => (group === 'All' || group === s.group) && `${s.name} ${s.sci}`.toLowerCase().includes(q.trim().toLowerCase()));
  const biomes = allBiomes ? HABITATS : (mainBiomes.includes(hab) ? mainBiomes : [...mainBiomes.slice(0, -1), hab]).map((id) => HABITAT[id as HabitatId]).filter(Boolean);
  const stop = [...NOVELTY].reverse().find(([n]) => novelty >= n) ?? NOVELTY[0];
  const photo = photoBiomes.includes(H.id);
  const backdrop = `linear-gradient(180deg, ${H.amb.bg.join(', ')})`;
  const specLabel = fish.real ? 'Atlas reference' : fish.origin === 'mutated' ? 'Offspring' : fish.origin === 'crossed' ? 'Hybrid' : fish.plan && fish.origin !== 'migrated' ? 'De-novo species' : 'Procedural';
  const selectPreset = (p: (typeof PRESETS)[number]) => {
    run(() => loadPreset(p), `?preset=${p.id}`, p);
  };
  const totalPlans = Object.keys(PLAN_NAMES).length;

  return (
    <div className={`lab-shell ${UI ? '' : 'bare'}`}>
      {UI && (
        <header className="lab-header">
          <button className="brand" type="button" onClick={() => { setTab('gen'); setList(true); }} title="Open generator">
            <span className="brand-mark"><FishSymbol size={23} strokeWidth={1.75} /></span>
            <span><strong>Ichthyo<span>Genesis</span></strong><small>DE-NOVO MORPHOGENESIS LAB</small></span>
          </button>
          <div className="header-meta"><span className="divider" />{totalPlans} evolutionary bauplans <i /> {HABITATS.length} environments</div>
          <div className="header-actions">
            <span className="engine-live"><span className="live-dot" /> Procedural Engine <small>v2</small></span>
            <div className="header-divider" />
            <button className={`icon-button ${list ? 'is-active' : ''}`} type="button" title={list ? 'Hide generator' : 'Show generator'} aria-label="Toggle generator" aria-expanded={list} onClick={() => { setList(!list); if (!list && window.innerWidth < 720) setPanel(false); }}><PanelLeft size={17} /></button>
            <button className={`guide-button ${panel ? 'is-active' : ''}`} type="button" aria-label="Toggle field guide" aria-expanded={panel} onClick={() => { setPanel(!panel); if (!panel && window.innerWidth < 1040) setList(false); }}><BookOpen size={16} /><span>Field Guide</span></button>
            <button className="icon-button" type="button" title="Keyboard shortcuts" aria-label="Keyboard shortcuts" onClick={() => setHelp(true)}><CircleHelp size={17} /></button>
          </div>
        </header>
      )}
      <div className="workspace">
        {UI && (list || panel) && <button tabIndex={-1} aria-label="Close side panels" className="drawer-scrim" onClick={() => { setList(false); setPanel(false); }} />}
        {UI && list && (
          <aside className="generator-panel" aria-label="Species generator">
            <div className="generator-top">
              <div className="panel-tabs" aria-label="Workspace mode">
                <button className={tab === 'gen' ? 'selected' : ''} aria-pressed={tab === 'gen'} onClick={() => setTab('gen')}><FlaskConical size={15} /> Generator</button>
                <button className={tab === 'atlas' ? 'selected' : ''} aria-pressed={tab === 'atlas'} onClick={() => setTab('atlas')}><BookOpen size={15} /> Atlas <small>{SPECIES.length}</small></button>
              </div>
              <button className="icon-button mobile-close" onClick={() => setList(false)} aria-label="Close generator"><X size={17} /></button>
            </div>
            {tab === 'gen' ? (
              <>
                <div className="left-scroll scroll-area">
                  <section className="env-section">
                    <div className="section-heading"><h2 className="section-label"><Waves size={15} /> Environment</h2><span className="mono muted">{HABITATS.length} biomes</span></div>
                    <div className="biome-grid">
                      {biomes.map((b) => {
                        const Icon = iconFor[b.id] ?? Waves;
                        return (
                          <button key={b.id} type="button" className={`biome-card ${hab === b.id ? 'selected' : ''}`} style={{ '--tone': tones[b.id] ?? '#86b8cd' } as CSSProperties} aria-pressed={hab === b.id} title={b.blurb} onClick={() => { if (hab !== b.id) { setHab(b.id); doGenerate(b.id); } }}>
                            <Icon size={17} strokeWidth={1.65} /><span><strong>{b.name}</strong><small>{b.realm} · {depthLabel(b.depth[1])}</small></span>
                          </button>
                        );
                      })}
                    </div>
                    <button className="text-button show-more" aria-expanded={allBiomes} onClick={() => setAllBiomes((v) => !v)}>{allBiomes ? 'Show featured biomes' : 'View all environments'} <ChevronDown className={allBiomes ? 'flipped' : ''} size={14} /></button>
                    <p className="env-description">{sel.blurb}</p>
                  </section>
                  <section className="novelty-section">
                    <h2 className="section-label"><Dna size={15} /> Morphogenesis</h2>
                    <Slider label="Morphological wildness" value={novelty} min={0.08} max={1} step={0.01} display={`${Math.round(novelty * 100)}%`} onChange={setNovelty} />
                    <div className="range-ends"><button onClick={() => setNovelty(0.15)}>Natural</button><button onClick={() => setNovelty(1)}>Wild</button></div>
                    <p><strong>{stop[1]}.</strong> {stop[2]}</p>
                    <label className="migrate-label plan-pick">Body construction
                      <select value={planPick} onChange={(e) => setPlanPick(e.target.value as Plan | '')} aria-label="Body construction">
                        <option value="">Any — selected by habitat physics</option>
                        {(Object.keys(PLAN_NAMES) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_NAMES[p]}</option>)}
                      </select>
                    </label>
                  </section>
                  <section className="preset-section">
                    <div className="section-heading"><h2 className="section-label"><ScanLine size={15} /> Anatomy references</h2><button className="text-button" onClick={() => setAllPresets((v) => !v)} aria-expanded={allPresets}>{allPresets ? 'Less' : 'View all'} <ChevronRight size={13} /></button></div>
                    <div className="preset-grid">{PRESETS.slice(0, allPresets ? PRESETS.length : 4).map((p) => (
                      <button onClick={() => selectPreset(p)} key={p.id} className={`preset ${fish.anchor === p.anchor ? 'active' : ''}`} title={`${p.label} — ${p.focus}`}>
                        <Thumb sp={SPECIES_BY_ID[p.anchor]} w={49} h={28} /><span><strong>{p.label}</strong><small>{p.focus}</small></span>
                      </button>
                    ))}</div>
                  </section>
                  <section className="lineage-section">
                    <h2 className="section-label"><GitBranch size={15} /> Evolution tools</h2>
                    <div className="lineage-actions">
                      <button className="secondary-button" onClick={doOffspring}><Dna size={14} /> Offspring</button>
                      <button className={`secondary-button ${migrating ? 'is-active' : ''}`} onClick={() => { setMigrating(!migrating); setCrossing(false); }}><Bird size={14} /> Migrate</button>
                      <button className={`secondary-button ${crossing ? 'is-active' : ''}`} onClick={() => { setCrossing(!crossing); setMigrating(false); }}><ArrowLeftRight size={14} /> Cross</button>
                    </div>
                    {migrating && <label className="migrate-label">Select a destination<select defaultValue="" onChange={(e) => { if (e.target.value) doMigrate(e.target.value as HabitatId); }}><option value="" disabled>Choose an environment</option>{HABITATS.filter((b) => b.id !== H.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
                    {crossing && <p className="side-notice">Select a second specimen from the log or the ecosystem census.</p>}
                  </section>
                  <section className="log-section">
                    <div className="section-heading"><h2 className="section-label">Specimen log</h2><span className="mono muted">{log.length}</span></div>
                    {log.map((f) => (
                      <button key={f.key} onClick={() => pickFish(f)} className={`specimen-row ${f.key === fish.key ? 'selected' : ''}`}>
                        <Thumb sp={f.species} w={49} h={28} /><span><strong>{f.common}</strong><small>{HABITAT[f.habitat].name} · {f.real ? 'Reference' : `${f.plan ?? 'de-novo'}`}</small></span><ChevronRight size={13} />
                      </button>
                    ))}
                  </section>
                </div>
                <div className="generator-footer">
                  <button className="generate-button" onClick={() => doGenerate()} disabled={pending}><Sparkles size={17} /> Generate specimen <kbd>G</kbd></button>
                  <button className="secondary-button surprise" onClick={doBlind} disabled={pending}><Dices size={16} /> Surprise me <kbd>B</kbd></button>
                </div>
              </>
            ) : (
              <div className="atlas-panel">
                <div className="atlas-search">
                  <label className="search-box"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${SPECIES.length} reference species…`} aria-label="Search the atlas" />{q && <button className="icon-button" aria-label="Clear search" onClick={() => setQ('')}><X size={14} /></button>}</label>
                  <label className="migrate-label atlas-filter"><Layers3 size={15} /><select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Atlas species group">{['All', ...GROUPS].map((g) => <option key={g} value={g}>{g === 'All' ? 'All taxonomic groups' : g}</option>)}</select></label>
                  <div className="section-heading atlas-count"><h2 className="section-label"><Fish size={15} /> Reference atlas</h2><span className="mono muted">{filtered.length} results</span></div>
                </div>
                <div className="atlas-results scroll-area">
                  {filtered.map((s) => (
                    <button key={s.id} type="button" className={`specimen-row ${sp.id === s.id ? 'selected' : ''}`} onClick={() => doAtlas(s)}>
                      <RefImg id={s.id} thumb alt="" className="atlas-thumb" /><span><strong>{s.name}</strong><small><i>{s.sci}</i></small></span><ChevronRight size={13} />
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="empty-state">No species match your search.</p>}
                </div>
              </div>
            )}
          </aside>
        )}
        <main className="stage" aria-label="3D specimen viewer" aria-busy={pending}>
          <div className="water-photo" style={{ opacity: photo ? 1 : 0.22 }} />
          <div className="water-tone" style={{ backgroundImage: backdrop, opacity: photo ? 0.14 : 0.7 }} />
          <div className="water-vignette" />
          <Viewer species={sp} seed={fish.seed} gape={gape} autoFeed={autoFeed} swim={swim} speed={speed} view={view} viewNonce={viewNonce} cameraAction={cameraAction} strike={strike} wire={wire} fins={fins} eyes={eyes} breathe={breathe} amb={H.amb} magic={magic} onBuilt={(a) => { setPending(false); setMaxJaw(a); }} />
          <div className="magic-flash" key={`f${magic.nonce}`} data-tier={magic.tier} style={{ '--tier': magic.color } as CSSProperties} aria-hidden="true" />
          {UI && (
