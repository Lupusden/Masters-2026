// ============================================================
// leaderboard.js  —  Live pool standings with prize calculation
// ============================================================
(function () {
  // ── Helpers ──────────────────────────────────────────────
  function esc(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { t.className = 'toast'; }, 2200);
  }

  // ── Rounds complete helper ────────────────────────────────
  // Returns { completed: n, inProgress: bool }
  function detectRoundsComplete(players) {
    let maxCompleted = 0;
    let minLiveRound = null;
    players.forEach(p => {
      const rp = roundsPlayed(p);
      if (rp > maxCompleted) maxCompleted = rp;
      // Use explicit live flags set by ESPN sync (r1live, r2live, r3live, r4live)
      const liveR = p.r1live ? 1 : p.r2live ? 2 : p.r3live ? 3 : p.r4live ? 4 : null;
      if (liveR !== null) {
        if (minLiveRound === null || liveR < minLiveRound) minLiveRound = liveR;
      }
    });
    return { completed: maxCompleted, inProgress: minLiveRound !== null, currentRound: minLiveRound };
  }

  // ── Country name from flag emoji ─────────────────────────
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

  // ── Build a scored entry object ───────────────────────────
  function buildScoredEntry(raw, prizeMap, players) {
    const playerMap = {};
    players.forEach(p => { playerMap[p.name] = p; });

    const picks = raw.picks;
    const prizeTotal = picks.reduce((sum, name) => sum + (prizeMap[name] || 0), 0);

    // Sunday (R4) best score among 4 picks — used for tiebreaker
    const r4Scores = picks
      .map(n => playerMap[n])
      .filter(p => p && p.r4 !== null)
      .map(p => p.r4);
    const bestR4 = r4Scores.length > 0 ? Math.min(...r4Scores) : null;

    // Tiebreaker player Sunday score
    const tbPlayer = playerMap[raw.tiebreaker];
    const tbR4 = (tbPlayer && tbPlayer.r4 !== null) ? tbPlayer.r4 : null;

    // Picks key for "same 4 players" detection
    const picksKey = [...picks].sort().join('|');

    return { name: raw.name, picks, tiebreaker: raw.tiebreaker, prizeTotal, bestR4, tbR4, picksKey };
  }

  // ── Sort entries ──────────────────────────────────────────
  function sortEntries(entries) {
    return [...entries].sort((a, b) => {
      // 1. Higher prize total wins
      if (b.prizeTotal !== a.prizeTotal) return b.prizeTotal - a.prizeTotal;

      // 2. Different players, same prize → lower R4 score wins (null = worse)
      if (a.picksKey !== b.picksKey) {
        if (a.bestR4 === null && b.bestR4 === null) return a.name.localeCompare(b.name);
        if (a.bestR4 === null) return 1;
        if (b.bestR4 === null) return -1;
        if (a.bestR4 !== b.bestR4) return a.bestR4 - b.bestR4;
        return a.name.localeCompare(b.name);
      }

      // 3. Same 4 players → tiebreaker player's R4 score
      if (a.tbR4 === null && b.tbR4 === null) return a.name.localeCompare(b.name);
      if (a.tbR4 === null) return 1;
      if (b.tbR4 === null) return -1;
      if (a.tbR4 !== b.tbR4) return a.tbR4 - b.tbR4;
      return a.name.localeCompare(b.name);
    });
  }

  // ── Detect if tiebreaker was used ─────────────────────────
  function tbWasUsed(entry, prev) {
    if (!prev) return false;
    if (prev.prizeTotal !== entry.prizeTotal) return false;
    // same prize — tiebreaker applies
    return true;
  }

  // ── Main render ───────────────────────────────────────────
  function render() {
    const players = getPlayers();
    const prizeMap = calculateCurrentPrizes(players);
    const rawEntries = loadEntries();
    const tbody = document.getElementById('lbBody');
    const { completed: roundsComplete, inProgress, currentRound } = detectRoundsComplete(players);

    // Update stats
    const el = id => document.getElementById(id);
    el('statEntries').textContent = rawEntries.length;

    if (rawEntries.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8">
          <div class="empty-state">
            <p>No picks submitted yet. Be the first!</p>
            <a href="picks.html" class="btn btn-gold">Make Your Picks</a>
          </div>
        </td></tr>`;
      el('statLeader').textContent = '—';
      el('statPrize').textContent  = '—';
      return;
    }

    const scored  = rawEntries.map(r => buildScoredEntry(r, prizeMap, players));
    const sorted  = sortEntries(scored);

    // Show/hide R4 Score column based on whether any entry has R4 data
    const hasR4 = sorted.some(e => e.bestR4 !== null);
    const thR4 = document.getElementById('thR4');
    if (thR4) thR4.style.display = hasR4 ? '' : 'none';

    // Update leader stats
    el('statLeader').textContent = sorted[0].name;
    el('statPrize').textContent  = formatPrize(sorted[0].prizeTotal);

    // Build player lookup and tournament position map
    const playerMap = {};
    players.forEach(p => { playerMap[p.name] = p; });

    const playersWithScore = [...players]
      .filter(p => !p.wd && scoreToPar(p) !== null)
      .sort((a, b) => scoreToPar(a) - scoreToPar(b));
    const posMap = {};
    let posIdx = 0;
    while (posIdx < playersWithScore.length) {
      const sp = scoreToPar(playersWithScore[posIdx]);
      let j = posIdx;
      while (j < playersWithScore.length - 1 && scoreToPar(playersWithScore[j + 1]) === sp) j++;
      const label = j > posIdx ? 'T' + (posIdx + 1) : String(posIdx + 1);
      for (let k = posIdx; k <= j; k++) posMap[playersWithScore[k].name] = label;
      posIdx = j + 1;
    }

    tbody.innerHTML = '';
    sorted.forEach((entry, i) => {
      const rank = i + 1;
      const prev = i > 0 ? sorted[i - 1] : null;
      const usedTb = tbWasUsed(entry, prev);

      const rankSymbol = rank;
      const rowClass   = rank <= 3 ? `rank-${rank}` : '';
      const tbBadge    = usedTb ? `<span class="tb-badge">TB</span>` : '';

      // Player chips (4 columns) — sorted by prize descending
      const sortedPicks = [...entry.picks].sort((a, b) => (prizeMap[b] || 0) - (prizeMap[a] || 0));
      const chipCols = sortedPicks.map(name => {
        const isTb = name === entry.tiebreaker;
        const p = playerMap[name];
        const stp = p ? scoreToPar(p) : null;
        const isWD = p && p.wd;
        const stpStr = isWD ? 'WD' : (stp === null ? '—' : formatScoreToPar(stp));
        const stpCls = isWD ? 'over' : (stp === null ? 'even' : stp < 0 ? 'under' : stp > 0 ? 'over' : 'even');
        const pos = isWD ? 'WD' : (posMap[name] || '—');
        const prize = prizeMap[name] ? formatPrize(prizeMap[name]) : '—';
        const cp = p ? countryParts(p.country) : { flag: '', name: '' };
        return `<td>
          <span class="player-chip${isTb ? ' tb-chip' : ''}">${isTb ? '★ ' : ''}${esc(name)}</span>
          <div class="chip-stats">
            <span class="chip-score ${stpCls}">${stpStr}</span>
            <span class="chip-pos">${pos}</span>
            <span class="chip-prize">${prize}</span>
            ${cp.flag ? `<span class="chip-country">${cp.flag}</span>` : ''}
            ${cp.name ? `<span class="chip-country">${cp.name}</span>` : ''}
          </div>
        </td>`;
      }).join('');

      // R4 tiebreaker score display
      const r4Display = entry.bestR4 !== null ? entry.bestR4 : '<span style="color:var(--text-muted)">—</span>';

      const row = document.createElement('tr');
      row.className = rowClass;
      row.innerHTML = `
        <td class="rank-cell">${rankSymbol}${tbBadge}</td>
        <td class="participant-cell">${esc(entry.name)}</td>
        ${chipCols}
        <td class="prize-cell center">${formatPrize(entry.prizeTotal)}</td>
        <td class="best-round-cell center" style="${hasR4 ? '' : 'display:none'}">${r4Display}</td>
        <td class="center">
          <button class="delete-btn" onclick="confirmDelete('${esc(entry.name).replace(/'/g,"\\'")}')">✕ Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // ── Delete entry ──────────────────────────────────────────
  window.confirmDelete = function (name) {
    const pw = window.prompt('Enter admin password to delete this pick:');
    if (pw === null) return;
    if (pw !== '1812') { alert('Incorrect password.'); return; }
    if (!confirm(`Remove ${name}'s picks? This cannot be undone.`)) return;
    deleteEntry(name);
    render();
    showToast(`${name}'s entry removed.`);
  };

  // ── Refresh ───────────────────────────────────────────────
  window.refresh = function () {
    render();
    showToast('Leaderboard refreshed!', 'success');
  };

  // ── Live sync from ESPN ───────────────────────────────────
  window.doSync = async function () {
    const btn    = document.getElementById('syncBtn');
    const status = document.getElementById('syncStatus');
    if (!btn || !status) return;

    btn.disabled = true;
    btn.textContent = '⏳ Syncing…';

    try {
      const result = await syncLiveScores(msg => { status.textContent = msg; });
      render();
      const unmatchedNote = result.unmatched.length
        ? ` · ${result.unmatched.length} unmatched names` : '';
      status.textContent = `✅ Synced ${result.matched} round scores — ${result.tournament} (${result.status})${unmatchedNote}`;
      showToast('Live scores updated!', 'success');
    } catch (e) {
      status.textContent = '❌ Sync failed: ' + e.message;
      showToast('Sync failed — check console for details.', 'error');
      console.error('[LiveScores]', e);
    } finally {
      btn.disabled = false;
      btn.textContent = '⬇ Sync Live Scores';
      updateLastSyncLabel();
    }
  };

  function updateLastSyncLabel() {
    const el = document.getElementById('lastSyncLabel');
    if (!el) return;
    const info = getLastSync();
    el.textContent = info ? 'Last sync: ' + timeSince(info.time) : '';
  }

  // Auto-refresh label every 30s
  setInterval(updateLastSyncLabel, 30000);

  // ── Init ──────────────────────────────────────────────────
  (window.dbReady || Promise.resolve()).then(function () {
    render();
    updateLastSyncLabel();
    window.doSync();
  });
}());
