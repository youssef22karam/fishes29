    eyeWhy = eyeF ? 'Vestigial eyes: a cave colonist gradually losing sight.' : 'In permanent darkness eyes are costly — regressed beneath skin while the lateral line dominates.';
  } else if (light < 0.03) {
    eyeF = hide || niche === 'apex' ? range(r, 0.75, 1.0) : range(r, 0.5, 0.75);
    eyeWhy = 'Below sunlight reach, smell and lateral-line vibration guide the hunt.';
  } else if (light < 0.2) {
    eyeF = range(r, 1.4, 1.85);
    eyeWhy = 'Enlarged eyes harvest the last twilight photons and bioluminescent flashes.';
  } else if (light < 0.35) {
    eyeF = range(r, 1.15, 1.35);
    eyeWhy = 'Enlarged eyes tuned for dim or tannin-stained water.';
  } else if (H.turb > 0.6) {
    eyeF = range(r, 0.72, 0.9);
    eyeWhy = 'Compact eyes suited to turbid water where barbels and touch lead.';
  }
  if (eyeF > 0 && (light < 0.3 || H.turb > 0.55)) shine = r4(range(r, 0.3, 0.6));
  const eyeRel = clamp(0.175 * Math.pow(lenM, -0.2), 0.08, 0.38) * eyeF;

  let sp: Species;
  let chosenSnoutMode: SnoutMode = 'rounded-brow';
  const id0 = `novo-${plan}`;

  // ═══ WINGED BATOID (RAY / SKATE / MANTA) ══════════════════════════════════
  if (plan === 'ray') {
    const filter = niche === 'filter';
    const span = filter ? range(r, 0.52, 0.66) : range(r, 0.32, 0.52);
    const sting = !filter && chance(r, 0.62);
    sp = make(A.ray, {
      id: id0, name: '', sci: '', group: 'Rays & skates', note: '', lenM,
      body: {
        D: r4(range(r, 0.06, 0.1)),
        disc: {
          span: r4(span), end: r4(range(r, 0.42, 0.62)), pW: r4(filter ? range(r, 0.28, 0.38) : range(r, 0.2, 0.38)),
          fr: r4(filter ? range(r, 1.25, 1.7) : range(r, 0.7, 1.3)),
          bk: r4(filter ? range(r, 1.3, 1.85) : range(r, 0.8, 1.5)),
          tailW: r4(range(r, 0.009, 0.022)),
        },
        P: r4(range(r, 0.009, 0.019)),
      },
      eye: { s: r4(range(r, 0.085, 0.13)), y: 0.95, d: r4(clamp(range(r, 0.018, 0.028) * Math.max(0.55, eyeF), 0.01, 0.032)), iris: '#3b3a2a', pupil: 'crescent' },
      ...(sting ? { spikes: [{ s: r4(range(r, 0.58, 0.68)), y: 1, len: r4(range(r, 0.045, 0.075)), dir: [-1, 0.2, 0], r: 0.12, mirror: false }] } : {}),
    } as SP);
    if (filter && chance(r, 0.65)) {
      sp.cephalic = { length: r4(range(r, 0.09, 0.14)), width: r4(range(r, 0.045, 0.072)), curl: r4(range(r, 0.8, 1.45)) };
      notes.push({ icon: '◠', title: 'Cephalic lobes', text: 'Fleshy horn-like lobes unfurl beside the mouth to funnel plankton swarms inward.' });
    }
    notes.push({ icon: '◈', title: filter ? 'Soaring wings' : 'Gliding disc', text: filter ? 'Broad, swept pectoral wings built for tireless open-ocean flight.' : `A ${span > 0.44 ? 'wide' : 'compact'} cartilaginous disc that undulates over the seabed.` });
    if (sting) notes.push({ icon: '†', title: 'Venomous tail barb', text: 'A serrated spine mounted mid-tail deters predators from above.' });
  }

  // ═══ SIDE-LYING FLATFISH ══════════════════════════════════════════════════
  else if (plan === 'flatfish') {
    const D = range(r, 0.36, 0.66);
    const h = clamp(0.038 + D * 0.072, 0.042, 0.09) * range(r, 0.85, 1.15);
    const tongue = chance(r, 0.22);
    const ct = tongue ? 'pointed' : pick(r, ['rounded', 'rounded', 'truncate', 'emarginate', 'spade'] as CaudalType[]);
    const d0 = range(r, 0.05, 0.12);
    sp = make(A.flat, {
      id: id0, name: '', sci: '', group: 'Flatfishes', note: '', lenM,
      plan: chance(r, 0.5) ? 'flatR' : 'flatL',
      HL: r4(range(r, 0.2, 0.28)),
      body: {
        D: r4(D), pD: r4(range(r, 0.34, 0.48)), pV: r4(range(r, 0.38, 0.5)),
        P: r4(tongue ? range(r, 0.035, 0.052) : range(r, 0.075, 0.115)),
        bD: r4(range(r, 0.42, 0.72)), bV: r4(range(r, 0.42, 0.72)), tD: r4(range(r, 1.05, 1.4)), tV: r4(range(r, 1.05, 1.4)),
      },
      mouth: { gape: r4(niche === 'ambush' ? range(r, 0.06, 0.095) : range(r, 0.04, 0.06)), angle: r4(range(r, 24, 36)), teeth: niche === 'ambush' ? 'cone' : 'fine' },
      eye: { s: r4(range(r, 0.075, 0.115)), y: r4(range(r, 0.58, 0.68)), d: r4(clamp(range(r, 0.036, 0.052) * Math.max(0.6, eyeF), 0.022, 0.06)), iris: '#4a5a5a', pupil: 'crescent' },
      fins: {
        dorsal: [M(r4(d0), tongue ? 0.985 : 0.93, r4(h), 'even')],
        anal: [M(r4(range(r, 0.2, 0.28)), tongue ? 0.985 : 0.93, r4(h), 'even')],
        caudal: tongue ? { type: 'pointed', span: 0.07, len: 0.08 } : { ...caudalGeom(ct, D * 0.62, 0.09, r) },
      },
    } as SP);
    notes.push({ icon: '◖', title: tongue ? 'Tongue-shaped flatfish' : D > 0.52 ? 'Diamond flatfish' : 'Oval flatfish', text: `${I.what} A continuous perimeter fin fringe ripples to hover just above sand.` });
  }

  // ═══ CURVED-POSTURE SEAHORSE / SEADRAGON ══════════════════════════════════
  else if (plan === 'seahorse') {
    const D = range(r, 0.13, 0.21);
    const HL = range(r, 0.24, 0.31);
    const snLen = range(r, 0.085, 0.125);
    const bend: [number, number][] = [
      [0, r4(range(r, 52, 68))],
      [0.24, r4(range(r, -16, -6))],
      [0.54, r4(range(r, -12, -4))],
      [0.82, r4(range(r, 18, 34))],
      [1, r4(range(r, 42, 62))],
    ];
    const d0 = range(r, 0.36, 0.44);
    const d1 = d0 + range(r, 0.12, 0.18);
    sp = make(A.perch, {
      id: id0, name: '', sci: '', group: 'Seahorses & pipefishes', note: '', lenM,
      HL: r4(HL),
      body: {
        D: r4(D), df: 0.46, pD: 0.36, pV: 0.4, P: r4(range(r, 0.012, 0.02)), pedY: 0,
        bD: 0.6, bV: 0.55, tD: 0.95, tV: 0.95, W: r4(range(r, 0.46, 0.62)), Wh: 0.85, Wt: 0.5, sq: 2.6,
        snout: { len: r4(snLen), r: r4(range(r, 0.016, 0.024)), tip: 0.72, comp: 0.8, flare: 1.2 },
        bend,
        bumps: [[r4(snLen + 0.06), r4(D * 0.18), 0.04, 1]],
      },
      mouth: { s: 0, y: 0, gape: r4(range(r, 0.018, 0.026)), angle: 12, curve: 0, open: 22, jut: 0, lip: 0.35, protrude: 0.4, gular: 0.35, teeth: 'none', tn: 0, ts: 0.002, kind: 'jaw' },
      eye: { s: r4(snLen + 0.042), y: r4(range(r, 0.42, 0.58)), d: r4(clamp(range(r, 0.028, 0.042), 0.02, 0.048)), iris: '#c8a040', bulge: 0.55 },
      gill: { kind: 'pore' },
      traits: { gill: 'pore' },
      skin: { kind: 'bony', scales: 0, bump: 0.65 },
      fins: {
        dorsal: [M(r4(d0), r4(d1), r4(range(r, 0.055, 0.095)), pick(r, ['fan', 'round', 'even'] as FinShape[]), { rays: irange(r, 14, 22) })],
        anal: [],
        pec: Pf(r4(HL + 0.02), 0.12, 0.032, r4(range(r, 0.048, 0.075)), 'fan', 8, 52, { rays: 14 }),
        caudal: chance(r, 0.7) ? { type: 'none', span: 0.01, len: 0.01 } : { type: 'rounded', span: 0.04, len: 0.04 },
        color: '#88949a', alpha: 0.75,
      },
    } as SP);
    if (sp.fins.caudal.type !== 'none') sp.fins.caudal = { type: 'rounded', span: 0.04, len: 0.04 };
    notes.push({ icon: '∿', title: 'S-curved ring armour', text: 'An upright vertebral S-curve encased in interlocking bony plates, propelled by rapid dorsal-fin waves.' });
  }

  // ═══ ALL UPRIGHT SWIMMERS (15 diverse multi-zone architectures) ═══════════
  else {
    const sharky = plan === 'shark';
    const benthicShark = sharky && ['benthivore', 'ambush', 'scavenger', 'crusher'].includes(niche) && H.substrate !== 'open';
    const g: ShapeGenes = {
      D: 0.26, df: 0.5, pD: 0.38, pV: 0.42, P: 0.085, pedY: 0, sP: 0.89,
      snoutMode: 'rounded-brow', bellyMode: 'taut',
      foreSlope: 0.72, dFull: 0.8, vFull: 0.8, tD: 0.9, tV: 0.9, n: 0.62,
    };
    let W = 0.52, Wh = 1.0, Wt = 0.62, sq = 2.2, HL = 0.26;
    let bellyFlat = 0, keelV = 0, snoutFlat = 0, keel = 0, crest = 0;
    let whip = false;
    let skinKind: SkinKind = 'ctenoid';
    let gillKind: GillSpec['kind'] = 'opercle';

    switch (plan) {
      case 'fusiform': {
        g.D = lerp(range(r, 0.21, 0.34), range(r, 0.17, 0.26), speed);
        g.df = range(r, 0.46, 0.56);
        g.pD = range(r, 0.30, 0.44);
        g.pV = g.pD + range(r, -0.04, 0.1);
        g.snoutMode = pick(r, ['wedge-torpedo', 'rounded-brow', 'wedge-torpedo']);
        g.bellyMode = 'taut';
        g.foreSlope = range(r, 0.72, 1.08);
        g.dFull = range(r, 0.65, 1.05);
        g.vFull = range(r, 0.65, 1.05);
        g.tD = range(r, 0.6, 1.0);
        g.tV = range(r, 0.6, 1.0);
        g.P = g.D * lerp(range(r, 0.24, 0.38), range(r, 0.14, 0.22), speed);
        g.sP = range(r, 0.90, 0.95);
        g.n = range(r, 0.56, 0.78);
        W = range(r, 0.44, 0.68) + speed * 0.12;
        HL = range(r, 0.21, 0.29);
        if (speed > 0.76) keel = range(r, 0.012, 0.024);
        skinKind = 'cycloid';
        break;
      }
      case 'perch': {
        g.D = range(r, 0.25, 0.42);
        g.df = range(r, 0.46, 0.58);
        g.pD = range(r, 0.28, 0.42);
        g.pV = g.pD + range(r, 0.02, 0.14);
        g.snoutMode = pick(r, ['rounded-brow', 'concave-sniper', 'humped-nape', 'blunt-cliff']);
        g.bellyMode = pick(r, ['taut', 'potbelly', 'angular-diamond']);
        g.foreSlope = range(r, 0.56, 0.92);
        g.dFull = range(r, 0.75, 1.25);
        g.vFull = range(r, 0.7, 1.15);
        g.tD = range(r, 0.55, 0.92);
        g.tV = range(r, 0.55, 0.92);
        g.P = g.D * range(r, 0.28, 0.42);
        g.sP = range(r, 0.87, 0.93);
        g.n = range(r, 0.52, 0.7);
        W = range(r, 0.36, 0.62);
        HL = range(r, 0.25, 0.34);
        skinKind = 'ctenoid';
        break;
      }
      case 'disc': {
        g.D = range(r, 0.44, 0.84);
        g.df = range(r, 0.44, 0.56);
        g.pD = range(r, 0.32, 0.52);
        g.pV = range(r, 0.34, 0.54);
        g.snoutMode = pick(r, ['concave-sniper', 'blunt-cliff', 'rounded-brow', 'humped-nape']);
        g.bellyMode = pick(r, ['angular-diamond', 'deep-keel', 'taut']);
        g.foreSlope = range(r, 0.52, 0.95);
        g.dFull = range(r, 0.8, 1.35);
        g.vFull = range(r, 0.8, 1.35);
        g.tD = range(r, 0.42, 0.8);
        g.tV = range(r, 0.42, 0.8);
        g.P = clamp(g.D * range(r, 0.16, 0.24), 0.08, 0.17);
        g.sP = range(r, 0.87, 0.92);
        g.n = range(r, 0.46, 0.68);
        W = range(r, 0.18, 0.34);
        crest = range(r, 0.2, 0.55);
        HL = range(r, 0.25, 0.35);
        skinKind = 'ctenoid';
        break;
      }
      case 'cliffhead': {
        g.D = range(r, 0.30, 0.56);
        g.df = range(r, 0.50, 0.64);
        g.pD = range(r, 0.16, 0.30);
        g.pV = range(r, 0.24, 0.42);
        g.snoutMode = 'blunt-cliff';
        g.bellyMode = pick(r, ['taut', 'angular-diamond', 'deep-keel']);
        g.foreSlope = range(r, 0.38, 0.56);
        g.dFull = range(r, 0.7, 1.15);
        g.vFull = range(r, 0.65, 1.1);
        g.tD = range(r, 0.65, 1.15);
        g.tV = range(r, 0.65, 1.15);
        g.P = clamp(g.D * range(r, 0.18, 0.29), 0.06, 0.14);
        g.sP = range(r, 0.88, 0.93);
        g.n = range(r, 0.42, 0.50);
        W = range(r, 0.24, 0.46);
        HL = range(r, 0.22, 0.33);
        skinKind = chance(r, 0.5) ? 'cycloid' : 'ctenoid';
        break;
      }
      case 'pike': {
        // Muscular ambush torpedo (NOT a pinched needle!)
        g.D = range(r, 0.13, 0.21);
        g.df = range(r, 0.46, 0.54);
        g.pD = range(r, 0.32, 0.55);
        g.pV = g.pD + range(r, -0.06, 0.08);
        g.snoutMode = pick(r, ['broad-flat', 'wedge-torpedo', 'concave-sniper']);
        g.bellyMode = 'taut';
        g.foreSlope = range(r, 0.72, 1.0);
        g.dFull = range(r, 1.0, 1.45);
        g.vFull = range(r, 1.0, 1.4);
        g.tD = range(r, 0.45, 0.85);
        g.tV = range(r, 0.45, 0.85);
        g.P = g.D * range(r, 0.38, 0.56);
        g.sP = range(r, 0.89, 0.94);
        g.n = range(r, 0.62, 0.84);
        W = range(r, 0.62, 0.92);
        Wh = range(r, 0.95, 1.22);
        snoutFlat = chance(r, 0.6) ? range(r, 0.25, 0.55) : 0;
        HL = range(r, 0.26, 0.36);
        skinKind = 'cycloid';
        break;
      }
      case 'benthic': {
        g.D = range(r, 0.14, 0.26);
        g.df = range(r, 0.54, 0.68);
        g.pD = range(r, 0.18, 0.34);
        g.pV = range(r, 0.22, 0.38);
        g.snoutMode = pick(r, ['broad-flat', 'rounded-brow', 'blunt-cliff']);
        g.bellyMode = 'flat-benthic';
        g.foreSlope = range(r, 0.48, 0.78);
        g.dFull = range(r, 0.65, 1.05);
        g.vFull = range(r, 0.75, 1.15);
        g.tD = range(r, 0.65, 1.05);
        g.tV = range(r, 0.65, 1.05);
        g.P = g.D * range(r, 0.34, 0.52);
        g.sP = range(r, 0.89, 0.95);
        g.n = range(r, 0.46, 0.62);
        W = range(r, 0.82, 1.38);
        Wh = range(r, 1.08, 1.45);
        bellyFlat = range(r, 0.55, 0.92);
        HL = range(r, 0.26, 0.37);
        skinKind = chance(r, 0.55) ? 'smooth' : 'ctenoid';
        break;
      }
      case 'armored': {
        const boxy = chance(r, 0.45);
        g.D = range(r, 0.34, 0.58);
        g.df = range(r, 0.44, 0.56);
        g.pD = range(r, 0.32, 0.46);
        g.pV = range(r, 0.34, 0.48);
        g.snoutMode = pick(r, ['blunt-cliff', 'rounded-brow', 'concave-sniper']);
        g.bellyMode = boxy ? 'flat-benthic' : 'potbelly';
        g.foreSlope = range(r, 0.42, 0.68);
        g.dFull = range(r, 0.9, 1.35);
        g.vFull = range(r, 0.9, 1.35);
        g.tD = range(r, 0.68, 1.08);
        g.tV = range(r, 0.68, 1.08);
        g.P = range(r, 0.075, 0.115);
        g.sP = range(r, 0.86, 0.92);
        g.n = range(r, 0.44, 0.56);
        W = range(r, 0.68, 1.05);
        sq = boxy ? range(r, 3.2, 4.4) : range(r, 2.05, 2.55);
        if (boxy) bellyFlat = 0.55;
        HL = range(r, 0.29, 0.39);
        skinKind = boxy ? 'bony' : 'smooth';
        gillKind = 'restricted';
        break;
      }
      case 'hatchet': {
        g.D = range(r, 0.40, 0.64);
        g.df = range(r, 0.24, 0.38);
        g.pD = range(r, 0.28, 0.44);
        g.pV = range(r, 0.25, 0.38);
        g.snoutMode = pick(r, ['rounded-brow', 'concave-sniper']);
        g.bellyMode = 'deep-keel';
        g.foreSlope = range(r, 0.52, 0.78);
        g.dFull = range(r, 0.95, 1.35);
        g.vFull = range(r, 0.6, 0.95);
        g.tD = range(r, 0.65, 1.0);
        g.tV = range(r, 1.1, 1.65);
        g.P = range(r, 0.042, 0.068);
        g.sP = range(r, 0.84, 0.90);
        g.n = range(r, 0.52, 0.66);
        W = range(r, 0.18, 0.32);
        keelV = range(r, 0.65, 0.95);
        HL = range(r, 0.27, 0.35);
        skinKind = 'cycloid';
        break;
      }
      case 'serpent': {
        g.D = range(r, 0.052, 0.095);
        g.df = 0.5;
        g.pD = range(r, 0.18, 0.36);
        g.pV = g.pD + 0.03;
        g.snoutMode = pick(r, ['rounded-brow', 'broad-flat', 'wedge-torpedo']);
        g.bellyMode = 'taut';
        g.foreSlope = range(r, 0.55, 0.85);
        g.dFull = range(r, 1.0, 1.35);
        g.vFull = range(r, 1.0, 1.35);
        g.tD = range(r, 0.5, 0.85);
        g.tV = range(r, 0.5, 0.85);
        g.P = range(r, 0.012, 0.025);
        g.sP = 1;
        whip = true;
        W = range(r, 0.72, 1.0);
        Wt = 0.42;
        HL = range(r, 0.10, 0.17);
        skinKind = 'smooth';
        gillKind = chance(r, 0.6) ? 'pore' : 'restricted';
        break;
      }
      case 'ribbon': {
        g.D = range(r, 0.09, 0.19);
        g.df = range(r, 0.42, 0.55);
        g.pD = range(r, 0.12, 0.26);
        g.pV = g.pD + range(r, 0, 0.08);
        g.snoutMode = pick(r, ['blunt-cliff', 'rounded-brow', 'concave-sniper']);
        g.bellyMode = 'taut';
        g.foreSlope = range(r, 0.48, 0.82);
        g.tD = range(r, 0.9, 1.55);
        g.tV = range(r, 0.9, 1.55);
        g.P = range(r, 0.010, 0.024);
        g.sP = 1;
        whip = true;
        W = range(r, 0.20, 0.38);
        Wt = 0.42;
        HL = range(r, 0.11, 0.19);
        skinKind = 'smooth';
        break;
      }
      case 'abyssalMaw': {
        g.D = range(r, 0.22, 0.38);
        g.df = range(r, 0.45, 0.56);
        g.pD = range(r, 0.15, 0.28);
        g.pV = range(r, 0.18, 0.32);
        g.snoutMode = pick(r, ['blunt-cliff', 'concave-sniper', 'rounded-brow']);
        g.bellyMode = pick(r, ['potbelly', 'taut']);
        g.foreSlope = range(r, 0.46, 0.72);
        whip = chance(r, 0.4);
        if (whip) {
          g.sP = 1; g.P = range(r, 0.01, 0.024); g.tD = range(r, 1.2, 1.85); g.tV = range(r, 1.2, 1.85);
        } else {
          g.sP = range(r, 0.9, 0.95); g.P = range(r, 0.036, 0.062); g.tD = range(r, 0.72, 1.15); g.tV = range(r, 0.72, 1.15);
        }
        W = range(r, 0.54, 0.88);
        Wh = range(r, 1.1, 1.48);
        HL = range(r, 0.34, 0.46);
        skinKind = 'smooth';
        gillKind = 'restricted';
        break;
      }
      case 'grenadier': {
        g.D = range(r, 0.17, 0.31);
        g.df = range(r, 0.48, 0.58);
        g.pD = range(r, 0.14, 0.24);
        g.pV = range(r, 0.18, 0.28);
        g.snoutMode = pick(r, ['rounded-brow', 'blunt-cliff', 'broad-flat']);
        g.bellyMode = pick(r, ['potbelly', 'flat-benthic']);
        g.foreSlope = range(r, 0.48, 0.72);
        g.tD = range(r, 1.2, 1.85);
        g.tV = range(r, 1.2, 1.85);
        g.P = range(r, 0.009, 0.02);
        g.sP = 1;
        whip = true;
        W = range(r, 0.75, 1.08);
        Wh = range(r, 1.08, 1.38);
        HL = range(r, 0.22, 0.32);
        skinKind = chance(r, 0.5) ? 'smooth' : 'cycloid';
        break;
      }
      case 'sunfish': {
        g.D = range(r, 0.52, 0.78);
        g.df = range(r, 0.45, 0.55);
        g.pD = range(r, 0.34, 0.48);
        g.pV = range(r, 0.36, 0.50);
        g.snoutMode = pick(r, ['blunt-cliff', 'rounded-brow']);
        g.bellyMode = 'angular-diamond';
        g.foreSlope = range(r, 0.46, 0.68);
        g.dFull = range(r, 1.0, 1.35);
        g.vFull = range(r, 1.0, 1.35);
        g.tD = range(r, 0.42, 0.68);
        g.tV = range(r, 0.42, 0.68);
        g.P = g.D * range(r, 0.38, 0.55);
        g.sP = range(r, 0.88, 0.93);
        g.n = range(r, 0.46, 0.58);
        W = range(r, 0.22, 0.38);
        HL = range(r, 0.26, 0.34);
        skinKind = 'smooth';
        gillKind = 'pore';
        break;
      }
      case 'sturgeon': {
        g.D = range(r, 0.13, 0.22);
        g.df = range(r, 0.54, 0.64);
        g.pD = range(r, 0.28, 0.44);
        g.pV = range(r, 0.30, 0.46);
        g.snoutMode = pick(r, ['wedge-torpedo', 'broad-flat', 'rounded-brow']);
        g.bellyMode = 'flat-benthic';
        g.foreSlope = range(r, 0.72, 0.98);
        g.dFull = range(r, 0.85, 1.2);
        g.vFull = range(r, 0.9, 1.25);
        g.tD = range(r, 0.7, 1.05);
        g.tV = range(r, 0.7, 1.05);
        g.P = g.D * range(r, 0.26, 0.38);
        g.sP = range(r, 0.91, 0.95);
        g.n = range(r, 0.64, 0.84);
        W = range(r, 0.75, 1.05);
        Wh = range(r, 1.0, 1.24);
        bellyFlat = range(r, 0.45, 0.8);
        HL = range(r, 0.21, 0.29);
        skinKind = 'ganoid';
        break;
      }
      default: { // shark
        g.D = benthicShark ? range(r, 0.12, 0.17) : range(r, 0.14, 0.22);
        g.df = range(r, 0.52, 0.60);
        g.pD = range(r, 0.30, 0.42);
        g.pV = g.pD + range(r, 0.02, 0.10);
        g.snoutMode = benthicShark ? 'broad-flat' : 'wedge-torpedo';
        g.bellyMode = benthicShark ? 'flat-benthic' : 'taut';
        g.foreSlope = range(r, 0.76, 1.04);
        g.tD = range(r, 0.7, 1.0);
        g.tV = range(r, 0.7, 1.05);
        g.P = range(r, 0.032, 0.048);
        g.sP = range(r, 0.92, 0.955);
        g.n = range(r, 0.62, 0.82);
        W = benthicShark ? range(r, 0.95, 1.3) : range(r, 0.72, 0.92);
        Wh = range(r, 1.05, 1.32);
        bellyFlat = benthicShark ? range(r, 0.5, 0.8) : range(r, 0.2, 0.42);
        HL = range(r, 0.19, 0.26);
        sq = 2.05;
        if (speed > 0.78) keel = range(r, 0.014, 0.024);
        skinKind = 'placoid';
        gillKind = 'slits';
      }
    }

    // Avoid repeating the exact same snout silhouette on consecutive clicks
    if (force?.avoidSnouts?.includes(g.snoutMode) && plan !== 'cliffhead' && chance(r, 0.75)) {
      const alt: SnoutMode[] = ['blunt-cliff', 'rounded-brow', 'concave-sniper', 'wedge-torpedo', 'broad-flat', 'humped-nape'].filter((m) => m !== g.snoutMode) as SnoutMode[];
      g.snoutMode = pick(r, alt);
    }
    chosenSnoutMode = g.snoutMode;
    g.pedY = whip ? 0 : g.P * range(r, -0.08, 0.14);

    // Optional anatomical relief (nuchal humps, dorsal ridges)
    const humps: [number, number, number, number][] = [];
    const firm = !whip && !sharky && plan !== 'pike' && plan !== 'sunfish';
    if (firm && (plan === 'perch' || plan === 'disc' || plan === 'cliffhead') && !deep && speed < 0.72 && chance(r, 0.14 + 0.18 * wild)) {
      humps.push([HL * range(r, 0.52, 0.85), g.D * range(r, 0.07, 0.14), range(r, 0.05, 0.09), 1]);
      notes.push({ icon: '⌒', title: 'Nuchal hump', text: 'A fatty forehead crest — a social dominance signal carried by mature adults.' });
    }
    if (firm && plan === 'perch' && (niche === 'benthivore' || niche === 'grazer') && chance(r, 0.35)) {
      humps.push([g.pD, g.D * range(r, 0.05, 0.11), 0.12, 1]);
      bellyFlat = Math.max(bellyFlat, range(r, 0.3, 0.55));
    }
    g.humps = humps;

    // Rare, well-proportioned forceps snout ONLY for specialist reef/seagrass pickers (NEVER on needles or generalists!)
    const forceps =
      (niche === 'picker' || niche === 'cryptic') &&
      plan === 'disc' &&
      H.struct > 0.65 &&
      chance(r, 0.10 + 0.12 * wild);
    if (forceps) {
      g.sn = range(r, 0.055, 0.095);
      g.snR = Math.max(0.015, g.D * range(r, 0.036, 0.052));
      g.pD = Math.max(g.pD, g.sn + 0.22);
      g.pV = Math.max(g.pV, g.sn + 0.22);
      g.snoutMode = 'concave-sniper';
      chosenSnoutMode = 'concave-sniper';
      HL = Math.max(HL, g.sn + range(r, 0.16, 0.21));
      notes.push({ icon: '⟝', title: 'Forceps snout', text: 'A concave brow draws the jaws into slender tweezers for probing deep coral crevices.' });
    }

    HL = clamp(HL, 0.09, 0.46);
    const o = synthesizeSilhouette(g);
    const prof = buildProfile(o.d, o.v, g.n);

    // 5 ── jaws (anatomically proportional to head & feeding mechanics)
    let mouth: MouthSpec;
    let rostrum: Species['rostrum'];
    let beakNote = false;
    if (sharky) {
      const filt = niche === 'filter';
      mouth = filt
        ? { s: 0.008, y: -0.18, gape: r4(range(r, 0.075, 0.10)), angle: 4, curve: 0, open: 38, jut: 0, lip: 0.22, gular: 0.8, teeth: 'fine', tn: 20, ts: 0.002, kind: 'jaw' }
        : {
            s: r4(range(r, 0.036, 0.072)), y: -0.78,
            gape: r4(benthicShark ? range(r, 0.048, 0.068) : range(r, 0.072, 0.105)),
            angle: r4(range(r, 10, 16)), curve: 0.07, open: benthicShark ? 26 : 32, jut: 0, lip: 0.24, protrude: 0.22, gular: 0.24,
            teeth: benthicShark ? 'fine' : pick(r, ['shark', 'shark', 'tri'] as TeethKind[]),
            tn: 12, ts: r4(benthicShark ? 0.004 : range(r, 0.009, 0.014)), throat: 0.08, kind: 'jaw',
          };
      if (filt) { Wh = range(r, 1.25, 1.42); W = Math.max(W, 0.95); }
    } else if (forceps) {
      mouth = { s: 0, y: 0, gape: r4(range(r, 0.028, 0.038)), angle: r4(range(r, 6, 16)), curve: 0, open: 26, jut: 0, lip: 0.38, protrude: 0.45, gular: 0.35, teeth: 'fine', tn: 8, ts: 0.003, kind: 'jaw' };
    } else {
      const mScale = plan === 'abyssalMaw' ? 1.25 : plan === 'serpent' || plan === 'ribbon' ? 1.05 : plan === 'armored' || plan === 'sunfish' ? 0.88 : 1;
      mouth = buildJaws(niche, HL, g.D, r, mScale);
      if (plan === 'abyssalMaw') {
        mouth.gape = r4(clamp(HL * range(r, 0.56, 0.78), 0.14, HL * 0.84));
        mouth.open = Math.round(range(r, 52, 72));
        mouth.gular = 0.72;
      }
      if (plan === 'armored' || plan === 'sunfish' || ((niche === 'grazer' || niche === 'crusher') && (plan === 'cliffhead' || plan === 'disc') && H.id === 'reef' && chance(r, 0.48))) {
        mouth.teeth = 'beak';
        mouth.tn = 4;
        mouth.beak = pick(r, ['#ebe4ce', '#dfe6e0', '#c8d8d0', '#f0e6d2']);
        mouth.sup = false;
        mouth.lip = Math.max(mouth.lip, 0.7);
        beakNote = true;
      }
      if (plan === 'benthic' && (niche === 'grazer' || niche === 'benthivore')) {
        mouth.s = r4(range(r, 0.018, 0.042));
        mouth.y = r4(range(r, -0.72, -0.45));
        mouth.lip = Math.max(mouth.lip, 0.85);
        mouth.sup = false;
      }
      if (plan === 'sturgeon') {
        mouth.s = r4(range(r, 0.032, 0.065));
        mouth.y = r4(range(r, -0.78, -0.52));
        mouth.lip = 0.85;
        mouth.protrude = 0.7;
        mouth.sup = false;
      }
      if (!mouth.sup && mouth.s === 0 && (H.id === 'swamp' || H.id === 'estuary' || H.id === 'amazon' || plan === 'hatchet') && (niche === 'picker' || niche === 'planktivore') && chance(r, 0.45)) {
        mouth.sup = true;
        mouth.angle = r4(range(r, 34, 48));
        mouth.y = r4(range(r, 0.04, 0.26));
        mouth.jut = 0.008;
      }
    }
    notes.push({
      icon: '⌓',
      title: `${niche[0].toUpperCase() + niche.slice(1)} jaws`,
      text: forceps ? DIET_TXT.picker : beakNote ? 'Teeth fused into a powerful dental beak that shears algae, coral and hard shells.' : DIET_TXT[niche],
    });

    // Optional specialized rostra (bills, swords, paddles, saws — genuinely rare & spectacular!)
    if (plan === 'fusiform' && (niche === 'apex' || niche === 'pursuit') && H.id === 'pelagic' && lenM > 0.9 && chance(r, 0.14 + 0.12 * wild)) {
      const sword = chance(r, 0.45);
      rostrum = { kind: sword ? 'sword' : 'bill', len: r4(sword ? range(r, 0.22, 0.32) : range(r, 0.15, 0.24)), r: r4(range(r, 0.014, 0.020)), ...(sword ? { flat: 0.6 } : {}) };
      mouth = { ...mouth, s: 0.005, y: -0.78, angle: 8, jut: 0, sup: false, teeth: 'fine', ts: 0.0035 };
      notes.push({ icon: '⟋', title: sword ? 'Sword bill' : 'Marlin spear', text: 'The upper jaw elongates into a hydrodynamic spear used to slash schooling prey.' });
    } else if (plan === 'sturgeon' && niche === 'filter' && fresh && chance(r, 0.5)) {
      rostrum = { kind: 'paddle', len: r4(range(r, 0.28, 0.44)), r: r4(range(r, 0.032, 0.045)) };
      notes.push({ icon: '⟋', title: 'Electro-paddle rostrum', text: 'A broad paddle studded with electroreceptors detects plankton swarms in turbid rivers.' });
    } else if (sharky && benthicShark && (H.id === 'estuary' || H.id === 'sandflat' || H.id === 'river') && chance(r, 0.2)) {
      rostrum = { kind: 'saw', len: r4(range(r, 0.2, 0.28)), r: r4(range(r, 0.02, 0.028)), flat: 0.6 };
      notes.push({ icon: '⟋', title: 'Saw rostrum', text: 'A toothed blade swept laterally to stun prey and rake sand.' });
    }

    // 6 ── eyes
    const topEye = plan === 'benthic' && chance(r, 0.6);
    let ed = eyeRel * HL * (sharky ? 0.56 : plan === 'serpent' ? 0.78 : plan === 'abyssalMaw' ? 0.62 : 1);
    ed = clamp(ed, 0, Math.max(0.012, g.D * (plan === 'serpent' ? 0.34 : 0.32)));
    const snoutLen = sharky
      ? Math.max(mouth.s + 0.014, HL * range(r, 0.32, 0.42))
      : forceps
        ? (g.sn ?? 0) + ed * 0.9 + 0.014
        : HL * (plan === 'abyssalMaw' ? range(r, 0.14, 0.24) : plan === 'cliffhead' ? range(r, 0.18, 0.30) : plan === 'pike' ? range(r, 0.4, 0.52) : niche === 'apex' || niche === 'pursuit' ? range(r, 0.32, 0.42) : range(r, 0.26, 0.38));

    const eye: Species['eye'] = {
      s: r4(Math.max(snoutLen, ed * 0.8 + 0.01)),
      y: r4(topEye ? range(r, 0.78, 0.96) : sharky ? range(r, 0.16, 0.36) : mouth.sup ? range(r, 0.42, 0.62) : range(r, 0.24, 0.52)),
      d: r4(ed),
      iris: '#c8a040',
      ...(shine !== undefined ? { shine } : {}),
      ...(plan === 'fusiform' && speed > 0.72 && chance(r, 0.5) ? { adipose: r4(range(r, 0.35, 0.65)) } : {}),
    };
    if (topEye && ed > 0) {
      eye.bulge = r4(range(r, 0.45, 0.8));
      if ((H.id === 'estuary' || H.id === 'swamp' || (H.id === 'rocky' && chance(r, 0.3))) && chance(r, 0.55)) {
