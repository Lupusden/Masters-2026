// ============================================================
// admin.js  —  Score entry panel
// ============================================================
(function () {
  let currentRound = 1;
  let pendingEdits = {}; // { playerName: { r1, r2, r3, r4 } }

  const toast = document.getElementById('toast');

  function showToast(msg, type) {
    clearTimeout(showToast._t);
    toast.textContent = msg;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    showToast._t = setTimeout(() => { toast.className = 'toast'; }, 2500);
  }

  // ── Render ────────────────────────────────────────────────
  function render() {
    const players = getPlayers();
    const sorted  = [...players].sort((a, b) => {
      const sa = scoreToPar(a), sb = scoreToPar(b);
      if (sa === null && sb === null) return a.name.localeCompare(b.name);
      if (sa === null) return 1;
      if (sb === null) return -1;
      return sa - sb;
    });

    // Compute positions using scoreToPar (handles live rounds)
    const posMap = {};
    let i = 0;
    while (i < sorted.length) {
      const sp = scoreToPar(sorted[i]);
      if (sp === null) { sorted.slice(i).forEach(p => { posMap[p.name] = '—'; }); break; }
      let j = i;
      while (j < sorted.length - 1 && scoreToPar(sorted[j+1]) === sp) j++;
      const label = (j > i) ? 'T' + (i+1) : String(i+1);
      for (let k = i; k <= j; k++) posMap[sorted[k].name] = label;
      i = j + 1;
    }

    const tbody = document.getElementById('adminBody');
    tbody.innerHTML = '';

    sorted.forEach(player => {
      const edit = pendingEdits[player.name] || {};
      const r1v = edit.r1 !== undefined ? edit.r1 : player.r1;
      const r2v = edit.r2 !== undefined ? edit.r2 : player.r2;
      const r3v = edit.r3 !== undefined ? edit.r3 : player.r3;
      const r4v = edit.r4 !== undefined ? edit.r4 : player.r4;

      // total to par for display — use liveTopar when available
      const toParVal = scoreToPar(player);
      const toParStr = toParVal === null ? '—' :
                       toParVal < 0 ? `<span class="par-under">${toParVal}</span>` :
                       toParVal > 0 ? `<span class="par-over">+${toParVal}</span>` :
                       '<span class="par-even">E</span>';

      const toparBadge = (topar) => {
        if (topar === null || topar === undefined) return '';
        const cls = topar < 0 ? 'under' : topar > 0 ? 'over' : 'even';
        const str = topar === 0 ? 'E' : topar > 0 ? '+' + topar : String(topar);
        return `<span class="round-topar ${cls}">${str}</span>`;
      };

      const inp = (round, val) => {
        const isLive = player['r' + round + 'live'] === true;
        const topar  = player['r' + round + 'topar'];
        if (isLive && val === null) {
          // In-progress round: show live to-par pill (no input — partial round)
          const parCls = topar === null ? '' : topar < 0 ? 'under' : topar > 0 ? 'over' : 'even';
          const parStr = topar === null ? '—' : topar === 0 ? 'E' : topar > 0 ? '+' + topar : String(topar);
          const thruStr = (player.liveThru != null && player.liveThru > 0) ? `Thru ${player.liveThru}` : 'Live';
          return `<div class="live-round-cell"><span class="thru-badge">⛳ ${thruStr}</span><span class="live-par ${parCls}">${parStr}</span></div>`;
        }
        const scoreText = (val !== null && val !== '') ? val : '—';
        return `<div class="round-cell-wrap"><span style="font-size:.92rem;font-weight:700;color:var(--navy)">${scoreText}</span>${toparBadge(topar)}</div>`;
      };

      const row = document.createElement('tr');
      row.id = 'row-' + esc(player.name).replace(/[^a-zA-Z0-9]/g, '_');
      row.innerHTML = `
        <td class="rank-col ctr">${posMap[player.name] || '—'}</td>
        <td class="player-col">${esc(player.name)}</td>
        <td class="ctr" style="font-size:1.1rem">${countryParts(player.country).flag}</td>
        <td style="font-size:.8rem;color:var(--text-muted)">${countryParts(player.country).name}</td>
        <td class="world-col ctr">#${player.world}</td>
        <td class="ctr">${inp(1, r1v)}</td>
        <td class="ctr">${inp(2, r2v)}</td>
        <td class="ctr">${inp(3, r3v)}</td>
        <td class="ctr">${inp(4, r4v)}</td>
        <td class="par-col ctr">${toParStr}</td>
      `;
      tbody.appendChild(row);
    });

    updateTabs();
    updateStatus(players);
  }

  // ── Mark a pending edit ───────────────────────────────────
  window.markEdit = function(name, round, value) {
    if (!pendingEdits[name]) pendingEdits[name] = {};
    pendingEdits[name][round] = value === '' ? null : Number(value);
    // update par display inline
    const row = document.getElementById('row-' + name.replace(/[^a-zA-Z0-9]/g, '_'));
    if (!row) return;
    // recalculate total in this row
    const players = getPlayers();
    const player = players.find(p => p.name === name);
    if (!player) return;
    const edit = pendingEdits[name] || {};
    const vals = ['r1','r2','r3','r4'].map(r => {
      const v = edit[r] !== undefined ? edit[r] : player[r];
      return (v !== null && v !== '') ? Number(v) : null;
    });
    const played = vals.filter(v => v !== null);
    const ts = played.reduce((a,b) => a+b, 0);
    const rp = played.length;
    const toPar = rp > 0 ? ts - 72 * rp : null;
    const parCell = row.querySelector('.par-col');
    if (parCell) {
      parCell.innerHTML = toPar === null ? '—' :
        toPar < 0 ? `<span class="par-under">${toPar}</span>` :
        toPar > 0 ? `<span class="par-over">+${toPar}</span>` :
        '<span class="par-even">E</span>';
    }
  };

  // ── Save a single row ─────────────────────────────────────
  window.saveRow = function(name) {
    const edits = pendingEdits[name];
    if (!edits) { showToast('No changes to save for this player.'); return; }
    Object.entries(edits).forEach(([round, val]) => {
      updatePlayerScore(name, round, val);
    });
    delete pendingEdits[name];
    render();
    showToast(`${name} saved!`, 'success');
  };

  // ── Save all pending edits ────────────────────────────────
  window.saveAll = function() {
    const count = Object.keys(pendingEdits).length;
    if (count === 0) { showToast('No unsaved changes.'); return; }
    Object.entries(pendingEdits).forEach(([name, edits]) => {
      Object.entries(edits).forEach(([round, val]) => {
        updatePlayerScore(name, round, val);
      });
    });
    pendingEdits = {};
    render();
    showToast(`Saved ${count} player update${count > 1 ? 's' : ''}!`, 'success');
  };

  // ── Round tabs ────────────────────────────────────────────
  window.switchRound = function(r) {
    currentRound = r;
    updateTabs();
  };

  function updateTabs() {
    const players = getPlayers();
    [1,2,3,4].forEach(r => {
      const tab = document.getElementById('tabR' + r);
      if (!tab) return;
      const hasData = players.some(p => p['r' + r] !== null);
      tab.classList.toggle('active', r === currentRound);
      tab.classList.toggle('has-data', hasData);
    });
  }

  function updateStatus(players) {
    const total = players.length;
    const roundsInfo = [1,2,3,4].map(r => {
      const count = players.filter(p => p['r' + r] !== null).length;
      return `<div class="status-item"><strong>R${r}:</strong> ${count}/${total}</div>`;
    }).join('');
    const sb = document.getElementById('statusBar');
    if (sb) sb.innerHTML = roundsInfo;
  }

  // ── Country display helper ────────────────────────────────
  const COUNTRY_NAMES = {
    US:'USA', AU:'Australia', CA:'Canada', GB:'England', IE:'Ireland',
    JP:'Japan', KR:'S. Korea', ZA:'S. Africa', SE:'Sweden', DE:'Germany',
    NZ:'N. Zealand', CO:'Colombia', AR:'Argentina', VE:'Venezuela',
    CL:'Chile', AT:'Austria', FI:'Finland', MX:'Mexico', BR:'Brazil',
    ES:'Spain', IT:'Italy', DK:'Denmark', NO:'Norway', FR:'France',
    BE:'Belgium', CH:'Switzerland', TH:'Thailand', IN:'India',
    PH:'Philippines', CN:'China', CZ:'Czech Rep.', RO:'Romania',
    PL:'Poland', PT:'Portugal', NL:'Netherlands',
  };
  const SUBDIV_NAMES = { '🏴󠁧󠁢󠁥󠁮󠁧󠁿':'England', '🏴󠁧󠁢󠁳󠁣󠁴󠁿':'Scotland', '🏴󠁧󠁢󠁷󠁬󠁳󠁿':'Wales' };
  function countryParts(flag) {
    if (!flag) return { flag: '', name: '' };
    if (SUBDIV_NAMES[flag]) return { flag, name: SUBDIV_NAMES[flag] };
    const pts = [...flag].map(c => c.codePointAt(0));
    if (pts.length === 2 && pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF) {
      const code = pts.map(c => String.fromCharCode(c - 0x1F1E6 + 65)).join('');
      return { flag, name: COUNTRY_NAMES[code] || code };
    }
    return { flag, name: '' };
  }

  // ── Escape helper ─────────────────────────────────────────
  function esc(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  // ── ESPN live sync ────────────────────────────────────────
  window.adminSync = async function () {
    const btn = document.getElementById('adminSyncBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing…'; }
    try {
      const result = await syncLiveScores(msg => showToast(msg));
      pendingEdits = {};
      render();
      showToast('✅ Synced ' + result.matched + ' scores — ' + result.tournament + ' (' + result.status + ')', 'success');
    } catch (e) {
      showToast('❌ ESPN sync failed: ' + e.message, 'error');
      console.error('[LiveScores admin]', e);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⬇ Sync Live Scores (ESPN)'; }
    }
  };

  // ── Init ─────────────────────────────────────────────────
  (window.dbReady || Promise.resolve()).then(function () {
    render();
    if (window.syncLiveScores) window.adminSync();
  });
}());
