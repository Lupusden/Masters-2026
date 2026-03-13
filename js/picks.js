// ============================================================
// picks.js  —  Player selection with tile-based save buttons
// ============================================================
(function () {
  const MAX_PICKS = 4;
  let selected    = [];    // player names
  let tiebreaker  = null;  // player name
  let step        = 1;     // 1=picking, 2=tiebreaker
  let prizes      = {};    // current projected prizes (for display)
  let players     = [];    // live player array with scores

  // DOM
  const grid       = document.getElementById('playersGrid');
  const countEl    = document.getElementById('countDisplay');
  const submitBtn  = document.getElementById('submitBtn');
  const step1Pill  = document.getElementById('step1Pill');
  const step2Pill  = document.getElementById('step2Pill');
  const tbPrompt   = document.getElementById('tbPrompt');
  const nameInput  = document.getElementById('participantName');
  const searchInput= document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const toast      = document.getElementById('toast');

  // ── Init ────────────────────────────────────────────────
  function init() {
    players = getPlayers();
    prizes  = calculateCurrentPrizes(players);
    buildGrid(players);
    nameInput.addEventListener('input', refreshSubmitState);
    searchInput.addEventListener('input', filterGrid);
    sortSelect.addEventListener('change', filterGrid);

    // Auto-sync live scores on page load
    if (window.syncLiveScores) {
      syncLiveScores(() => {}).then(() => {
        players = getPlayers();
        prizes  = calculateCurrentPrizes(players);
        filterGrid();
      }).catch(() => {});
    }
  }

  // ── Build grid ──────────────────────────────────────────
  function buildGrid(list) {
    grid.innerHTML = '';
    const sorted = sortPlayers(list, sortSelect.value);
    sorted.forEach(player => {
      const card = buildCard(player);
      grid.appendChild(card);
    });
  }

  function sortPlayers(list, method) {
    const ps = [...list];
    const prizeMap = prizes;
    const rankMap  = getTournamentRanks(ps);
    switch (method) {
      case 'world':  return ps.sort((a, b) => a.world - b.world);
      case 'name':   return ps.sort((a, b) => a.name.localeCompare(b.name));
      case 'prize':  return ps.sort((a, b) => (prizeMap[b.name] || 0) - (prizeMap[a.name] || 0));
      default:       return ps.sort((a, b) => (rankMap[a.name] || 999) - (rankMap[b.name] || 999));
    }
  }

  function getTournamentRanks(ps) {
    const sorted = [...ps]
      .filter(p => totalScore(p) !== null)
      .sort((a, b) => totalScore(a) - totalScore(b));
    const map = {};
    sorted.forEach((p, i) => { map[p.name] = i + 1; });
    // players with no score go to end
    ps.filter(p => totalScore(p) === null).forEach((p, i) => { map[p.name] = sorted.length + i + 1; });
    return map;
  }

  function buildCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.name = player.name;

    const stp  = scoreToPar(player);
    const rnd  = roundsPlayed(player);
    const scClass = stp === null ? 'even' : stp < 0 ? 'under' : stp > 0 ? 'over' : 'even';
    const scText  = stp === null ? '—' : formatScoreToPar(stp);
    const prize   = prizes[player.name];
    const r1Disp  = player.r1 !== null ? player.r1 : '—';
    const r2Disp  = player.r2 !== null ? player.r2 : '—';
    const r3Disp  = player.r3 !== null ? player.r3 : '—';
    const r4Disp  = player.r4 !== null ? player.r4 : '—';

    card.innerHTML = `
      <div class="card-world">#${player.world}</div>
      <button class="card-select-btn" title="Add/remove player" aria-label="Select ${player.name}">+</button>
      <div style="margin-top:12px">
        <div class="card-pos">${rnd > 0 ? 'Thru R' + rnd : 'Not Yet Played'}</div>
        <div class="card-name">${escHtml(player.name)}</div>
        <div class="card-country">${player.country}</div>
        <div class="card-score ${scClass}">${scText}</div>
        <div class="card-rounds">${r1Disp} · ${r2Disp} · ${r3Disp} · ${r4Disp}</div>
        <div class="card-prize">${prize ? formatPrize(prize) : '—'}</div>
        <button class="card-tb-btn">☆ Set as Tiebreaker</button>
      </div>
    `;

    const btn = card.querySelector('.card-select-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBtnClick(player.name);
    });

    const tbBtn = card.querySelector('.card-tb-btn');
    tbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selected.includes(player.name)) toggleTiebreaker(player.name);
    });

    card.addEventListener('click', () => handleCardClick(player.name));

    return card;
  }

  // ── Handle select/tiebreaker click ──────────────────────
  // Button click: step 1 = add/remove; step 2 = remove player
  function handleBtnClick(name) {
    if (step === 1) {
      toggleSelection(name);
    } else {
      // In tiebreaker step, button always deselects the player
      if (selected.includes(name)) {
        toggleSelection(name);
      }
    }
  }

  // Card body click: step 1 = add/remove; step 2 = no-op (use dedicated TB button)
  function handleCardClick(name) {
    if (step === 1) {
      toggleSelection(name);
    }
  }

  function toggleSelection(name) {
    const idx = selected.indexOf(name);
    if (idx !== -1) {
      selected.splice(idx, 1);
      if (tiebreaker === name) tiebreaker = null;
    } else {
      if (selected.length >= MAX_PICKS) {
        showToast('You can only pick 4 players. Remove one first.');
        return;
      }
      selected.push(name);
    }
    updateStep();
    renderCards();
    refreshSubmitState();
  }

  function toggleTiebreaker(name) {
    if (!selected.includes(name)) return;
    tiebreaker = (tiebreaker === name) ? null : name;
    renderCards();
    refreshSubmitState();
  }

  // ── Step management ─────────────────────────────────────
  function updateStep() {
    if (selected.length === MAX_PICKS) {
      step = 2;
      step1Pill.classList.replace('active', 'done');
      step2Pill.classList.add('active');
      tbPrompt.classList.add('show');
    } else {
      step = 1;
      step1Pill.classList.remove('done');
      step1Pill.classList.add('active');
      step2Pill.classList.remove('active');
      tbPrompt.classList.remove('show');
      tiebreaker = null;
    }
  }

  // ── Render card states ───────────────────────────────────
  function renderCards() {
    countEl.textContent = selected.length;
    grid.querySelectorAll('.player-card').forEach(card => {
      const name = card.dataset.name;
      const isSel = selected.includes(name);
      const isTb  = name === tiebreaker;
      const btn   = card.querySelector('.card-select-btn');
      const tbBtn = card.querySelector('.card-tb-btn');

      card.classList.remove('selected', 'is-tiebreaker', 'dimmed', 'tb-step');

      if (step === 1) {
        if (isSel) {
          card.classList.add('selected');
          btn.textContent = '✕';
          btn.title = 'Remove player';
        } else {
          btn.textContent = '+';
          btn.title = 'Add player';
          if (selected.length >= MAX_PICKS) card.classList.add('dimmed');
        }
        if (tbBtn) tbBtn.style.display = 'none';
      } else {
        // Tiebreaker step: ✕ removes player, dedicated TB button sets tiebreaker
        if (isTb) {
          card.classList.add('is-tiebreaker');
          btn.textContent = '✕';
          btn.title = 'Remove player from picks';
          if (tbBtn) { tbBtn.style.display = 'block'; tbBtn.textContent = '★ Tiebreaker (tap to change)'; tbBtn.classList.add('active'); }
        } else if (isSel) {
          card.classList.add('selected', 'tb-step');
          btn.textContent = '✕';
          btn.title = 'Remove player from picks';
          if (tbBtn) { tbBtn.style.display = 'block'; tbBtn.textContent = '☆ Set as Tiebreaker'; tbBtn.classList.remove('active'); }
        } else {
          card.classList.add('tb-step');
          btn.textContent = '+';
          if (tbBtn) tbBtn.style.display = 'none';
        }
      }
    });
  }

  // ── Submit state ─────────────────────────────────────────
  function refreshSubmitState() {
    const ready = selected.length === MAX_PICKS &&
                  tiebreaker !== null &&
                  nameInput.value.trim().length > 0;
    submitBtn.disabled = !ready;
  }

  // ── Submit picks ─────────────────────────────────────────
  submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { showToast('Please enter your name first.', 'error'); nameInput.focus(); return; }
    if (selected.length !== MAX_PICKS) { showToast('Please select exactly 4 players.', 'error'); return; }
    if (!tiebreaker) { showToast('Please set a tiebreaker player.', 'error'); return; }

    saveEntry(name, [...selected], tiebreaker);
    showToast('Picks saved! Redirecting to leaderboard…', 'success');
    setTimeout(() => { window.location.href = 'leaderboard.html'; }, 1400);
  });

  // ── Filter/search ─────────────────────────────────────────
  function filterGrid() {
    const q = searchInput.value.trim().toLowerCase();
    const sorted = sortPlayers(players, sortSelect.value);
    const filtered = q ? sorted.filter(p => p.name.toLowerCase().includes(q)) : sorted;

    grid.innerHTML = '';
    filtered.forEach(p => grid.appendChild(buildCard(p)));
    renderCards();
  }

  // ── Utilities ────────────────────────────────────────────
  function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  let toastTimer;
  function showToast(msg, type = '') {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
  }

  // ── Start ────────────────────────────────────────────────
  (window.dbReady || Promise.resolve()).then(function () { init(); });
}());
