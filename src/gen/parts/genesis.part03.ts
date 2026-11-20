        eye.bulge = 1; eye.close = r4(range(r, 0.3, 0.5)); eye.stalk = r4(range(r, 0.45, 0.85)); eye.pupil = 'slitH'; eye.y = 0.98; eye.d = r4(Math.max(eye.d, HL * 0.24));
        notes.push({ icon: '◉', title: 'Periscope eyes', text: 'Close-set eyes ride raised turrets on the skull roof to scan above mud or surface film.' });
      } else {
        notes.push({ icon: '◉', title: 'Dorsal eyes', text: 'High-set eyes watch the water column while the body hugs the substrate.' });
      }
    } else if (eyeWhy && ed > 0 && Math.abs(eyeF - 1) > 0.12) {
      notes.push({ icon: eyeF > 1 ? '◉' : '•', title: eyeF > 1 ? 'Enlarged eyes' : 'Reduced eyes', text: eyeWhy });
    }
    if (ed === 0) notes.push({ icon: '◌', title: 'Eyes lost', text: eyeWhy });

    // 7 ── median fins (10 architectures matched to bauplan & speed)
    const D = g.D;
    const sE = whip ? 0.985 : g.sP - range(r, 0.02, 0.04);
    const hB = clamp(0.038 + 0.21 * D, 0.035, 0.18) * range(r, 0.82, 1.25) * (plan === 'serpent' ? 0.55 : 1);
    const soft = () => softShape(speed, still, r);
    const nape = Math.max(HL * 0.92, 0.12);
    let dorsal: MedianFin[] = [], anal: MedianFin[] = [];
    let finlets: Species['fins']['finlets'];
    let spinyRayed = false, dTxt = '';

    type DC = 'spinySoft' | 'twoSep' | 'single' | 'long' | 'post' | 'crest' | 'three' | 'full' | 'none' | 'sail';
    const dcw: Partial<Record<DC, number>> = ({
      fusiform: speed > 0.72 ? { twoSep: 2.4, single: 1.3, spinySoft: 0.7, crest: 0.4 } : { spinySoft: 1.8, twoSep: 1.5, single: 1.5, three: fresh ? 0.1 : 0.4, sail: 0.4 + 0.4 * wild },
      perch: { spinySoft: 2.5, twoSep: 1.4, single: 1.4, crest: 0.5, sail: 0.35 + 0.3 * wild },
      disc: { spinySoft: 2.2, long: 1.9, sail: 1.1, crest: 0.5, single: 0.4 },
      cliffhead: { long: 1.9, spinySoft: 1.7, twoSep: 1.1, sail: 0.7, crest: 0.6 },
      pike: { post: 2.8, twoSep: 0.9, single: 0.8 },
      benthic: { twoSep: 2.1, spinySoft: 1.5, long: 1.2, single: 1.0 },
      armored: { post: 2.6, single: 0.8, twoSep: 0.5 },
      hatchet: { single: 2.2, post: 1.1 },
      serpent: { full: 4.0, none: 0.25 },
      ribbon: { full: 2.2, crest: 1.6, none: 1.2 },
      abyssalMaw: whip ? { full: 2, single: 1 } : { post: 1.7, single: 1.4, long: 0.7 },
      grenadier: { full: 3.0, twoSep: 0.8 },
      sunfish: { post: 3.0 },
      sturgeon: { post: 1.6, long: 1.4, twoSep: 1.2 },
      shark: { twoSep: 1 },
    } as Record<string, Partial<Record<DC, number>>>)[plan] ?? { single: 1 };

    const dc = wpick<DC>(r, dcw, 'single');
    if (sharky) {
      const s0 = benthicShark ? range(r, 0.46, 0.58) : range(r, 0.30, 0.44);
      const l1 = range(r, 0.09, 0.13);
      const h1 = benthicShark ? range(r, 0.055, 0.085) : range(r, 0.09, 0.155);
      const s2 = benthicShark ? s0 + l1 + range(r, 0.05, 0.09) : range(r, 0.72, 0.78);
      const l2 = benthicShark ? range(r, 0.07, 0.10) : range(r, 0.04, 0.06);
      dorsal = [
        M(r4(s0), r4(s0 + l1), r4(h1), 'shark', { foil: 1 }),
        M(r4(s2), r4(Math.min(s2 + l2, g.sP - 0.03)), r4(benthicShark ? h1 * range(r, 0.7, 0.95) : range(r, 0.025, 0.042)), 'shark', { foil: 1 }),
      ];
      if (chance(r, 0.75)) anal = [M(r4(Math.min(s2 + 0.03, 0.84)), r4(Math.min(s2 + 0.08, 0.89)), r4(range(r, 0.022, 0.035)), 'shark', { foil: 1 })];
      dTxt = benthicShark ? 'Two low, broad dorsal foils positioned far aft on a resting body.' : 'A tall, swept first dorsal foil arrests roll at speed while the rear dorsal acts as a trim tab.';
    } else if (plan === 'sunfish') {
      dorsal = [M(0.56, 0.75, r4(clamp(D * 0.62, 0.18, 0.44)), 'falcate', { sweep: 16, rays: 16 })];
      anal = [M(0.58, 0.76, r4(clamp(D * 0.56, 0.16, 0.40)), 'falcate', { sweep: 12, rays: 14 })];
      dTxt = 'Tall, opposing rear dorsal and anal blades row sideways like wings to drive the disc-shaped body.';
    } else {
      const a0 = clamp(Math.max(nape, g.pD - range(r, 0.02, 0.12)), 0.10, 0.58);
      switch (dc) {
        case 'spinySoft': {
          const b = sE - range(r, 0, 0.06), m = lerp(a0, b, range(r, 0.48, 0.66));
          const tall = plan === 'disc' ? range(r, 1.05, 1.85) : range(r, 1.0, 1.4);
          dorsal = [
            M(r4(a0), r4(m), r4(hB * range(r, 0.78, 1.1)), 'spiny', { incise: r4(range(r, 0.12, 0.48)), spines: irange(r, 6, 12) }),
            M(r4(m + 0.005), r4(b), r4(hB * tall), soft()),
          ];
          spinyRayed = true;
          dTxt = 'An anterior spiny dorsal folds or locks erect for defence, joined to a soft-rayed steering lobe.';
          break;
        }
        case 'twoSep': {
          const l1 = range(r, 0.11, 0.2), gap = range(r, 0.03, 0.08), s2 = Math.min(a0 + l1 + gap, sE - 0.1), l2 = Math.min(range(r, 0.10, 0.24), sE - s2);
          dorsal = [
            M(r4(a0), r4(a0 + l1), r4(hB * range(r, 0.85, 1.2)), speed > 0.75 ? 'spiny' : pick(r, ['spiny', 'spiny', 'fan', 'tri'] as FinShape[]), { incise: r4(range(r, 0.15, 0.4)), spines: irange(r, 5, 10) }),
            M(r4(s2), r4(s2 + l2), r4(hB * range(r, 0.9, 1.35)), soft()),
          ];
          spinyRayed = true;
          dTxt = 'Two separated dorsal fins divide stabilisation from fine thrust.';
          break;
        }
        case 'long': {
          const b = sE - range(r, 0, 0.04);
          dorsal = [M(r4(Math.min(a0, 0.34)), r4(b), r4(hB * range(r, 0.65, 1.05)), pick(r, ['even', 'even', 'rect', 'low'] as FinShape[]), plan === 'disc' || plan === 'cliffhead' || chance(r, 0.4) ? { spines: irange(r, 8, 14), incise: r4(range(r, 0.05, 0.25)) } : {})];
          spinyRayed = plan === 'disc' || plan === 'benthic' || plan === 'cliffhead';
          dTxt = 'A continuous dorsal ribbon propels slow turns and hovering with travelling waves.';
          break;
        }
        case 'post': {
          const l = range(r, 0.11, 0.21);
          dorsal = [M(r4(sE - l), r4(sE), r4(hB * range(r, 0.95, 1.4)), pick(r, ['round', 'tri', 'falcate', 'even'] as FinShape[]))];
          dTxt = 'A rear-set dorsal aligned over the anal fin forms a powerful posterior thrust paddle.';
          break;
        }
        case 'crest': {
          const a = clamp(HL * range(r, 0.35, 0.7), 0.06, 0.2), b = sE - range(r, 0, 0.04);
          dorsal = [M(r4(a), r4(b), r4(hB * range(r, 0.85, 1.35)), plan === 'cliffhead' ? 'sail' : pick(r, ['even', 'sail', 'flag'] as FinShape[]), { rays: irange(r, 24, 48) })];
          dTxt = 'A sweeping cranial crest rises right behind the eyes and runs smoothly down the back.';
          break;
        }
        case 'three': {
          const w = (sE - a0 - 0.07) / 3;
          dorsal = [0, 1, 2].map((i) => M(r4(a0 + i * (w + 0.024)), r4(a0 + i * (w + 0.024) + w), r4(hB * [1.1, 0.95, 0.8][i]), 'tri'));
          dTxt = 'Three consecutive dorsal fins maximise fine trim and agility.';
          break;
        }
        case 'full': {
          dorsal = [M(r4(clamp(HL * 1.05, 0.12, 0.3)), 0.985, r4(clamp(D * range(r, 0.28, 0.55), 0.018, 0.09)), 'low', { rays: irange(r, 40, 80) })];
          dTxt = 'An uninterrupted dorsal ribbon flows cleanly into the tail.';
          break;
        }
        case 'sail': {
          const l = range(r, 0.28, 0.52);
          dorsal = [M(r4(a0), r4(Math.min(a0 + l, sE)), r4(clamp(D * range(r, 0.55, 1.05), 0.12, 0.38)), pick(r, ['sail', 'pennant', 'plume'] as FinShape[]), { rays: irange(r, 12, 22) })];
          dTxt = 'A towering dorsal sail flares for display or herds prey during tight turns.';
          break;
        }
        case 'none':
          dorsal = [];
          dTxt = 'Dorsal fin absent — propulsion shifts entirely to a long undulating ventral ribbon.';
          break;
        default: { // single
          const l = range(r, 0.14, 0.34);
          const s0 = clamp(a0, 0.18, sE - l - 0.02);
          dorsal = [M(r4(s0), r4(Math.min(s0 + l, sE)), r4(hB * range(r, 0.9, 1.4)), soft())];
          dTxt = 'A single balanced dorsal fin acts as a central keel and roll stabiliser.';
        }
      }

      // Adipose fin on river/stream/deep dwellers
      if (!whip && dorsal.length === 1 && dorsal[0].s1 < 0.72 && (plan === 'fusiform' || plan === 'benthic' || plan === 'hatchet') && (fresh || deep) && chance(r, 0.35 + 0.2 * wild)) {
        dorsal.push(M(r4(range(r, 0.74, 0.8)), r4(range(r, 0.82, 0.88)), r4(clamp(hB * 0.42, 0.018, 0.045)), 'adipose'));
        notes.push({ icon: '◠', title: 'Adipose fin', text: 'A small fleshy fin ahead of the tail senses vortices and steadies fast-water swimming.' });
      }

      // Anal fin
      const aStart = clamp(Math.max(0.46, g.pV + 0.04), 0.46, 0.68);
      if (plan === 'ribbon' && (dc === 'none' || chance(r, 0.65))) {
        anal = [M(r4(clamp(HL + 0.04, 0.18, 0.3)), 0.985, r4(clamp(D * range(r, 0.3, 0.52), 0.024, 0.08)), 'low', { rays: irange(r, 50, 90) })];
        notes.push({ icon: '∿', title: 'Ventral knifefin', text: 'A long anal ribbon ripples forward and backward while the spine stays rigid.' });
      } else if (dc === 'full' || plan === 'grenadier') {
        anal = [M(r4(clamp(HL * 1.4, 0.28, 0.48)), 0.985, r4(clamp(D * range(r, 0.26, 0.5), 0.016, 0.08)), 'low', { rays: irange(r, 36, 70) })];
      } else if (plan === 'hatchet') {
        anal = [M(r4(range(r, 0.52, 0.6)), r4(sE), r4(hB * range(r, 0.6, 0.9)), 'even')];
      } else if (dc === 'post') {
        const l = range(r, 0.11, 0.21);
        anal = [M(r4(sE - l), r4(sE), r4(hB * range(r, 0.85, 1.3)), dorsal[0]?.shape ?? soft())];
      } else if (spinyRayed || plan === 'disc' || plan === 'cliffhead') {
        const b = sE - range(r, 0, 0.04);
        const s0 = clamp(aStart, 0.45, b - 0.12);
        const tall = plan === 'disc' && chance(r, 0.65) ? range(r, 1.0, 1.6) : range(r, 0.72, 1.1);
        anal = [M(r4(s0), r4(b), r4(hB * tall), soft(), spinyRayed ? { spines: irange(r, 2, 4) } : {})];
      } else {
        const l = range(r, 0.1, 0.2);
        const s0 = clamp(aStart, 0.48, sE - l - 0.02);
        anal = [M(r4(s0), r4(Math.min(s0 + l, sE)), r4(hB * range(r, 0.7, 1.08)), soft())];
      }

      // Pelagic finlets + lateral peduncle keels
      if ((plan === 'fusiform' || plan === 'cliffhead') && H.id === 'pelagic' && speed > 0.7 && dorsal.length >= 1 && dorsal[dorsal.length - 1].s1 < 0.76 && chance(r, 0.48)) {
        const s0 = Math.max(dorsal[dorsal.length - 1].s1, anal[0]?.s1 ?? 0.65) + 0.02;
        if (s0 < 0.84) {
          finlets = { s0: r4(s0), s1: 0.9, n: irange(r, 5, 8), h: r4(range(r, 0.016, 0.025)) };
          if (keel === 0) keel = range(r, 0.014, 0.024);
          notes.push({ icon: '‣', title: 'Finlets & peduncle keels', text: 'A row of miniature finlets and lateral wrist keels guide vortices smoothly into the tail.' });
        }
      }
    }
    if (dTxt) notes.push({ icon: '△', title: 'Median fin architecture', text: dTxt });

    // 8 ── caudal tail from cruising speed + bauplan
    let ct: CaudalType;
    if (plan === 'sunfish') ct = 'clavus';
    else if (sharky) ct = 'hetero';
    else if (plan === 'sturgeon') ct = chance(r, 0.65) ? 'hetero' : 'trilobe';
    else if (whip) ct = plan === 'ribbon' && chance(r, 0.35) ? 'pointed' : plan === 'serpent' && chance(r, 0.35) ? 'rounded' : chance(r, 0.25) ? 'whip' : 'diphy';
    else if (speed > 0.74) ct = pick(r, ['lunate', 'forked', 'swallow', 'forked'] as CaudalType[]);
    else if (speed > 0.5) ct = pick(r, ['forked', 'emarginate', 'doubleEm', 'lyre', 'truncate'] as CaudalType[]);
    else if (still) ct = pick(r, ['rounded', 'truncate', 'lyre', 'veil', 'spade', 'double'] as CaudalType[]);
    else ct = pick(r, ['rounded', 'truncate', 'emarginate', 'spade'] as CaudalType[]);

    const cSpan = clamp((0.18 + 0.34 * clamp(D, 0.1, 0.62)) * (speed > 0.7 ? 1.45 : ct === 'lunate' ? 1.55 : 1.08), g.P * 2.5, 0.58);
    const caudal: CaudalSpec =
      ct === 'clavus'
        ? { type: 'clavus', span: r4(clamp(D * 0.85, 0.24, 0.58)), len: r4(clamp(D * 0.22, 0.08, 0.18)) }
        : ct === 'hetero'
          ? { type: 'hetero', span: r4(clamp(cSpan * 1.15, 0.16, 0.42)), len: r4(range(r, 0.22, 0.34)), up: r4(range(r, 22, 32)), lenUp: r4(range(r, 0.22, 0.34)), lenDn: r4(range(r, 0.11, 0.17)) }
          : ct === 'diphy'
            ? { type: 'diphy', span: r4(clamp(D * 0.55, 0.04, 0.12)), len: r4(range(r, 0.06, 0.11)) }
            : ct === 'pointed'
              ? { type: 'pointed', span: r4(clamp(D * 0.5, 0.04, 0.11)), len: r4(range(r, 0.07, 0.13)) }
              : caudalGeom(ct, D, g.P, r);

    // 9 ── paired fins from gait
    const pecS = clamp(HL + 0.02, 0.13, 0.44);
    let pec: PairedFin | undefined;
    let pel: PairedFin | undefined;
    const pecLen = clamp(0.11 + 0.2 * D, 0.09, 0.28) * range(r, 0.85, 1.2);
    if (plan === 'serpent' && chance(r, 0.45)) {
      pec = undefined;
    } else if (sharky) {
      pec = Pf(r4(pecS), -0.44, r4(range(r, 0.055, 0.085)), r4(range(r, 0.15, 0.24)), 'shark', -14, 52, { sweep: 14, foil: 1 });
    } else if (plan === 'benthic') {
      pec = Pf(r4(pecS), -0.35, r4(range(r, 0.06, 0.1)), r4(pecLen * 1.2), 'fan', -24, 62, { foil: 0.45 });
    } else if (plan === 'sturgeon') {
      pec = Pf(r4(pecS), -0.42, r4(range(r, 0.05, 0.08)), r4(pecLen * 1.1), 'lobe', -18, 54, { foil: 0.75 });
    } else if (speed > 0.72) {
      pec = Pf(r4(pecS), -0.18, r4(range(r, 0.036, 0.055)), r4(pecLen * 1.25), 'falcate', -8, 42, { sweep: 14, foil: 0.4 });
    } else if (plan === 'disc' || plan === 'cliffhead' || spinyRayed) {
      pec = Pf(r4(pecS), -0.14, r4(range(r, 0.038, 0.06)), r4(pecLen), pick(r, ['round', 'tri', 'fan'] as FinShape[]), -8, 42);
    } else {
      pec = Pf(r4(pecS), -0.34, r4(range(r, 0.034, 0.055)), r4(pecLen), 'round', -16, 48);
    }

    const pLen = clamp(pecLen * 0.65, 0.06, 0.2);
    if (plan === 'serpent' || plan === 'ribbon' || plan === 'sunfish') {
      pel = undefined;
    } else if (spinyRayed || plan === 'disc' || plan === 'cliffhead' || plan === 'benthic') {
      const pS = clamp(pecS + 0.02, 0.16, 0.48);
      pel = Pf(r4(pS), -0.82, r4(range(r, 0.026, 0.044)), r4(pLen), plan === 'benthic' ? 'fan' : 'tri', -42, plan === 'benthic' ? 42 : 20);
      if (still && (plan === 'disc' || plan === 'perch') && chance(r, 0.24 + 0.22 * wild)) {
        pel.shape = 'thread';
        pel.len = r4(clamp(pLen * 2.2, 0.16, 0.4));
        notes.push({ icon: '〰', title: 'Feeler pelvics', text: 'Long pelvic threads probe the water for food and chemical cues.' });
      }
    } else if (sharky || plan === 'sturgeon') {
      pel = Pf(r4(range(r, 0.56, 0.65)), -0.84, r4(range(r, 0.04, 0.06)), r4(range(r, 0.075, 0.115)), sharky ? 'shark' : 'lobe', -44, 34, { foil: 0.7 });
    } else if (plan !== 'armored') {
      pel = Pf(r4(clamp(range(r, 0.46, 0.58), pecS + 0.08, 0.66)), -0.84, r4(range(r, 0.026, 0.042)), r4(pLen * 0.9), 'round', -42, 26);
    }

    // 10 ── sensory barbels & abyssal lures
    const barbels: Barbel[] = [];
    if (niche === 'lure' && (plan === 'abyssalMaw' || plan === 'benthic' || deep)) {
      const glow = pick(r, ['#9ff4ff', '#80e8ff', '#b8ffd8', '#ffe498', '#ff96d0']);
      const chin = plan === 'abyssalMaw' && chance(r, 0.48);
      if (chin) {
        barbels.push({ s: 0.03, y: -0.78, len: r4(range(r, 0.18, 0.36)), r: 0.004, dir: [0.3, -1, 0.1], droop: 0.45, bulb: glow });
        notes.push({ icon: '✦', title: 'Bioluminescent chin barbel', text: 'A glowing lure dangles from the lower jaw to draw deep-sea prey toward the fangs.' });
      } else {
        barbels.push({ s: r4(clamp(eye.s + 0.03, 0.08, 0.25)), y: 0.96, len: r4(range(r, 0.22, 0.42)), r: 0.005, dir: [0.95, 0.7, 0], droop: 0.65, pairs: false, bulb: glow });
        notes.push({ icon: '✦', title: 'Illicium fishing lure', text: 'The first dorsal spine migrates onto the snout as a rod tipped with symbiotic bioluminescent bacteria.' });
      }
    } else if (plan === 'sturgeon' || (H.turb > 0.5 && (niche === 'benthivore' || niche === 'scavenger') && chance(r, 0.62)) || (plan === 'benthic' && chance(r, 0.38))) {
      const n = plan === 'sturgeon' ? 2 : pick(r, [1, 2, 3] as const);
      const long = plan === 'benthic' && chance(r, 0.48);
      const blen = long ? range(r, 0.14, 0.30) : range(r, 0.045, 0.095);
      barbels.push({ s: r4(mouth.s + 0.022), y: -0.45, len: r4(blen), r: long ? 0.0045 : 0.0032, dir: [0.6, -0.5, 0.85], droop: 0.28 });
      if (n >= 2) barbels.push({ s: r4(mouth.s + 0.012), y: -0.78, len: r4(blen * 0.65), r: 0.003, dir: [0.45, -1, 0.38], droop: 0.2 });
      if (n >= 3) barbels.push({ s: r4(mouth.s + 0.03), y: -0.84, len: r4(blen * 0.5), r: 0.0025, dir: [0.25, -1, 0.28], droop: 0.15 });
      notes.push({ icon: '〰', title: 'Sensory barbels', text: 'Taste-bud-studded whiskers sweep ahead of the jaws in murky water or over silt.' });
    }

    // 11 ── armour spikes / horns / carapace scutes
    const spikes: Spike[] = [];
    if (plan === 'armored' && sq > 3.0 && chance(r, 0.45)) {
      const eY = eye.s;
      spikes.push({ s: r4(eY * 0.82), y: 0.72, len: r4(range(r, 0.08, 0.15)), dir: [1.3, 0.22, 0.18], r: 0.014, horn: 0.9 });
      if (chance(r, 0.6)) spikes.push({ s: 0.82, y: -0.75, len: r4(range(r, 0.06, 0.12)), dir: [-1.2, -0.1, 0.2], r: 0.012, horn: 0.8 });
      notes.push({ icon: '◬', title: 'Carapace horns', text: 'Fused dermal plates extend into forward and rear horns, enlarging the fish beyond a predator’s gape.' });
    } else if (plan === 'sturgeon' && chance(r, 0.7)) {
      for (let i = 0; i < 6; i++) {
        spikes.push({ s: r4(0.24 + i * 0.1), y: 0.96, len: r4(range(r, 0.016, 0.026)), dir: [-0.6, 0.8, 0], r: 0.009, mirror: false });
      }
      notes.push({ icon: '❖', title: 'Ganoid dorsal scutes', text: 'A ridge of heavy, diamond-shaped bony scutes armours the dorsal midline.' });
    }

    // 12 ── assemble Species genome
    const scaleDensity = skinKind === 'smooth' || skinKind === 'bony' || skinKind === 'placoid' ? 0 : clamp(Math.round(range(r, 24, 58) * (plan === 'fusiform' ? 1.25 : 0.95)), 16, 75);
    const swimMode: Species['swim']['mode'] =
      plan === 'fusiform' && speed > 0.76 ? 'thunniform'
        : plan === 'serpent' || plan === 'ribbon' ? 'anguilliform'
          : plan === 'armored' || plan === 'sunfish' ? 'ostraciiform'
            : sharky ? 'selachian'
              : plan === 'disc' || plan === 'cliffhead' ? 'labriform'
                : speed > 0.6 ? 'carangiform' : 'subcarangiform';
    sp = remeasure({
      id: id0, name: '', sci: '', group: I.clade, note: '', lenM,
      plan: 'fish', HL: r4(HL),
      body: {
        D: r4(g.D), df: r4(g.df), pD: r4(g.pD), pV: r4(g.pV), P: r4(g.P), pedY: r4(g.pedY),
        bD: 0.6, bV: 0.6, tD: 0.85, tV: 0.85,
        W: r4(W), Wh: r4(Wh), Wt: r4(Wt), sq: r4(sq),
        ...(keel ? { keel: r4(keel) } : {}),
        ...(bellyFlat ? { bellyFlat: r4(bellyFlat) } : {}),
        ...(keelV ? { keelVentral: r4(keelV) } : {}),
        ...(snoutFlat ? { snoutFlat: r4(snoutFlat) } : {}),
        ...(crest ? { crest: r4(crest) } : {}),
        prof,
      },
      mouth,
      eye,
      gill: { kind: gillKind },
      traits: { gill: gillKind },
      fins: {
        dorsal, anal, caudal,
        ...(pec ? { pec } : {}),
        ...(pel ? { pel } : {}),
        ...(finlets ? { finlets } : {}),
        color: '#809098', alpha: 0.78,
      },
      ...(barbels.length ? { barbels } : {}),
      ...(spikes.length ? { spikes } : {}),
      ...(rostrum ? { rostrum } : {}),
      skin: {
        kind: skinKind,
        scales: scaleDensity,
        bump: skinKind === 'placoid' ? 0.55 : skinKind === 'ganoid' || skinKind === 'bony' ? 0.75 : skinKind === 'smooth' ? 0.08 : 0.35,
      },
      swim: { mode: swimMode },
      color: {
        top: '#33485a', side: '#8094a4', belly: '#e4e8ec', cs: [0.35, 0.72],
        rough: skinKind === 'placoid' ? 0.62 : skinKind === 'smooth' ? 0.24 : 0.36,
        sheen: skinKind === 'smooth' ? 0.42 : 0.25,
      },
    });

    if (bellyFlat > 0.45 && plan !== 'shark') {
      notes.push({ icon: '▁', title: 'Flattened belly', text: 'A wide, flat underside presses against substrate to hold position in current or ambush from below.' });
    }
    if (keelV > 0.55) {
      notes.push({ icon: '◢', title: 'Ventral keel', text: 'A knife-sharp belly keel eliminates dark shadow from below and houses broad fin musculature.' });
    }
    if (plan === 'cliffhead') {
      notes.push({ icon: '◤', title: 'Steep cliff forehead', text: 'A vertical anterior brow shifts body depth forward for rapid turns and visual dominance.' });
    }
  }

  const L: Lineage = {
    name: I.clade, kind: I.kind,
    niches: Object.keys(AFF[plan]) as Niche[],
    mouth: true, body: true, roots: I.roots, nouns: I.nouns,
    caudal: null, finMods: true,
  };
  notes.unshift({ icon: '⬡', title: I.clade, text: I.what });
  return { sp, plan, snoutMode: chosenSnoutMode, niche, L, lineage: I.lineage, clade: I.clade, notes, speed };
}
