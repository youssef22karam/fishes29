            <>
              <div className="stage-top">
                <div className="stage-chips">
                  <div className="viewport-label"><Box size={15} /> <span>3D Viewport</span></div>
                  <button className="codex-chip" title="Evolutionary bauplans discovered across your expeditions" onClick={() => { setTab('gen'); setList(true); }}><Dna size={13} /> Bauplans <b>{codex.length}</b><span>/{totalPlans}</span></button>
                  <button className="sound-chip" aria-pressed={sound} title={sound ? 'Mute discovery chimes' : 'Play discovery chimes'} onClick={() => setSound((v) => { try { localStorage.setItem('ig-sound', v ? '0' : '1'); } catch { /* private mode */ } return !v; })}>{sound ? '♪' : '–'}</button>
                </div>
                <nav className="view-tabs" aria-label="Camera views">{VIEWS.map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => { setView(id); setViewNonce((n) => n + 1); }}>{label}</button>)}</nav>
              </div>
              <div className="specimen-title" aria-live="polite">
                <div className="discovery-badge" key={`b${magic.nonce}`} data-tier={magic.tier} style={{ '--tier': magic.color } as CSSProperties}><Sparkles size={12} /> <span>{magic.label}</span></div>
                <div className="specimen-kicker"><span className="live-dot" /> <span>{specLabel} specimen</span><span className="title-line" /></div>
                <h1 key={`t${magic.nonce}`} className="title-reveal" style={{ '--tier': magic.color } as CSSProperties}>{fish.common.split('').map((ch, i) => <span key={i} style={{ animationDelay: `${0.18 + Math.min(i * 0.02, 0.5)}s` }}>{ch}</span>)}</h1>
                <div className="specimen-sci"><i>{fish.latin}</i><span /><span className="habitat-name">{H.name}</span></div>
              </div>
              {pending && <div className="build-status" role="status"><span /> Synthesising anatomy</div>}
              <div className="stage-reticle" aria-hidden="true"><span>SURFACE</span><div /><span>{depthLabel(H.depth[1])}</span></div>
              <div className="camera-buttons" aria-label="Camera tools">
                <button className="icon-button" title="Zoom in" aria-label="Zoom in" onClick={() => camera('in')}><Plus size={17} /></button>
                <button className="icon-button" title="Zoom out" aria-label="Zoom out" onClick={() => camera('out')}><Minus size={17} /></button>
                <button className="icon-button reset-button" title="Reset view (R)" aria-label="Reset view" onClick={() => camera('fit')}><Crosshair size={16} /></button>
              </div>
              <div className="stage-bottom">
                <div className="stage-hints"><span><Mouse size={14} /> Drag to orbit <b>·</b> Scroll to zoom</span><span className="mono stage-seed">SEED {fish.seed.toString(10).padStart(5, '0')}</span></div>
                <section className="motion-deck" aria-label="Animation and anatomy controls">
                  <div className="motion-heading"><h2 className="section-label"><SlidersHorizontal size={16} /> Anatomy &amp; motion</h2><button className="strike-button" type="button" title="Trigger a single feeding strike (Space)" disabled={maxJaw <= 0} onClick={fire}><Zap size={14} /> Trigger strike</button></div>
                  <div className="motion-grid">
                    <Slider label="Jaw opening" value={gape} step={0.01} display={`${Math.round(gape * maxJaw)}°`} onChange={(v) => { setGape(v); setAutoFeed(false); }} kind="jaw-slider" disabled={maxJaw <= 0} />
                    <Slider label="Swim speed" value={speed} step={0.05} min={0.25} max={2} display={`${speed.toFixed(2).replace(/0$/, '')}×`} onChange={setSpeed} />
                    <div className="switches">
                      <Toggle label="Swim" on={swim} set={setSwim} />
                      <Toggle label="Fin motion" on={fins} set={setFins} />
                      <Toggle label="Breathing" on={breathe} set={setBreathe} />
                      <Toggle label="Eye tracking" on={eyes} set={setEyes} />
                      <Toggle label="Auto feed" on={autoFeed} set={(v) => { if (v) setGape(0); setAutoFeed(v); }} />
                      <Toggle label="Mesh" on={wire} set={setWire} />
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
        {UI && panel && <aside className="field-panel" aria-label="Field guide"><FieldGuide fish={fish} census={census} onPick={pickFish} onRecensus={() => setCensusSeed((n) => n + 1)} onClose={() => setPanel(false)} /></aside>}
      </div>
      {UI && <footer className="lab-footer"><span><Activity size={13} /> {pending ? 'Building geometry' : 'Live simulation'}</span><span className="footer-spec">{NICHE_INFO[fish.niche].name} <i /> {fish.clade ?? LINEAGES[fish.lineage].name}</span><button onClick={() => setHelp(true)}><Keyboard size={15} /> Shortcuts <ArrowDownRight size={12} /></button></footer>}
      {help && <Help close={() => setHelp(false)} />}
    </div>
  );
}
