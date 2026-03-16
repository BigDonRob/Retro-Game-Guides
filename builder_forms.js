/* ═══════════════════════════════════════════════════════════════════════
   builder_forms.js  —  Editor Sheets & Forms
   Depends on builder.js (must load first — exports window.B).

   Exports window.BForms = {
     openMetaSheet, openAddTabSheet, openEditTabSheet,
     openAddPanelSheet, openEditPanelSheet,
     openAddRowSheet, openEditRowSheet, openManageRowsSheet,
     getPanelRows,
   }
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Bail if not in editor mode (builder.js sets this)
  if (!window.B) return;

  const { state, uid, esc, fGroup, fInput, fTextarea, openSheet, closeSheet, renderPreview } = window.B;

  // ── META SHEET ───────────────────────────────────────────────────────
  function openMetaSheet(opts) {
    const onCancel = opts?.onCancel || null;
    const m  = state.meta;
    const el = document.createElement('div');

    // Build system options sorted by name
    const systemOptions = Object.entries(state._systems)
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([id, name]) =>
        `<option value="${id}"${parseInt(id) === m.systemId ? ' selected' : ''}>${esc(name)}</option>`
      ).join('');

    // Build alt-system multi-select (same list)
    const altSystemOptions = Object.entries(state._systems)
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([id, name]) =>
        `<option value="${id}"${(m.altSystemIds || []).includes(parseInt(id)) ? ' selected' : ''}>${esc(name)}</option>`
      ).join('');

    el.innerHTML = `
      <div class="f-group">
        <label class="f-label">RetroAchievements Game ID *</label>
        <input class="f-input" id="mf-raId" type="number" placeholder="e.g. 2919" value="${esc(m.raId)}">
      </div>
      <div class="f-group">
        <label class="f-label">Game Title *</label>
        <input class="f-input" id="mf-name" placeholder="e.g. Harvest Moon: Hero of Leaf Valley" value="${esc(m.primaryName)}">
      </div>
      <div class="f-group">
        <label class="f-label">Alt Names <span style="font-weight:400;text-transform:none">(comma-separated — e.g. Japanese title)</span></label>
        <input class="f-input" id="mf-altnames" placeholder="e.g. Bokujo Monogatari" value="${esc(m.altNames)}">
      </div>
      <div class="f-row">
        <div class="f-group" style="flex:1">
          <label class="f-label">Primary System *</label>
          <select class="f-input" id="mf-sys">
            <option value="">— select —</option>
            ${systemOptions}
          </select>
        </div>
        <div class="f-group" style="flex:0 0 90px">
          <label class="f-label">Year</label>
          <input class="f-input" id="mf-year" type="number" placeholder="2007" value="${esc(m.year)}">
        </div>
      </div>
      <div class="f-group">
        <label class="f-label">Alt Systems <span style="font-weight:400;text-transform:none">(hold Ctrl/Cmd to select multiple)</span></label>
        <select class="f-input" id="mf-altsys" multiple size="4">
          ${altSystemOptions}
        </select>
      </div>
      <div class="f-group">
        <label class="f-label">Series</label>
        <input class="f-input" id="mf-series-search" list="mf-series-list"
          placeholder="Type to search…"
          value="${m.seriesHubId != null ? esc(state._series[m.seriesHubId] || '') : ''}">
        <datalist id="mf-series-list">
          ${Object.entries(state._series)
              .sort(([, a], [, b]) => a.localeCompare(b))
              .map(([id, name]) => `<option value="${esc(name)}" data-id="${id}">`)
              .join('')}
        </datalist>
        <input type="hidden" id="mf-series-id" value="${m.seriesHubId ?? ''}">
        <div class="f-hint">Leave blank if standalone. Hub ID resolves automatically from the series name.</div>
      </div>
      <div class="f-row">
        <div class="f-group" style="flex:1">
          <label class="f-label">Author</label>
          <input class="f-input" id="mf-author" placeholder="Your handle" value="${esc(m.author)}">
        </div>
        <div class="f-group" style="flex:0 0 80px">
          <label class="f-label">Icon</label>
          <input class="f-input" id="mf-icon" placeholder="🎮" value="${esc(m.icon)}" style="text-align:center;font-size:18px">
        </div>
      </div>
      <div class="f-group">
        <label class="f-label">Subtitle <span style="font-weight:400;text-transform:none">(shown in guide viewer, not on browse card)</span></label>
        <input class="f-input" id="mf-sub" placeholder="e.g. Completion tracker — progress saved locally" value="${esc(m.subtitle)}">
      </div>
      <div class="f-group">
        <label class="f-label">Background Image <span style="font-weight:400;text-transform:none">(WebP only — centered behind all panels, not stretched)</span></label>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <label class="b-btn b-btn-ghost" style="cursor:pointer;font-size:11px">
            📁 Choose WebP…
            <input type="file" id="mf-bgimage-input" accept="image/webp" style="display:none">
          </label>
          <button type="button" id="mf-bgimage-clear" class="b-btn b-btn-ghost" style="font-size:11px;${m.bgImage ? '' : 'display:none'}">✕ Remove</button>
        </div>
        <div id="mf-bgimage-preview" style="margin-top:8px;${m.bgImage ? '' : 'display:none'}">
          <img id="mf-bgimage-thumb" src="${m.bgImage ? esc(m.bgImage) : ''}" style="max-width:100%;max-height:120px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);object-fit:cover;display:block">
          <div id="mf-bgimage-size" style="font-family:monospace;font-size:10px;color:#8b949e;margin-top:4px"></div>
        </div>
      </div>
      <div class="f-group">
        <label class="f-label">Content Tags <span style="font-weight:400;text-transform:none">(for browse filtering)</span></label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="mf-tag-walkthrough" ${m.contentTags?.includes('Walkthrough') ? 'checked' : ''}>
            Walkthrough
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="mf-tag-checklist" ${m.contentTags?.includes('Checklist') ? 'checked' : ''}>
            Checklist
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="mf-tag-reference" ${m.contentTags?.includes('Reference') ? 'checked' : ''}>
            Reference
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="mf-tag-achievement" ${m.contentTags?.includes('Achievement Guide') ? 'checked' : ''}>
            Achievement Guide
          </label>
        </div>
      </div>
      <hr class="f-divider">
      <div class="f-group">
        <label class="f-label">Theme <span style="font-weight:400;text-transform:none">— shape &amp; fonts</span></label>
        <div class="swatch-grid" id="mf-themes"></div>
      </div>
      <div class="f-group" style="margin-top:14px">
        <label class="f-label">Palette <span style="font-weight:400;text-transform:none">— colours</span></label>
        <div id="mf-palette-filters" class="do-filter-row" style="margin-bottom:8px"></div>
        <div class="swatch-grid" id="mf-palettes"></div>
      </div>`;

    // Resolve series hub_id when user picks from datalist
    const seriesSearchEl = el.querySelector('#mf-series-search');
    const seriesIdEl     = el.querySelector('#mf-series-id');
    const seriesRevMap   = Object.fromEntries(
      Object.entries(state._series).map(([id, name]) => [name, parseInt(id)])
    );
    seriesSearchEl.addEventListener('input', () => {
      const hubId = seriesRevMap[seriesSearchEl.value.trim()];
      seriesIdEl.value = hubId != null ? String(hubId) : '';
    });

    // Background image — file picker + clear
    const bgInput   = el.querySelector('#mf-bgimage-input');
    const bgClear   = el.querySelector('#mf-bgimage-clear');
    const bgPreview = el.querySelector('#mf-bgimage-preview');
    const bgThumb   = el.querySelector('#mf-bgimage-thumb');
    const bgSize    = el.querySelector('#mf-bgimage-size');
    let bgImageData = m.bgImage || '';

    function showBgPreview(dataUrl, bytes) {
      bgThumb.src = dataUrl;
      bgSize.textContent = bytes != null ? `${(bytes / 1024).toFixed(1)} KB` : '';
      bgPreview.style.display = '';
      bgClear.style.display = '';
    }
    function clearBgImage() {
      bgImageData = '';
      bgThumb.src = '';
      bgPreview.style.display = 'none';
      bgClear.style.display = 'none';
      bgInput.value = '';
    }
    if (bgImageData) showBgPreview(bgImageData, null);
    bgInput.addEventListener('change', () => {
      const file = bgInput.files[0];
      if (!file) return;
      if (file.type !== 'image/webp') { alert('Please choose a WebP image.'); bgInput.value = ''; return; }
      const reader = new FileReader();
      reader.onload = e => { bgImageData = e.target.result; showBgPreview(bgImageData, file.size); };
      reader.readAsDataURL(file);
    });
    bgClear.addEventListener('click', clearBgImage);

    // Theme swatches
    const themeGrid = el.querySelector('#mf-themes');
    Object.entries(state._themes).forEach(([key, th]) => {
      const card = document.createElement('div');
      card.className = 'swatch-card' + (m.theme === key ? ' selected' : '');
      card.dataset.key = key;
      card.innerHTML = `<div class="swatch-name">${esc(th.label)}</div><div class="swatch-desc">${esc(th.description || '')}</div>`;
      card.addEventListener('click', () => {
        themeGrid.querySelectorAll('.swatch-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      themeGrid.appendChild(card);
    });

    // Palette swatches
    const palGrid = el.querySelector('#mf-palettes');
    Object.entries(state._palettes).forEach(([key, pal]) => {
      const card = document.createElement('div');
      card.className = 'swatch-card' + (m.palette === key ? ' selected' : '');
      card.dataset.key = key;
      const dots = [
        [pal.vars?.['--bg'],       true ],
        [pal.vars?.['--emphasis'], false],
        [pal.vars?.['--positive'], false],
        [pal.vars?.['--text'],     true ],
      ].map(([c, b]) =>
        `<div class="swatch-dot" style="background:${c||'#888'};${b?'border:1px solid rgba(128,128,128,0.3)':''}"></div>`
      ).join('');
      card.innerHTML = `<div class="swatch-dot-row">${dots}</div><div class="swatch-name">${esc(pal.label)}</div>`;
      card.addEventListener('click', () => {
        palGrid.querySelectorAll('.swatch-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      palGrid.appendChild(card);
    });

    // Palette filter chips — shared key with viewer so state is remembered
    const BF_ROYGBIV = ['red','orange','yellow','green','blue','violet','neutral'];
    const BF_FILTER_KEY = 'bdr_palette_filters';
    const bfFilterRow = el.querySelector('#mf-palette-filters');
    const bfPalettes  = state._palettes;

    let bfFilterState = null;
    try { const r = localStorage.getItem(BF_FILTER_KEY); if (r) bfFilterState = JSON.parse(r); } catch (_) {}
    if (!bfFilterState) {
      const firstDark = BF_ROYGBIV.find(hue =>
        Object.values(bfPalettes).some(p => p.hue === hue && p.dark && !p.hc)
      );
      bfFilterState = { modes: ['dark'], hues: firstDark ? [firstDark] : [] };
    }
    let bfActiveModes = new Set(bfFilterState.modes || []);
    let bfActiveHues  = new Set(bfFilterState.hues  || []);

    function bfSaveFilters() {
      try { localStorage.setItem(BF_FILTER_KEY, JSON.stringify({ modes: [...bfActiveModes], hues: [...bfActiveHues] })); } catch (_) {}
    }

    function bfPalVisible(pal) {
      if (!pal) return true;
      let modeMatch = false;
      if (bfActiveModes.has('dark')  && pal.dark  && !pal.hc) modeMatch = true;
      if (bfActiveModes.has('light') && !pal.dark && !pal.hc) modeMatch = true;
      if (bfActiveModes.has('hc')    && pal.hc)               modeMatch = true;
      if (bfActiveModes.size === 0) modeMatch = true;
      if (!modeMatch) return false;
      if (bfActiveHues.size === 0) return true;
      return bfActiveHues.has(pal.hue);
    }

    function bfRefreshVisibility() {
      palGrid.querySelectorAll('.swatch-card').forEach(c => {
        c.style.display = bfPalVisible(bfPalettes[c.dataset.key]) ? '' : 'none';
      });
    }

    // Apply initial filter visibility to palette swatches
    bfRefreshVisibility();

    if (bfFilterRow) {
      const bfHasHC = Object.values(bfPalettes).some(p => p.hc);
      const bfAvailHues = BF_ROYGBIV.filter(hue =>
        Object.values(bfPalettes).some(p => p.hue === hue && !p.hc)
      );
      [
        { key: 'dark',  label: 'Dark' },
        { key: 'light', label: 'Light' },
        ...(bfHasHC ? [{ key: 'hc', label: 'High Contrast' }] : []),
      ].forEach(({ key, label }) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'do-chip' + (bfActiveModes.has(key) ? ' active' : '');
        chip.textContent = label;
        chip.addEventListener('click', () => {
          bfActiveModes.has(key) ? bfActiveModes.delete(key) : bfActiveModes.add(key);
          chip.classList.toggle('active', bfActiveModes.has(key));
          bfSaveFilters(); bfRefreshVisibility();
        });
        bfFilterRow.appendChild(chip);
      });

      if (bfAvailHues.length) {
        const sep = document.createElement('span');
        sep.className = 'do-chip-sep'; sep.textContent = '|';
        bfFilterRow.appendChild(sep);
      }

      bfAvailHues.forEach(hue => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'do-chip' + (bfActiveHues.has(hue) ? ' active' : '');
        chip.textContent = hue.charAt(0).toUpperCase() + hue.slice(1);
        chip.addEventListener('click', () => {
          bfActiveHues.has(hue) ? bfActiveHues.delete(hue) : bfActiveHues.add(hue);
          chip.classList.toggle('active', bfActiveHues.has(hue));
          bfSaveFilters(); bfRefreshVisibility();
        });
        bfFilterRow.appendChild(chip);
      });
    }

    openSheet('Game Meta', el, () => {
      const raId = el.querySelector('#mf-raId').value.trim();
      const name = el.querySelector('#mf-name').value.trim();
      if (!raId || isNaN(parseInt(raId))) { alert('Please enter a valid RA Game ID.'); return false; }
      if (!name)                          { alert('Please enter a game title.'); return false; }

      const sysVal = el.querySelector('#mf-sys').value;
      if (!sysVal) { alert('Please select a primary system.'); return false; }

      // Alt systems: all selected options
      const altSysSelect = el.querySelector('#mf-altsys');
      const altSystemIds = [...altSysSelect.selectedOptions]
        .map(o => parseInt(o.value))
        .filter(id => !isNaN(id) && id !== parseInt(sysVal));

      // Series: use resolved hub_id from hidden field
      const seriesIdRaw = el.querySelector('#mf-series-id').value.trim();
      const seriesHubId = seriesIdRaw ? parseInt(seriesIdRaw) : null;

      state.meta.raId          = raId;
      state.meta.primaryName   = name;
      state.meta.systemId      = parseInt(sysVal);
      state.meta.altSystemIds  = altSystemIds;
      state.meta.altNames      = el.querySelector('#mf-altnames').value.trim();
      state.meta.seriesHubId   = !isNaN(seriesHubId) ? seriesHubId : null;
      state.meta.year          = el.querySelector('#mf-year').value.trim();
      state.meta.author        = el.querySelector('#mf-author').value.trim();
      state.meta.icon          = el.querySelector('#mf-icon').value.trim() || '🎮';
      state.meta.subtitle      = el.querySelector('#mf-sub').value.trim();
      state.meta.bgImage       = bgImageData;

      const contentTags = [];
      if (el.querySelector('#mf-tag-walkthrough').checked) contentTags.push('Walkthrough');
      if (el.querySelector('#mf-tag-checklist').checked)   contentTags.push('Checklist');
      if (el.querySelector('#mf-tag-reference').checked)   contentTags.push('Reference');
      if (el.querySelector('#mf-tag-achievement').checked) contentTags.push('Achievement Guide');
      state.meta.contentTags = contentTags;

      const selTheme = themeGrid.querySelector('.selected');
      const selPal   = palGrid.querySelector('.selected');
      if (selTheme) state.meta.theme   = selTheme.dataset.key;
      if (selPal)   state.meta.palette = selPal.dataset.key;
      renderPreview();
      return true;
    }, 'Save Meta', onCancel);
  }

  // ── TAB SHEETS ───────────────────────────────────────────────────────
  function openAddTabSheet() {
    const el = document.createElement('div');
    el.appendChild(fGroup('Tab Name *',
      fInput('tf-label', 'e.g. 💰 Sales  or  📋 Basics', ''),
      'You can include an emoji at the start.'));
    openSheet('Add Tab', el, () => {
      const label = el.querySelector('#tf-label').value.trim();
      if (!label) { alert('Enter a tab name.'); return false; }
      const tab = { id: uid('tab'), label, panels: [] };
      state.tabs.push(tab);
      state.activeTabId = tab.id;
      renderPreview();
      return true;
    }, 'Add Tab');
  }

  function openEditTabSheet(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    const el = document.createElement('div');
    el.appendChild(fGroup('Tab Name *', fInput('tf-label', '', tab.label)));
    openSheet('Rename Tab', el, () => {
      const label = el.querySelector('#tf-label').value.trim();
      if (!label) { alert('Enter a tab name.'); return false; }
      tab.label = label;
      renderPreview();
      return true;
    }, 'Save Tab');
  }

  // ── PANEL SHEETS ─────────────────────────────────────────────────────
  function openAddPanelSheet(tabId) {
    let selectedType = null;

    const el = document.createElement('div');
    el.innerHTML = `
      <div class="f-group">
        <label class="f-label">Panel Type</label>
        <div class="type-grid" id="pt-grid"></div>
      </div>
      <div id="pt-form-area"></div>`;

    const grid     = el.querySelector('#pt-grid');
    const formArea = el.querySelector('#pt-form-area');

    const defaultTypes = {
      text:      { label: 'Text / Prose',  icon: '📝', description: 'Freeform markdown content.' },
      keyvalue:  { label: 'Key / Value',   icon: '🗂️', description: 'Two-column reference pairs.' },
      checklist: { label: 'Checklist',     icon: '☑️', description: 'Trackable items with columns.' },
      table:     { label: 'Table',         icon: '📊', description: 'Reference table with headers.' },
      cardgrid:  { label: 'Card Grid',     icon: '🃏', description: 'Customisable card layout with image and text regions.' },
    };
    // Filter out legacy 'cards' type from picker — it remains in the renderer for existing data
    const rawTypes = Object.keys(state._panelTypes).length ? state._panelTypes : defaultTypes;
    const types = Object.fromEntries(
      Object.entries(rawTypes).filter(([k]) => k !== 'cards').map(([k, v]) =>
        k === 'cards' ? ['cardgrid', { label: 'Card Grid', icon: '🃏', description: 'Customisable card layout.' }] : [k, v]
      )
    );
    // Ensure cardgrid is always present
    if (!types.cardgrid) types.cardgrid = defaultTypes.cardgrid;

    Object.entries(types).forEach(([key, pt]) => {
      const card = document.createElement('div');
      card.className = 'type-card';
      card.dataset.type = key;
      card.innerHTML = `<div class="type-card-icon">${pt.icon}</div><div class="type-card-label">${esc(pt.label)}</div><div class="type-card-desc">${esc(pt.description)}</div>`;
      card.addEventListener('click', () => {
        grid.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedType = key;
        formArea.innerHTML = '';
        formArea.appendChild(buildStructureForm(key, null));
      });
      grid.appendChild(card);
    });

    openSheet('Add Panel', el, () => {
      if (!selectedType) { alert('Select a panel type.'); return false; }
      if (selectedType === 'cardgrid') {
        // Read title + density from the setup form
        const title = formArea.querySelector('#pf-title')?.value.trim();
        if (!title) { alert('Panel title is required.'); return false; }
        const densityEl = formArea.querySelector('.cg-density-opt.selected');
        const cardColumns = densityEl ? parseInt(densityEl.dataset.cols) : 1;
        const panel = {
          id: uid('panel'), panelType: 'cardgrid', title, cardColumns,
          grid: { cols: 3, rows: 3 }, regions: [], items: [],
        };
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return false;
        tab.panels.push(panel);
        // Close sheet then launch grid editor
        setTimeout(() => openCardGridEditor(tabId, panel.id), 50);
        return true;
      }
      const panel = readStructureForm(formArea, selectedType);
      if (!panel) return false;
      panel.id        = uid('panel');
      panel.panelType = selectedType;
      // Initialise empty data arrays so row management works immediately
      if (selectedType === 'keyvalue')  panel.rows  = panel.rows  || [];
      if (selectedType === 'checklist') panel.items = panel.items || [];
      if (selectedType === 'table')     panel.rows  = panel.rows  || [];
      if (selectedType === 'cards')     panel.cards = panel.cards || [];
      const tab = state.tabs.find(t => t.id === tabId);
      if (tab) { tab.panels.push(panel); renderPreview(); }
      return true;
    }, 'Create Panel →');
  }

  function openEditPanelSheet(tabId, panelId) {
    const tab   = state.tabs.find(t => t.id === tabId);
    const panel = tab?.panels.find(p => p.id === panelId);
    if (!panel) return;
    // cardgrid structure editing is handled by the full-area grid editor
    if (panel.panelType === 'cardgrid') {
      openCardGridEditor(tabId, panelId);
      return;
    }
    const formEl = buildStructureForm(panel.panelType, panel);
    openSheet('Edit Panel Structure', formEl, () => {
      const updated = readStructureForm(formEl, panel.panelType);
      if (!updated) return false;
      // Handle infobox removal explicitly
      if (updated.infobox === undefined) {
        delete panel.infobox;
        delete updated.infobox;
      }
      Object.assign(panel, updated);
      renderPreview();
      return true;
    }, 'Save Changes');
  }

  // ── STRUCTURE FORMS ───────────────────────────────────────────────────
  function buildStructureForm(type, data) {
    const el = document.createElement('div');
    el.dataset.panelType = type;
    const d = data || {};
    switch (type) {
      case 'text':      el.appendChild(buildTextForm(d));          break;
      case 'keyvalue':  el.appendChild(buildKVForm(d));            break;
      case 'checklist': el.appendChild(buildChecklistForm(d));     break;
      case 'table':     el.appendChild(buildTableForm(d));         break;
      case 'cards':     el.appendChild(buildCardsForm(d));         break;
      case 'cardgrid':  el.appendChild(buildCardGridSetupForm(d)); break;
    }
    return el;
  }

  function readStructureForm(formEl, type) {
    const title = formEl.querySelector('#pf-title')?.value.trim();
    if (!title) { alert('Panel title is required.'); return null; }
    const panel   = { title };
    const infobox = formEl.querySelector('#pf-infobox')?.value.trim();
    if (infobox) panel.infobox = infobox;
    switch (type) {
      case 'text':
        panel.content = formEl.querySelector('#pf-content')?.value || '';
        break;
      case 'checklist':
        panel.columns = readColumns(formEl.querySelector('#cl-cols'));
        break;
      case 'table':
        panel.columns = readTableCols(formEl.querySelector('#tbl-cols'));
        break;
      case 'cards':
        panel.cardFields = readCardFields(formEl.querySelector('#cards-fields'));
        break;
    }
    return panel;
  }

  function buildTextForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Introduction', d.title)));
    el.appendChild(fGroup('Tip Box (optional)', fInput('pf-infobox', 'Highlighted callout above content', d.infobox)));

    // Markdown toolbar
    const gr_hr  = '<span class="gr-hr-preview"></span>';
    const gr_hr2 = '<span class="gr-hr2-preview"></span>';
    const toolbar = document.createElement('div'); toolbar.className = 'md-toolbar';
    [
      ['**B**',         '**',    '**'     ],
      ['*I*',           '*',     '*'      ],
      ['`C`',           '`',     '`'      ],
      ['H3',            '### ',  ''       ],
      [gr_hr,           '---\n', ''       ],
      [gr_hr2,          '===\n', ''       ],
      ['• List',        '- ',    ''       ],
      ['&gt; Info',     '> ',    ''       ],
      ['[Link](url)',   '[',     '](url)' ],
      ['[Tab](N)',      '[',     '](1)'   ],
      ['[Panel](N,M)',  '[',     '](1,1)' ],
      ['[box]{}',       '[',     ']{\n}'  ],
    ].forEach(([label, before, after]) => {
      const btn = document.createElement('button');
      btn.className = 'md-btn'; btn.type = 'button'; btn.innerHTML = label;
      btn.addEventListener('click', () => {
        const ta = el.querySelector('#pf-content');
        const s = ta.selectionStart, e2 = ta.selectionEnd;
        const sel = ta.value.slice(s, e2);
        ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e2);
        ta.focus();
        ta.selectionStart = s + before.length;
        ta.selectionEnd   = s + before.length + sel.length;
      });
      toolbar.appendChild(btn);
    });

    const cg = document.createElement('div'); cg.className = 'f-group';
    const lbl = document.createElement('label'); lbl.className = 'f-label'; lbl.textContent = 'Content *';
    const ta  = fTextarea('pf-content', d.content, 'Markdown supported…');
    cg.append(lbl, toolbar, ta);
    el.appendChild(cg);
    return el;
  }

  function buildKVForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Controls', d.title)));
    appendDeferred(el, 'Use Add Row to add key / value pairs after creating the panel.');
    return el;
  }

  function buildChecklistForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Crops', d.title)));
    el.appendChild(fGroup('Tip Box (optional)', fInput('pf-infobox', 'e.g. No shipment box — bring items to shops.', d.infobox)));

    const colGroup = document.createElement('div'); colGroup.className = 'f-group';
    const colLbl   = document.createElement('label'); colLbl.className = 'f-label';
    colLbl.textContent = 'Extra Columns';
    const colHint  = document.createElement('div'); colHint.className = 'f-hint';
    colHint.textContent = 'Checkbox and row number are always included. Add extras e.g. Entry Name, Location, Price, Notes.';
    const colList  = document.createElement('div'); colList.className = 'list-section'; colList.id = 'cl-cols';
    colGroup.append(colLbl, colHint, colList);
    (d.columns || []).forEach(c => addColRow(colList, c.label, c.key, c.style));
    const colAdd = document.createElement('button'); colAdd.className = 'list-add'; colAdd.textContent = '+ Add Column';
    colAdd.addEventListener('click', () => addColRow(colList, '', '', 'plain'));
    colGroup.appendChild(colAdd);
    el.appendChild(colGroup);
    appendDeferred(el, 'Use Add Row to add checklist items after creating the panel.');
    return el;
  }

  function buildTableForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Weapon Stats', d.title)));

    const colGroup = document.createElement('div'); colGroup.className = 'f-group';
    const colLbl   = document.createElement('label'); colLbl.className = 'f-label';
    colLbl.textContent = 'Column Headers';
    const colHint  = document.createElement('div'); colHint.className = 'f-hint';
    colHint.textContent = 'Define all columns first — e.g. Name, Damage, Speed, Notes.';
    const colList  = document.createElement('div'); colList.className = 'list-section'; colList.id = 'tbl-cols';
    colGroup.append(colLbl, colHint, colList);
    (d.columns || []).forEach(c => addTableCol(colList, typeof c === 'string' ? c : c.label || ''));
    const colAdd = document.createElement('button'); colAdd.className = 'list-add'; colAdd.textContent = '+ Add Column';
    colAdd.addEventListener('click', () => addTableCol(colList, ''));
    colGroup.appendChild(colAdd);
    el.appendChild(colGroup);
    appendDeferred(el, 'Use Add Row to fill in table rows after creating the panel.');
    return el;
  }

  function buildCardsForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Villagers', d.title)));

    const cfGroup = document.createElement('div'); cfGroup.className = 'f-group';
    const cfLbl   = document.createElement('label'); cfLbl.className = 'f-label';
    cfLbl.textContent = 'Card Fields';
    const cfHint  = document.createElement('div'); cfHint.className = 'f-hint';
    cfHint.textContent = 'First field becomes the card title.';
    const cfList  = document.createElement('div'); cfList.className = 'list-section'; cfList.id = 'cards-fields';
    cfGroup.append(cfLbl, cfHint, cfList);
    (d.cardFields || []).forEach(f => addCardField(cfList, f.label, f.key));
    const cfAdd = document.createElement('button'); cfAdd.className = 'list-add'; cfAdd.textContent = '+ Add Field';
    cfAdd.addEventListener('click', () => addCardField(cfList, '', ''));
    cfGroup.appendChild(cfAdd);
    el.appendChild(cfGroup);
    appendDeferred(el, 'Use Add Row to fill in cards after creating the panel.');
    return el;
  }

  // ── CARD GRID SETUP FORM (shown in Add Panel sheet) ──────────────────
  function buildCardGridSetupForm(d) {
    const el = document.createElement('div');
    el.appendChild(fGroup('Panel Title *', fInput('pf-title', 'e.g. Villagers', d?.title || '')));

    const dg = document.createElement('div'); dg.className = 'f-group';
    const dl = document.createElement('label'); dl.className = 'f-label'; dl.textContent = 'Card Density (desktop)';
    const dh = document.createElement('div'); dh.className = 'f-hint'; dh.textContent = 'How many cards sit side-by-side on wide screens.';
    const dc = document.createElement('div'); dc.className = 'cg-density-row';
    dg.append(dl, dh, dc);

    const densities = [
      { cols: 1, label: 'Full',   mock: 1 },
      { cols: 2, label: 'Half',   mock: 2 },
      { cols: 3, label: 'Thirds', mock: 3 },
    ];
    const current = d?.cardColumns || 1;
    densities.forEach(({ cols, label, mock }) => {
      const opt = document.createElement('div');
      opt.className = 'cg-density-opt' + (cols === current ? ' selected' : '');
      opt.dataset.cols = cols;
      const preview = document.createElement('div'); preview.className = 'cg-density-preview';
      for (let i = 0; i < mock; i++) {
        const card = document.createElement('div'); card.className = 'cg-density-card'; preview.appendChild(card);
      }
      const lbl = document.createElement('div'); lbl.className = 'cg-density-label'; lbl.textContent = label;
      opt.append(preview, lbl);
      opt.addEventListener('click', () => {
        dc.querySelectorAll('.cg-density-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
      dc.appendChild(opt);
    });
    el.appendChild(dg);
    return el;
  }

  // ── CARD GRID EDITOR (takes over #tab-content) ────────────────────────
  function openCardGridEditor(tabId, panelId) {
    const { state: S, esc: e2, renderPreview: rp, closeSheet: cs } = window.B;
    cs();  // close any open sheet first

    const tab   = S.tabs.find(t => t.id === tabId);
    const panel = tab?.panels.find(p => p.id === panelId);
    if (!panel) return;

    S.gridEditorActive = true;

    // ── Editor state ─────────────────────────────────────────────────
    let gridCols   = panel.grid?.cols || 3;
    let gridRows   = panel.grid?.rows || 3;
    let regions    = (panel.regions || []).map(r => ({ ...r }));
    let nextNum    = regions.reduce((m, r) => Math.max(m, parseInt(r.id?.replace('r','') || 0)), 0) + 1;

    let selAnchor  = null;   // { col, row }
    let selCurrent = null;   // { col, row }
    let isSelecting = false;

    const COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316','#06b6d4','#ec4899'];
    const regionColor = id => COLORS[regions.findIndex(r => r.id === id) % COLORS.length] || COLORS[0];

    function occupiedMap() {
      const m = {};
      regions.forEach(r => {
        for (let c = r.col; c < r.col + r.colSpan; c++)
          for (let row = r.row; row < r.row + r.rowSpan; row++)
            m[`${c},${row}`] = r.id;
      });
      return m;
    }

    function getSelRect() {
      if (!selAnchor || !selCurrent) return null;
      return {
        col:     Math.min(selAnchor.col, selCurrent.col),
        row:     Math.min(selAnchor.row, selCurrent.row),
        colSpan: Math.abs(selCurrent.col - selAnchor.col) + 1,
        rowSpan: Math.abs(selCurrent.row - selAnchor.row) + 1,
      };
    }

    function rectOverlaps(rect) {
      const occ = occupiedMap();
      for (let c = rect.col; c < rect.col + rect.colSpan; c++)
        for (let r = rect.row; r < rect.row + rect.rowSpan; r++)
          if (occ[`${c},${r}`]) return true;
      return false;
    }

    function maxOccupied() {
      let mc = 0, mr = 0;
      regions.forEach(r => {
        mc = Math.max(mc, r.col + r.colSpan - 1);
        mr = Math.max(mr, r.row + r.rowSpan - 1);
      });
      return { mc, mr };
    }

    // ── DOM setup ────────────────────────────────────────────────────
    const content = document.getElementById('tab-content');
    content.style.maxWidth = 'none';
    content.style.padding  = '0';
    content.innerHTML = '';

    const editor = document.createElement('div'); editor.id = 'cg-editor';

    // Header
    const hdr = document.createElement('div'); hdr.className = 'cg-editor-hdr';
    hdr.innerHTML = `
      <span class="cg-editor-title">⊞ Grid Layout: <strong>${e2(panel.title)}</strong></span>
      <div class="cg-editor-dims">
        <label class="cg-dim-lbl">Cols</label>
        <input type="number" id="cg-cols-inp" class="cg-dim-inp" min="1" max="12" value="${gridCols}">
        <label class="cg-dim-lbl">Rows</label>
        <input type="number" id="cg-rows-inp" class="cg-dim-inp" min="1" max="12" value="${gridRows}">
      </div>
      <button id="cg-done-btn" class="b-btn b-btn-primary">✓ Done</button>`;

    // Hint
    const hint = document.createElement('div'); hint.className = 'cg-hint';
    hint.textContent = 'Click and drag to select a rectangular region. Work right-to-left or top-to-bottom — regions are easier to expand than shrink.';

    // Body: grid + sidebar
    const body = document.createElement('div'); body.className = 'cg-editor-body';
    const gridWrap = document.createElement('div'); gridWrap.id = 'cg-grid-wrap';
    const sidebar  = document.createElement('div'); sidebar.className = 'cg-sidebar';
    sidebar.innerHTML = `<div class="cg-sidebar-title">Defined Regions</div><div id="cg-regions-list"></div><div class="cg-hint" style="margin-top:10px">Unassigned cells are blank — that's valid.</div>`;
    body.append(gridWrap, sidebar);

    // Config panel (hidden until selection)
    const cfgPanel = document.createElement('div'); cfgPanel.id = 'cg-cfg'; cfgPanel.style.display = 'none';

    editor.append(hdr, hint, body, cfgPanel);
    content.appendChild(editor);

    // ── Render functions ─────────────────────────────────────────────
    function buildGridDOM(interactive) {
      // Builds one card-grid element. interactive=true adds mouse events + selection highlight.
      const occ     = occupiedMap();
      const rect    = interactive ? getSelRect() : null;
      const overlap = rect ? rectOverlaps(rect) : false;

      const grid = document.createElement('div');
      grid.className = 'cg-grid';
      grid.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
      grid.style.gridTemplateRows    = `repeat(${gridRows}, 1fr)`;

      for (let r = 1; r <= gridRows; r++) {
        for (let c = 1; c <= gridCols; c++) {
          const cell = document.createElement('div');
          cell.className = 'cg-grid-cell';
          if (interactive) { cell.dataset.col = c; cell.dataset.row = r; }

          const rid = occ[`${c},${r}`];
          if (rid) {
            cell.classList.add('cg-cell-occ');
            cell.style.background  = regionColor(rid) + '28';
            cell.style.borderColor = regionColor(rid) + '99';
            const reg = regions.find(x => x.id === rid);
            if (reg && reg.col === c && reg.row === r) {
              const lbl = document.createElement('span'); lbl.className = 'cg-cell-lbl';
              lbl.textContent = (reg.type === 'image' ? '🖼 ' : '📝 ') + (reg.field || reg.value || reg.id);
              cell.appendChild(lbl);
            }
          } else if (rect && c >= rect.col && c < rect.col + rect.colSpan && r >= rect.row && r < rect.row + rect.rowSpan) {
            cell.classList.add(overlap ? 'cg-cell-sel-bad' : 'cg-cell-sel');
          }
          grid.appendChild(cell);
        }
      }

      if (interactive) {
        grid.addEventListener('mousedown', ev => {
          const cell = ev.target.closest('.cg-grid-cell'); if (!cell) return;
          const c = parseInt(cell.dataset.col), r = parseInt(cell.dataset.row);
          if (occupiedMap()[`${c},${r}`]) return;
          ev.preventDefault();
          isSelecting = true; selAnchor = { col: c, row: r }; selCurrent = { col: c, row: r };
          cfgPanel.style.display = 'none';
          renderGrid();
        });
        grid.addEventListener('mousemove', ev => {
          if (!isSelecting) return;
          const cell = ev.target.closest('.cg-grid-cell'); if (!cell) return;
          selCurrent = { col: parseInt(cell.dataset.col), row: parseInt(cell.dataset.row) };
          renderGrid();
        });
        grid.addEventListener('mouseup', ev => {
          if (!isSelecting) return;
          isSelecting = false;
          const r = getSelRect(); if (!r) return;
          if (rectOverlaps(r)) { selAnchor = null; selCurrent = null; renderGrid(); return; }
          showCfgPanel(r);
        });
      }
      return grid;
    }

    function renderGrid() {
      gridWrap.innerHTML = '';

      const row = document.createElement('div');
      row.className = 'cg-cards-row';
      // --cg-card-cols drives equal flex widths
      row.style.setProperty('--cg-editor-cols', String(panel.cardColumns || 1));

      for (let i = 0; i < (panel.cardColumns || 1); i++) {
        const slot = document.createElement('div');
        slot.className = 'cg-card-slot' + (i > 0 ? ' cg-card-slot-ghost' : '');

        if (i === 0) {
          const badge = document.createElement('div'); badge.className = 'cg-slot-badge'; badge.textContent = 'editable';
          slot.appendChild(badge);
        } else {
          const badge = document.createElement('div'); badge.className = 'cg-slot-badge cg-slot-badge-ghost'; badge.textContent = 'mirror';
          slot.appendChild(badge);
        }

        slot.appendChild(buildGridDOM(i === 0));
        row.appendChild(slot);
      }

      gridWrap.appendChild(row);
    }

    function renderSidebar() {
      const list = document.getElementById('cg-regions-list'); if (!list) return;
      list.innerHTML = '';
      if (!regions.length) {
        list.innerHTML = '<div class="cg-hint">No regions yet — drag on the grid to define one.</div>';
        return;
      }
      regions.forEach((reg, idx) => {
        const row = document.createElement('div'); row.className = 'cg-region-row';
        row.style.borderLeftColor = regionColor(reg.id);
        const info = document.createElement('span'); info.className = 'cg-region-info';
        const pos = `${reg.col},${reg.row} → ${reg.col+reg.colSpan-1},${reg.row+reg.rowSpan-1}`;
        const src = reg.type === 'image' ? `🖼 ${reg.field}` :
                    reg.source === 'constant' ? `📝 "${reg.value}"${reg.align === 'right' ? ' →' : ''}` :
                    `📝 field: ${reg.field}`;
        info.textContent = `${reg.id}: ${src}  [${pos}]`;
        const del = document.createElement('button'); del.className = 'cg-region-del'; del.textContent = '×'; del.title = 'Remove region';
        del.addEventListener('click', () => { regions.splice(idx, 1); renderGrid(); renderSidebar(); });
        row.append(info, del);
        list.appendChild(row);
      });
    }

    function showCfgPanel(rect) {
      cfgPanel.style.display = '';
      cfgPanel.innerHTML = '';

      const title = document.createElement('div'); title.className = 'cg-cfg-title';
      title.textContent = `New region: col ${rect.col}–${rect.col+rect.colSpan-1}, row ${rect.row}–${rect.row+rect.rowSpan-1}  (${rect.colSpan}×${rect.rowSpan})`;
      cfgPanel.appendChild(title);

      const body2 = document.createElement('div'); body2.className = 'cg-cfg-body';

      // Type toggle
      let selType = 'text';
      const typeRow = document.createElement('div'); typeRow.className = 'cg-cfg-row';
      const typeLbl = document.createElement('span'); typeLbl.className = 'cg-cfg-lbl'; typeLbl.textContent = 'Type:';
      const imgBtn  = document.createElement('button'); imgBtn.className = 'cg-cfg-toggle'; imgBtn.textContent = '🖼 Image';
      const txtBtn  = document.createElement('button'); txtBtn.className = 'cg-cfg-toggle cg-cfg-toggle-active'; txtBtn.textContent = '📝 Text';
      typeRow.append(typeLbl, imgBtn, txtBtn);

      // Image config
      const imgCfg = document.createElement('div'); imgCfg.className = 'cg-cfg-row'; imgCfg.style.display = 'none';
      imgCfg.innerHTML = `<span class="cg-cfg-lbl">Field key:</span><input class="cg-cfg-inp" id="cg-img-field" placeholder="e.g. portrait">`;

      // Text config
      const txtCfg = document.createElement('div'); txtCfg.className = 'cg-cfg-col';
      let selSrc = 'field';
      const srcRow = document.createElement('div'); srcRow.className = 'cg-cfg-row';
      const srcLbl = document.createElement('span'); srcLbl.className = 'cg-cfg-lbl'; srcLbl.textContent = 'Source:';
      const fldBtn = document.createElement('button'); fldBtn.className = 'cg-cfg-toggle cg-cfg-toggle-active'; fldBtn.textContent = 'Field';
      const cnstBtn= document.createElement('button'); cnstBtn.className = 'cg-cfg-toggle'; cnstBtn.textContent = 'Constant';
      srcRow.append(srcLbl, fldBtn, cnstBtn);

      const fldRow = document.createElement('div'); fldRow.className = 'cg-cfg-row';
      fldRow.innerHTML = `<span class="cg-cfg-lbl">Field key:</span><input class="cg-cfg-inp" id="cg-txt-field" placeholder="e.g. name">`;

      const cnstRow = document.createElement('div'); cnstRow.className = 'cg-cfg-row'; cnstRow.style.display = 'none';
      cnstRow.innerHTML = `<span class="cg-cfg-lbl">Text:</span><input class="cg-cfg-inp" id="cg-txt-const" placeholder="e.g. Likes:"><label class="cg-cfg-check"><input type="checkbox" id="cg-txt-align"> Right-align</label>`;

      txtCfg.append(srcRow, fldRow, cnstRow);

      // Toggle handlers
      imgBtn.addEventListener('click', () => {
        selType = 'image'; imgBtn.classList.add('cg-cfg-toggle-active'); txtBtn.classList.remove('cg-cfg-toggle-active');
        imgCfg.style.display = ''; txtCfg.style.display = 'none';
      });
      txtBtn.addEventListener('click', () => {
        selType = 'text'; txtBtn.classList.add('cg-cfg-toggle-active'); imgBtn.classList.remove('cg-cfg-toggle-active');
        imgCfg.style.display = 'none'; txtCfg.style.display = '';
      });
      fldBtn.addEventListener('click', () => {
        selSrc = 'field'; fldBtn.classList.add('cg-cfg-toggle-active'); cnstBtn.classList.remove('cg-cfg-toggle-active');
        fldRow.style.display = ''; cnstRow.style.display = 'none';
      });
      cnstBtn.addEventListener('click', () => {
        selSrc = 'constant'; cnstBtn.classList.add('cg-cfg-toggle-active'); fldBtn.classList.remove('cg-cfg-toggle-active');
        fldRow.style.display = 'none'; cnstRow.style.display = '';
      });

      // Action buttons
      const actRow = document.createElement('div'); actRow.className = 'cg-cfg-row cg-cfg-actions';
      const cancelBtn = document.createElement('button'); cancelBtn.className = 'b-btn b-btn-ghost'; cancelBtn.style.fontSize = '11px'; cancelBtn.textContent = '✗ Cancel';
      const confirmBtn = document.createElement('button'); confirmBtn.className = 'b-btn b-btn-primary'; confirmBtn.style.fontSize = '11px'; confirmBtn.textContent = '✓ Add Region';
      actRow.append(cancelBtn, confirmBtn);

      cancelBtn.addEventListener('click', () => {
        selAnchor = null; selCurrent = null; cfgPanel.style.display = 'none'; renderGrid();
      });

      confirmBtn.addEventListener('click', () => {
        let region;
        if (selType === 'image') {
          const field = cfgPanel.querySelector('#cg-img-field')?.value.trim();
          if (!field) { alert('Enter a field key for the image.'); return; }
          region = { id: `r${nextNum++}`, col: rect.col, row: rect.row, colSpan: rect.colSpan, rowSpan: rect.rowSpan, type: 'image', field };
        } else {
          if (selSrc === 'field') {
            const field = cfgPanel.querySelector('#cg-txt-field')?.value.trim();
            if (!field) { alert('Enter a field key.'); return; }
            region = { id: `r${nextNum++}`, col: rect.col, row: rect.row, colSpan: rect.colSpan, rowSpan: rect.rowSpan, type: 'text', source: 'field', field };
          } else {
            const value = cfgPanel.querySelector('#cg-txt-const')?.value.trim();
            if (!value) { alert('Enter constant text.'); return; }
            const align = cfgPanel.querySelector('#cg-txt-align')?.checked ? 'right' : 'left';
            region = { id: `r${nextNum++}`, col: rect.col, row: rect.row, colSpan: rect.colSpan, rowSpan: rect.rowSpan, type: 'text', source: 'constant', value, align };
          }
        }
        regions.push(region);
        selAnchor = null; selCurrent = null;
        cfgPanel.style.display = 'none';
        renderGrid(); renderSidebar();
      });

      body2.append(typeRow, imgCfg, txtCfg, actRow);
      cfgPanel.appendChild(body2);
    }

    // ── Wiring ───────────────────────────────────────────────────────
    document.getElementById('cg-cols-inp').addEventListener('change', ev => {
      const v = Math.max(1, Math.min(12, parseInt(ev.target.value) || 1));
      const { mc } = maxOccupied();
      if (v < mc) { ev.target.value = gridCols; alert(`Can't shrink: a region occupies column ${mc}.`); return; }
      gridCols = v; ev.target.value = v; renderGrid();
    });
    document.getElementById('cg-rows-inp').addEventListener('change', ev => {
      const v = Math.max(1, Math.min(12, parseInt(ev.target.value) || 1));
      const { mr } = maxOccupied();
      if (v < mr) { ev.target.value = gridRows; alert(`Can't shrink: a region occupies row ${mr}.`); return; }
      gridRows = v; ev.target.value = v; renderGrid();
    });
    document.getElementById('cg-done-btn').addEventListener('click', () => {
      panel.grid    = { cols: gridCols, rows: gridRows };
      panel.regions = regions;
      if (!panel.items) panel.items = [];
      // Restore tab-content styles
      content.style.maxWidth = '';
      content.style.padding  = '';
      S.gridEditorActive = false;
      rp();
    });

    renderGrid();
    renderSidebar();
  }

  function appendDeferred(el, msg) {
    const d = document.createElement('div');
    d.className = 'f-hint';
    d.style.cssText = 'padding:10px 12px;background:var(--b-surf2);border:1px solid var(--b-border);border-radius:6px;margin-top:8px';
    d.textContent = msg;
    el.appendChild(d);
  }

  // ── COLUMN / FIELD LIST HELPERS ───────────────────────────────────────
  function addColRow(list, label, key, style) {
    const item = document.createElement('div'); item.className = 'list-item';
    const styleOpts = ['plain','accent','dim'].map(s =>
      `<option value="${s}"${style===s?' selected':''}>${s==='plain'?'Standard':s==='accent'?'Accent':'Dim'}</option>`
    ).join('');
    item.innerHTML = `
      <div class="list-item-fields">
        <div class="f-row">
          <input class="f-input col-label" placeholder="Column label (e.g. Price)" value="${esc(label)}">
          <select class="f-select col-style" style="flex:0 0 110px">${styleOpts}</select>
        </div>
      </div>
      <button class="list-item-del" title="Remove">×</button>`;
    item.querySelector('.list-item-del').addEventListener('click', () => item.remove());
    list.appendChild(item);
  }
  function readColumns(colList) {
    if (!colList) return [];
    return [...colList.querySelectorAll('.list-item')].map(item => {
      const label = item.querySelector('.col-label').value.trim();
      const style = item.querySelector('.col-style').value;
      const key   = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || uid('col');
      return { key, label, style };
    }).filter(c => c.label);
  }

  function addTableCol(list, label) {
    const item = document.createElement('div'); item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-fields">
        <input class="f-input tbl-col-label" placeholder="Column header" value="${esc(label)}">
      </div>
      <button class="list-item-del" title="Remove">×</button>`;
    item.querySelector('.list-item-del').addEventListener('click', () => item.remove());
    list.appendChild(item);
  }
  function readTableCols(colList) {
    if (!colList) return [];
    return [...colList.querySelectorAll('.tbl-col-label')]
      .map(i => i.value.trim()).filter(Boolean);
  }

  function addCardField(list, label, key) {
    const item = document.createElement('div'); item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-fields">
        <div class="f-row">
          <input class="f-input cf-label" placeholder="Field label (e.g. Birthday)" value="${esc(label)}">
          <input class="f-input cf-key" placeholder="key (auto)" value="${esc(key)}"
                 style="flex:0 0 110px;font-family:var(--b-mono);font-size:11px">
        </div>
      </div>
      <button class="list-item-del" title="Remove">×</button>`;
    item.querySelector('.list-item-del').addEventListener('click', () => item.remove());
    const lInput = item.querySelector('.cf-label');
    const kInput = item.querySelector('.cf-key');
    lInput.addEventListener('input', () => {
      if (!kInput.dataset.manual)
        kInput.value = lInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    });
    kInput.addEventListener('input', () => { kInput.dataset.manual = '1'; });
    list.appendChild(item);
  }
  function readCardFields(list) {
    if (!list) return [];
    return [...list.querySelectorAll('.list-item')].map(item => {
      const label = item.querySelector('.cf-label').value.trim();
      const key   = item.querySelector('.cf-key').value.trim()
        || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
        || uid('f');
      return { key, label };
    }).filter(f => f.label);
  }

  // ── ROW DATA ACCESSORS ────────────────────────────────────────────────
  function getPanelRows(panel) {
    if (panel.panelType === 'checklist') return panel.items  || [];
    if (panel.panelType === 'keyvalue')  return panel.rows   || [];
    if (panel.panelType === 'table')     return panel.rows   || [];
    if (panel.panelType === 'cards')     return panel.cards  || [];
    if (panel.panelType === 'cardgrid')  return panel.items  || [];
    return [];
  }
  function appendRow(panel, row) {
    if      (panel.panelType === 'checklist') { if (!panel.items)  panel.items  = []; panel.items.push(row);  }
    else if (panel.panelType === 'keyvalue')  { if (!panel.rows)   panel.rows   = []; panel.rows.push(row);   }
    else if (panel.panelType === 'table')     { if (!panel.rows)   panel.rows   = []; panel.rows.push(row);   }
    else if (panel.panelType === 'cards')     { if (!panel.cards)  panel.cards  = []; panel.cards.push(row);  }
    else if (panel.panelType === 'cardgrid')  { if (!panel.items)  panel.items  = []; panel.items.push(row);  }
  }
  function setRow(panel, idx, row)  {
    const a = getPanelRows(panel);
    if (idx >= 0 && idx < a.length) a[idx] = row;
  }
  function deleteRow(panel, idx) { getPanelRows(panel).splice(idx, 1); }
  function moveRow(panel, idx, dir) {
    const arr = getPanelRows(panel), j = idx + dir;
    if (j >= 0 && j < arr.length) [arr[idx], arr[j]] = [arr[j], arr[idx]];
  }
  function getRowLabel(panel, row, idx) {
    if (panel.panelType === 'checklist') return row.name || `Row ${idx + 1}`;
    if (panel.panelType === 'keyvalue')  return row.key ? `${row.key}: ${String(row.value || '').slice(0, 40)}` : `Row ${idx + 1}`;
    if (panel.panelType === 'table')     return Array.isArray(row) ? (row[0] || `Row ${idx + 1}`) : `Row ${idx + 1}`;
    if (panel.panelType === 'cards')     { const f = panel.cardFields?.[0]; return f ? (row[f.key] || `Card ${idx + 1}`) : `Card ${idx + 1}`; }
    if (panel.panelType === 'cardgrid')  {
      // Use the first field-type region's key as the label source
      const firstField = (panel.regions || []).find(r => r.type === 'text' && r.source !== 'constant');
      return firstField ? (row[firstField.field] || `Card ${idx + 1}`) : `Card ${idx + 1}`;
    }
    return `Row ${idx + 1}`;
  }

  // ── ROW SHEETS ────────────────────────────────────────────────────────
  function openAddRowSheet(tabId, panelId) {
    const panel = findPanel(tabId, panelId);
    if (!panel) return;
    if (panel.panelType === 'cardgrid') {
      openAddCardSheet(tabId, panelId, null);
      return;
    }
    const { el, read } = buildRowForm(panel, null);
    openSheet(`Add Row — ${panel.title}`, el, () => {
      const row = read(); if (!row) return false;
      appendRow(panel, row); renderPreview(); return true;
    }, 'Add Row');
  }

  function openEditRowSheet(tabId, panelId, rowIdx) {
    const panel = findPanel(tabId, panelId);
    if (!panel) return;
    if (panel.panelType === 'cardgrid') {
      openAddCardSheet(tabId, panelId, rowIdx);
      return;
    }
    const { el, read } = buildRowForm(panel, getPanelRows(panel)[rowIdx]);
    openSheet(`Edit Row — ${panel.title}`, el, () => {
      const row = read(); if (!row) return false;
      setRow(panel, rowIdx, row); renderPreview(); return true;
    }, 'Save Row');
  }

  // cardgrid-specific Add/Edit Card sheet with live rendered preview
  function openAddCardSheet(tabId, panelId, rowIdx) {
    const panel    = findPanel(tabId, panelId);
    if (!panel) return;
    const existing = rowIdx != null ? getPanelRows(panel)[rowIdx] : null;
    const isEdit   = rowIdx != null;

    const { el: formEl, read, onAnyChange } = buildRowForm(panel, existing);

    // Wrapper: form on top, preview below
    const wrapper = document.createElement('div');

    // Preview area
    const previewWrap = document.createElement('div'); previewWrap.className = 'cg-card-preview-wrap';
    const previewLbl  = document.createElement('div'); previewLbl.className = 'cg-preview-lbl'; previewLbl.textContent = 'Preview';
    const previewEl   = document.createElement('div'); previewEl.className = 'cg-card-preview-area';
    previewWrap.append(previewLbl, previewEl);
    wrapper.append(formEl, previewWrap);

    function refreshPreview() {
      // Build a snapshot of current form values (sync only — images use stored data)
      const snap = read(true /* snapOnly */);
      if (!snap) return;
      previewEl.innerHTML = '';
      try {
        const mockPanel = {
          panelType: 'cardgrid', title: '', id: '_prev',
          cardColumns: 1, grid: panel.grid, regions: panel.regions,
          items: [snap],
        };
        const rendered = window.GuideRender.panel(mockPanel, { save: () => {}, load: () => false, preview: true });
        // Expand the card so it's always visible in the preview
        rendered.querySelectorAll('.gr-card').forEach(c => c.classList.remove('gr-collapsed'));
        // Strip the outer panel chrome — just show the inner cg-outer
        const inner = rendered.querySelector('.cg-outer');
        if (inner) previewEl.appendChild(inner);
        else previewEl.appendChild(rendered);
      } catch (e) {
        previewEl.textContent = '⚠ Preview unavailable';
      }
    }

    // Wire live refresh
    if (typeof onAnyChange === 'function') onAnyChange(refreshPreview);

    const label = isEdit ? `Edit Card — ${panel.title}` : `Add Card — ${panel.title}`;
    const btn   = isEdit ? 'Save Card' : 'Add Card';

    openSheet(label, wrapper, () => {
      const row = read(); if (!row) return false;
      if (isEdit) setRow(panel, rowIdx, row);
      else appendRow(panel, row);
      renderPreview(); return true;
    }, btn);

    // Initial preview render after sheet is open
    setTimeout(refreshPreview, 0);
  }

  function openManageRowsSheet(tabId, panelId) {
    const panel = findPanel(tabId, panelId);
    if (!panel) return;
    const el = document.createElement('div');

    const rebuild = () => {
      el.innerHTML = '';
      const rows = getPanelRows(panel);
      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'f-hint';
        empty.style.cssText = 'text-align:center;padding:24px';
        empty.textContent = 'No rows yet — close and use Add Row.';
        el.appendChild(empty);
        return;
      }
      rows.forEach((row, idx) => {
        const item = document.createElement('div');
        item.className = 'list-item'; item.style.alignItems = 'center';

        const label = document.createElement('div');
        label.style.cssText = 'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--b-text)';
        label.textContent = getRowLabel(panel, row, idx);

        const mkBtn = (text, cls, title) => {
          const b = document.createElement('button');
          b.className = 'b-ov-btn' + (cls ? ' ' + cls : '');
          b.textContent = text; b.title = title || ''; return b;
        };

        const upBtn  = mkBtn('↑',  '', 'Move up');    upBtn.style.padding  = '4px 7px';
        const dnBtn  = mkBtn('↓',  '', 'Move down');  dnBtn.style.padding  = '4px 7px';
        const editBtn = mkBtn('✎ Edit', '', 'Edit row');
        const delBtn  = mkBtn('🗑',  'b-ov-del', 'Delete row'); delBtn.style.padding = '4px 7px';

        upBtn.addEventListener('click',  () => { moveRow(panel, idx, -1); rebuild(); renderPreview(); });
        dnBtn.addEventListener('click',  () => { moveRow(panel, idx,  1); rebuild(); renderPreview(); });
        editBtn.addEventListener('click', () => {
          closeSheet();
          setTimeout(() => openEditRowSheet(tabId, panelId, idx), 200);
        });
        delBtn.addEventListener('click', () => {
          if (confirm('Delete this row?')) { deleteRow(panel, idx); rebuild(); renderPreview(); }
        });

        item.append(label, upBtn, dnBtn, editBtn, delBtn);
        el.appendChild(item);
      });
    };

    rebuild();
    openSheet(`Manage Rows — ${panel.title}`, el, () => true, 'Done');
  }

  // ── ROW FORM BUILDER ─────────────────────────────────────────────────
  function buildRowForm(panel, existing) {
    const el = document.createElement('div');
    const d  = existing || {};

    if (panel.panelType === 'keyvalue') {
      const keyInp = fInput('row-key',   'Key (e.g. Max HP)',   d.key   || '');
      const valInp = fInput('row-value', 'Value (markdown ok)', d.value !== undefined ? String(d.value) : '');
      el.appendChild(fGroup('Key *',  keyInp));
      el.appendChild(fGroup('Value', valInp));
      return { el, read: () => {
        const key = keyInp.value.trim();
        if (!key) { alert('Key is required.'); return null; }
        return { key, value: valInp.value.trim() };
      }};
    }

    if (panel.panelType === 'checklist') {
      const nameInp = fInput('row-name', 'Item name *', d.name || '');
      el.appendChild(fGroup('Name *', nameInp));
      const colInputs = (panel.columns || []).map(col => {
        const inp = fInput('col-' + col.key, col.label, d[col.key] || '');
        el.appendChild(fGroup(col.label, inp));
        return { key: col.key, inp };
      });
      const noteInp = fInput('row-note', 'Optional sub-note under name', d.note || '');
      el.appendChild(fGroup('Note (optional)', noteInp));
      return { el, read: () => {
        const name = nameInp.value.trim();
        if (!name) { alert('Name is required.'); return null; }
        const entry = { id: d.id || uid('item'), name };
        const note  = noteInp.value.trim();
        if (note) entry.note = note;
        colInputs.forEach(({ key, inp }) => { if (inp.value.trim()) entry[key] = inp.value.trim(); });
        return entry;
      }};
    }

    if (panel.panelType === 'table') {
      const cols   = panel.columns || [];
      const cells  = Array.isArray(existing) ? existing : [];
      const inputs = cols.map((col, i) => {
        const inp = fInput('tbl-' + i, typeof col === 'string' ? col : col.label || '', cells[i] || '');
        el.appendChild(fGroup((typeof col === 'string' ? col : col.label || `Col ${i+1}`) + (i === 0 ? ' *' : ''), inp));
        return inp;
      });
      if (!cols.length) {
        el.appendChild(fGroup('', (() => {
          const d2 = document.createElement('div'); d2.className = 'f-hint';
          d2.textContent = 'No columns defined — edit panel structure first.'; return d2;
        })()));
      }
      return { el, read: () => {
        if (inputs.length && !inputs[0].value.trim()) {
          alert(`${typeof cols[0] === 'string' ? cols[0] : cols[0]?.label || 'First column'} is required.`); return null;
        }
        return inputs.map(i => i.value.trim());
      }};
    }

    if (panel.panelType === 'cards') {
      const fields = panel.cardFields || [];
      const inputs = fields.map((field, i) => {
        const inp = fInput('cf-' + field.key, field.label, d[field.key] || '');
        el.appendChild(fGroup(field.label + (i === 0 ? ' *' : ''), inp));
        return { key: field.key, inp };
      });
      if (!fields.length) {
        el.appendChild(fGroup('', (() => {
          const d2 = document.createElement('div'); d2.className = 'f-hint';
          d2.textContent = 'No card fields defined — edit panel structure first.'; return d2;
        })()));
      }
      return { el, read: () => {
        if (inputs.length && !inputs[0].inp.value.trim()) {
          alert(`${fields[0]?.label || 'First field'} is required.`); return null;
        }
        const card = {};
        inputs.forEach(({ key, inp }) => { if (inp.value.trim()) card[key] = inp.value.trim(); });
        return card;
      }};
    }

    if (panel.panelType === 'cardgrid') {
      const fieldRegions = (panel.regions || []).filter(r => r.type !== 'constant' && (r.type === 'image' || r.source !== 'constant'));
      const seenKeys = new Set();
      const fieldDefs = [];
      fieldRegions.forEach(r => {
        if (r.field && !seenKeys.has(r.field)) { seenKeys.add(r.field); fieldDefs.push({ key: r.field, isImage: r.type === 'image' }); }
      });
      if (!fieldDefs.length) {
        el.appendChild(fGroup('', (() => {
          const d2 = document.createElement('div'); d2.className = 'f-hint';
          d2.textContent = 'No field regions defined — edit the grid layout first.'; return d2;
        })()));
        return { el, read: () => ({}), onAnyChange: () => {} };
      }

      // imageCache holds base64 data URLs for image fields as they are loaded
      const imageCache = {};
      Object.keys(d).forEach(k => { if (d[k]?.startsWith?.('data:')) imageCache[k] = d[k]; });

      const changeListeners = [];
      const notifyChange = () => changeListeners.forEach(fn => fn());

      const inputs = fieldDefs.map((fd, i) => {
        if (fd.isImage) {
          const wrap = document.createElement('div'); wrap.className = 'f-group';
          const lbl  = document.createElement('label'); lbl.className = 'f-label'; lbl.textContent = `${fd.key} (image)`;
          const fileInp = document.createElement('input'); fileInp.type = 'file'; fileInp.accept = 'image/webp';
          fileInp.className = 'f-input'; fileInp.style.padding = '5px';
          const hint2 = document.createElement('div'); hint2.className = 'f-hint'; hint2.textContent = 'WebP only. Leave blank to keep existing image.';
          // Pre-fill thumb if existing
          if (d[fd.key]) { imageCache[fd.key] = d[fd.key]; }
          fileInp.addEventListener('change', () => {
            const file = fileInp.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { imageCache[fd.key] = ev.target.result; notifyChange(); };
            reader.readAsDataURL(file);
          });
          wrap.append(lbl, fileInp, hint2);
          el.appendChild(wrap);
          return { key: fd.key, isImage: true, el: fileInp };
        } else {
          const inp = fInput(`cg-f-${fd.key}`, fd.key, d[fd.key] || '');
          inp.addEventListener('input', notifyChange);
          el.appendChild(fGroup(fd.key + (i === 0 ? ' *' : ''), inp));
          return { key: fd.key, isImage: false, el: inp };
        }
      });

      // read(snapOnly=false) — when snapOnly=true, returns current state without validation for preview
      function read(snapOnly = false) {
        if (!snapOnly && !inputs[0]?.isImage && !inputs[0]?.el.value.trim()) {
          alert(`${fieldDefs[0].key} is required.`); return null;
        }
        const card = { id: d.id || uid('cg') };
        inputs.forEach(f => {
          if (f.isImage) {
            if (imageCache[f.key]) card[f.key] = imageCache[f.key];
          } else {
            if (f.el.value.trim()) card[f.key] = f.el.value.trim();
          }
        });
        return card;
      }

      return { el, read, onAnyChange: fn => changeListeners.push(fn) };
    }

    return { el, read: () => ({}) };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  function findPanel(tabId, panelId) {
    return state.tabs.find(t => t.id === tabId)?.panels.find(p => p.id === panelId) || null;
  }

  // ── EXPORT ────────────────────────────────────────────────────────────
  window.BForms = {
    openMetaSheet,
    openAddTabSheet, openEditTabSheet,
    openAddPanelSheet, openEditPanelSheet,
    openCardGridEditor,
    openAddRowSheet, openEditRowSheet, openManageRowsSheet,
    getPanelRows,
  };

})();
