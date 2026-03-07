/* ═══════════════════════════════════════════════════════════════════════
   guide_render.js  —  Retro Guide Panel Renderer  v2.0
   Shared by guide_engine.html and builder.html.

   Usage:
     <script src="guide_render.js"></script>
     // Engine:
     const ctx = { save: (id,v)=>..., load: (id)=>..., preview: false };
     // Builder:
     const ctx = { save: ()=>{}, load: ()=>false, preview: true };

     const el = GuideRender.panel(panelDef, ctx);
     container.appendChild(el);

   Exports: window.GuideRender = { panel, injectStyles, md, uid }
   ═══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // ── CSS ─────────────────────────────────────────────────────────────────
  const STYLES = `
/* ── Panel Wrapper ── */
.gr-panel-wrap { margin-bottom: 14px; }

/* ── Section Card ── */
.gr-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-card, 8px);
  overflow: hidden;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.08));
}
.gr-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface2);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.gr-card-header:hover { background: var(--surface); }
.gr-card-title {
  font-family: var(--font-display, Georgia, serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--emphasis);
  flex: 1;
  min-width: 0;
}
.gr-card-toggle {
  color: var(--textMuted);
  font-size: 12px;
  transition: transform 0.2s;
  flex-shrink: 0;
  line-height: 1;
}
.gr-card.gr-collapsed .gr-card-toggle { transform: rotate(-90deg); }
.gr-card-body { padding: 12px 14px; }
.gr-card.gr-collapsed .gr-card-body { display: none; }

/* ── Infobox ── */
.gr-infobox {
  background: var(--surface);
  border: 1px solid var(--borderL);
  border-left: 3px solid var(--emphasis);
  border-radius: 0 var(--radius-input, 5px) var(--radius-input, 5px) 0;
  padding: 9px 13px;
  font-size: 12.5px;
  color: var(--textMid);
  line-height: 1.65;
  margin-bottom: 10px;
}
.gr-infobox strong { color: var(--text); }

/* ── Text Panel ── */
.gr-text { font-size: 13px; color: var(--text); line-height: 1.8; }
.gr-p { margin: 0 0 8px; }
.gr-p:last-child { margin-bottom: 0; }
.gr-h3 {
  font-family: var(--font-display, Georgia, serif);
  font-size: 13px;
  font-weight: 700;
  color: var(--emphasis);
  margin: 12px 0 4px;
}
.gr-ul { padding-left: 18px; margin: 4px 0 8px; color: var(--text); }
.gr-ul li { margin-bottom: 3px; font-size: 13px; }
.gr-code {
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  background: var(--surface2);
  border: 1px solid var(--borderL);
  border-radius: 3px;
  padding: 1px 5px;
  color: var(--emphasis);
}
.gr-internal-link { color: var(--emphasis); text-decoration : underline; cursor : pointer; }

.gr-link { color: var(--emphasis); }

/* ── Shared Table Wrap ── */
.gr-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--borderL);
  border-radius: var(--radius-input, 5px);
}
.gr-table-wrap table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.gr-table-wrap th {
  padding: 6px 10px;
  font-family: var(--font-display, Georgia, serif);
  font-size: 11px;
  font-weight: 700;
  color: var(--emphasis);
  background: var(--surface2);
  border-bottom: 2px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.gr-table-wrap td {
  padding: 5px 10px;
  color: var(--text);
  border-bottom: 1px solid var(--borderL);
  vertical-align: top;
  line-height: 1.5;
}
.gr-table-wrap tbody tr:last-child td { border-bottom: none; }
.gr-table-wrap tbody tr:nth-child(even) td { background: var(--surface); }

/* ── Key-Value ── */
.gr-kv-table { width: 100%; border-collapse: collapse; }
.gr-kv-table tr { border-bottom: 1px solid var(--borderL); }
.gr-kv-table tr:last-child { border-bottom: none; }
.gr-kv-key {
  padding: 6px 12px 6px 10px;
  font-weight: 600;
  color: var(--textMid);
  white-space: nowrap;
  width: 38%;
  font-size: 12px;
  vertical-align: top;
}
.gr-kv-val { padding: 6px 10px; color: var(--text); font-size: 12.5px; }

/* ── Progress Bar ── */
.gr-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--borderL);
  border-radius: var(--radius-btn, 6px);
  margin-bottom: 10px;
}
.gr-progress-bar { flex: 1; height: 7px; background: var(--borderL); border-radius: 10px; overflow: hidden; }
.gr-progress-fill { height: 100%; background: var(--positive); border-radius: 10px; transition: width 0.3s ease; }
.gr-progress-label { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--textMid); white-space: nowrap; }
.gr-progress-count { color: var(--positive); font-weight: 700; }

/* ── Checklist ── */
.gr-check-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.gr-cb-col { width: 36px; text-align: center; }
.gr-check-row { cursor: pointer; transition: opacity 0.1s; }
.gr-check-row:nth-child(even) > td { background: var(--bg); }
.gr-check-row:nth-child(odd)  > td { background: var(--surface); }
.gr-check-row:hover > td { filter: brightness(1.05); }
.gr-check-row > td { padding: 5px 10px; border-bottom: 1px solid var(--borderL); vertical-align: middle; color: var(--text); }
.gr-check-row:last-child > td { border-bottom: none; }
.gr-check-row.gr-checked > td { background: var(--positiveDim) !important; border-bottom-color: var(--positiveBdr) !important; opacity: 0.52; }
.gr-check-row.gr-checked .gr-check-name { text-decoration: line-through; }
.gr-check-row.gr-checked .gr-check-cell { text-decoration: line-through; }
.gr-checkbox {
  display: inline-flex; align-items: center; justify-content: center;
  width: 15px; height: 15px;
  border: 2px solid var(--border);
  border-radius: 3px;
  background: transparent;
  vertical-align: middle;
  transition: all 0.12s;
  font-size: 9px; font-weight: 900; color: #fff;
}
.gr-checkbox.gr-checked { background: var(--positive); border-color: var(--positive); }
.gr-check-note { font-size: 10.5px; color: var(--textMuted); margin-top: 1px; }
.gr-accent { color: var(--emphasis); font-weight: 700; }
.gr-dim    { font-size: 11px; color: var(--textMid); }

/* ── Cards ── */
.gr-cards { display: flex; flex-direction: column; gap: 8px; }
.gr-card-item {
  background: var(--surface);
  border: 1px solid var(--borderL);
  border-radius: var(--radius-card, 8px);
  padding: 11px 14px;
}
.gr-card-name { font-family: var(--font-display, Georgia, serif); font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 5px; }
.gr-card-row { font-size: 12px; color: var(--textMid); line-height: 1.65; }
.gr-card-label { font-weight: 600; }
.gr-card-value { color: var(--text); }

/* ── Responsive ── */
@media (max-width: 600px) {
  .gr-card-body { padding: 10px; }
  .gr-dim { display: none; }
}
  `;

  function injectStyles() {
    if (document.getElementById('gr-styles')) return;
    const s = document.createElement('style');
    s.id = 'gr-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ── UTILITIES ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Minimal markdown → HTML. Input is plain text (not pre-escaped). */
  function md(s) {
    if (!s) return '';
    let h = esc(s);
    // Headers
    h = h.replace(/^### (.+)$/gm, '<h3 class="gr-h3">$1</h3>');
    h = h.replace(/^## (.+)$/gm,  '<h3 class="gr-h3">$1</h3>');
    // Bold / italic
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g,     '<em>$1</em>');
    // Inline code
    h = h.replace(/`(.+?)`/g, '<code class="gr-code">$1</code>');
    // Internal links to tab
    h = h.replace(/\[(.+?)\]\(\s*(\d+)\s*\)/g, '<span class="gr-internal-link" tab=$2 panel="none">$1</span>');
    // Internal links to panel
    h = h.replace(/\[(.+?)\]\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, '<span class="gr-internal-link" tab="$2" panel="$3">$1</span>');
    // Links
    h = h.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="gr-link" target="_blank" rel="noopener">$1</a>');
    // Unordered lists (collect consecutive li items)
    h = h.replace(/((?:^- .+$\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul class="gr-ul">${items}</ul>`;
    });
    // Paragraphs — split on blank lines, skip block elements
    const blocks = h.split(/\n\n+/);
    return blocks.map(b => {
      b = b.trim();
      if (!b) return '';
      if (/^<(h3|ul|ol)/.test(b)) return b;
      return `<p class="gr-p">${b.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  /** Collision-resistant ID for new items. */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ── PANEL ENTRY POINT ─────────────────────────────────────────────────
  function panel(def, ctx) {
    injectStyles();
    ctx = Object.assign({ save: () => {}, load: () => false, preview: true }, ctx);

    const wrap = document.createElement('div');
    wrap.className = 'gr-panel-wrap';
    if (def.id) wrap.dataset.panelId = def.id;

    const card = document.createElement('div');
    card.className = 'gr-card';

    const header = document.createElement('div');
    header.className = 'gr-card-header';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'gr-card-title';
    titleSpan.textContent = def.title || '(Untitled Panel)';
    const toggle = document.createElement('span');
    toggle.className = 'gr-card-toggle';
    toggle.textContent = '▾';
    header.append(titleSpan, toggle);

    // Collapse state: default collapsed. Persist per panel id if available.
    const colKey = def.id ? '__c_' + def.id : null;
    const isExpanded = colKey ? ctx.load(colKey) : false;
    if (!isExpanded) card.classList.add('gr-collapsed');

    header.addEventListener('click', () => {
      const nowCollapsed = card.classList.toggle('gr-collapsed');
      if (colKey) ctx.save(colKey, !nowCollapsed);
    });

    const body = document.createElement('div');
    body.className = 'gr-card-body';
    try {
      body.appendChild(renderContent(def, ctx));
    } catch (e) {
      body.innerHTML = `<div style="color:#c04040;padding:8px;font-size:12px">⚠️ Render error: ${esc(e.message)}</div>`;
    }

    card.append(header, body);
    wrap.appendChild(card);
    return wrap;
  }

  function renderContent(def, ctx) {
    switch (def.panelType) {
      case 'text':      return renderText(def);
      case 'keyvalue':  return renderKeyValue(def);
      case 'checklist': return renderChecklist(def, ctx);
      case 'table':     return renderTable(def);
      case 'cards':     return renderCards(def);
      default: {
        const d = document.createElement('div');
        d.style.cssText = 'padding:8px;font-size:12px;color:var(--textMuted)';
        d.textContent = 'Unknown panel type: ' + (def.panelType || '(none)');
        return d;
      }
    }
  }

  // ── TEXT ──────────────────────────────────────────────────────────────
  function renderText(def) {
    const wrap = document.createElement('div');
    if (def.infobox) {
      const ib = document.createElement('div');
      ib.className = 'gr-infobox';
      ib.innerHTML = md(def.infobox);
      wrap.appendChild(ib);
    }
    const content = document.createElement('div');
    content.className = 'gr-text';
    content.innerHTML = md(def.content || '');
    wrap.appendChild(content);
    return wrap;
  }

  // ── KEY-VALUE ─────────────────────────────────────────────────────────
  function renderKeyValue(def) {
    const rows = def.rows || [];
    const tw = document.createElement('div');
    tw.className = 'gr-table-wrap';
    const table = document.createElement('table');
    table.className = 'gr-kv-table';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      const k = document.createElement('td');
      k.className = 'gr-kv-key';
      k.textContent = row.key || '';
      const v = document.createElement('td');
      v.className = 'gr-kv-val';
      v.innerHTML = md(String(row.value ?? ''));
      tr.append(k, v);
      table.appendChild(tr);
    });
    tw.appendChild(table);
    return tw;
  }

  // ── CHECKLIST ─────────────────────────────────────────────────────────
  function renderChecklist(def, ctx) {
    const entryKey = Object.keys(def).find(k => k.startsWith('entry_'));
    const items    = (entryKey ? def[entryKey] : def.items) || [];
    const columns = def.columns || [];
    const wrap = document.createElement('div');

    if (def.infobox) {
      const ib = document.createElement('div');
      ib.className = 'gr-infobox';
      ib.innerHTML = md(def.infobox);
      wrap.appendChild(ib);
    }

    // Progress bar (live mode only)
    let progressWrap = null;
    if (!ctx.preview && items.length) {
      const total = items.length;
      const done  = items.filter(it => ctx.load(it.id)).length;
      const pct   = Math.round(done / total * 100);
      progressWrap = document.createElement('div');
      progressWrap.className = 'gr-progress-wrap';
      progressWrap.innerHTML = `
        <div class="gr-progress-bar"><div class="gr-progress-fill" style="width:${pct}%"></div></div>
        <div class="gr-progress-label"><span class="gr-progress-count">${done}</span>&thinsp;/&thinsp;${total}</div>`;
      wrap.appendChild(progressWrap);
    }

    const tw = document.createElement('div');
    tw.className = 'gr-table-wrap';
    const table = document.createElement('table');
    table.className = 'gr-check-table';

    // Header row
    const thead = document.createElement('thead');
    const htr   = document.createElement('tr');
    const cbTh  = document.createElement('th'); cbTh.style.width = '36px';
    const nmTh  = document.createElement('th'); nmTh.textContent = def.nameLabel || 'Item';
    htr.append(cbTh, nmTh);
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label || '';
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    // Rows
    const tbody = document.createElement('tbody');
    items.forEach(item => {
      const checked = ctx.load(item.id);
      const tr = document.createElement('tr');
      tr.className = 'gr-check-row' + (checked ? ' gr-checked' : '');
      tr.dataset.itemId = item.id;

      const cbTd = document.createElement('td');
      cbTd.className = 'gr-cb-col';
      const cb = document.createElement('span');
      cb.className = 'gr-checkbox' + (checked ? ' gr-checked' : '');
      if (checked) cb.textContent = '✓';
      cbTd.appendChild(cb);
      tr.appendChild(cbTd);

      const nmTd = document.createElement('td');
      nmTd.className = 'gr-check-name';
      nmTd.textContent = item.name || '';
      if (item.note) {
        const note = document.createElement('div');
        note.className = 'gr-check-note';
        note.textContent = item.note;
        nmTd.appendChild(note);
      }
      tr.appendChild(nmTd);

      columns.forEach(col => {
        const td = document.createElement('td');
        td.className = 'gr-check-cell ' + (col.style === 'accent' ? 'gr-accent' : col.style === 'dim' ? 'gr-dim' : '');
        td.textContent = item[col.key] ?? '';
        tr.appendChild(td);
      });

      tr.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = tr.classList.toggle('gr-checked');
        cb.classList.toggle('gr-checked', now);
        cb.textContent = now ? '✓' : '';
        ctx.save(item.id, now);
        if (progressWrap) {
          const total = items.length;
          const done  = items.filter(it => ctx.load(it.id)).length;
          const fill  = progressWrap.querySelector('.gr-progress-fill');
          const count = progressWrap.querySelector('.gr-progress-count');
          if (fill)  fill.style.width = Math.round(done / total * 100) + '%';
          if (count) count.textContent = done;
        }
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tw.appendChild(table);
    wrap.appendChild(tw);
    return wrap;
  }

  // ── TABLE ─────────────────────────────────────────────────────────────
  function renderTable(def) {
    const columns = def.columns || [];
    const rows    = def.rows    || [];
    const tw = document.createElement('div');
    tw.className = 'gr-table-wrap';
    const table = document.createElement('table');

    if (columns.length) {
      const thead = document.createElement('thead');
      const htr   = document.createElement('tr');
      columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = typeof col === 'string' ? col : (col.label || col.key || '');
        htr.appendChild(th);
      });
      thead.appendChild(htr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr    = document.createElement('tr');
      const cells = Array.isArray(row)
        ? row
        : columns.map(c => row[typeof c === 'string' ? c : (c.key || c.label || '')] ?? '');
      cells.forEach(cell => {
        const td = document.createElement('td');
        td.innerHTML = md(String(cell ?? ''));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tw.appendChild(table);
    return tw;
  }

  // ── CARDS ─────────────────────────────────────────────────────────────
  function renderCards(def) {
    const cardFields = def.cardFields || [];
    const cards      = def.cards || [];
    const wrap = document.createElement('div');
    wrap.className = 'gr-cards';

    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'gr-card-item';
      cardFields.forEach((field, idx) => {
        const val = card[field.key];
        if (!val && val !== 0) return;
        if (idx === 0) {
          const name = document.createElement('div');
          name.className = 'gr-card-name';
          name.textContent = String(val);
          el.appendChild(name);
        } else {
          const row = document.createElement('div');
          row.className = 'gr-card-row';
          const lbl = document.createElement('span');
          lbl.className = 'gr-card-label';
          lbl.textContent = (field.label || field.key) + ': ';
          const valSpan = document.createElement('span');
          valSpan.className = 'gr-card-value';
          valSpan.innerHTML = md(String(val));
          row.append(lbl, valSpan);
          el.appendChild(row);
        }
      });
      wrap.appendChild(el);
    });

    return wrap;
  }

  // ── EXPORTS ───────────────────────────────────────────────────────────
  global.GuideRender = { panel, injectStyles, md, uid };

})(window);
