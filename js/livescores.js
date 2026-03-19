// ============================================================
// livescores.js — Fetch live scores from ESPN's PGA Tour API
// Endpoint: site.web.api.espn.com (public, no key required)
// Falls back to allorigins.win CORS proxy when on file://
// ============================================================

const ESPN_URL = 'https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga';
const PROXY_URL = url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

const LAST_SYNC_KEY          = 'golfpool_lastsync';
const DYNAMIC_PLAYERS_KEY    = 'golfpool_dynamicplayers';
const TOURNAMENT_META_KEY    = 'golfpool_tournamentmeta';
const CURRENT_TOURNAMENT_KEY = 'golfpool_currenttournament';

// ── Country name → flag emoji map ───────────────────────────
const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'USA': '🇺🇸',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Northern Ireland': '🇬🇧', 'NIR': '🇬🇧',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'United Kingdom': '🇬🇧', 'GBR': '🇬🇧',
  'Ireland': '🇮🇪', 'IRL': '🇮🇪',
  'Australia': '🇦🇺', 'AUS': '🇦🇺',
  'Canada': '🇨🇦', 'CAN': '🇨🇦',
  'Japan': '🇯🇵', 'JPN': '🇯🇵',
  'South Korea': '🇰🇷', 'KOR': '🇰🇷',
  'South Africa': '🇿🇦', 'RSA': '🇿🇦',
  'Spain': '🇪🇸', 'ESP': '🇪🇸',
  'Sweden': '🇸🇪', 'SWE': '🇸🇪',
  'Norway': '🇳🇴', 'NOR': '🇳🇴',
  'Denmark': '🇩🇰', 'DEN': '🇩🇰',
  'Germany': '🇩🇪', 'GER': '🇩🇪',
  'France': '🇫🇷', 'FRA': '🇫🇷',
  'Belgium': '🇧🇪', 'BEL': '🇧🇪',
  'Netherlands': '🇳🇱', 'NED': '🇳🇱',
  'Italy': '🇮🇹', 'ITA': '🇮🇹',
  'New Zealand': '🇳🇿', 'NZL': '🇳🇿',
  'Argentina': '🇦🇷', 'ARG': '🇦🇷',
  'Colombia': '🇨🇴', 'COL': '🇨🇴',
  'Venezuela': '🇻🇪', 'VEN': '🇻🇪',
  'Austria': '🇦🇹', 'AUT': '🇦🇹',
  'Finland': '🇫🇮', 'FIN': '🇫🇮',
  'China': '🇨🇳', 'CHN': '🇨🇳',
  'Taiwan': '🇹🇼', 'TPE': '🇹🇼',
  'Thailand': '🇹🇭', 'THA': '🇹🇭',
  'Mexico': '🇲🇽', 'MEX': '🇲🇽',
  'Chile': '🇨🇱', 'CHI': '🇨🇱',
  'Paraguay': '🇵🇾', 'PAR': '🇵🇾',
  'Czech Republic': '🇨🇿', 'CZE': '🇨🇿',
  'Zimbabwe': '🇿🇼', 'ZIM': '🇿🇼',
  'Fiji': '🇫🇯', 'FIJ': '🇫🇯',
};
function countryToFlag(name) { return COUNTRY_FLAGS[name] || null; }

// ── Normalise a player name for fuzzy matching ──────────────
function normName(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9 ]/g, ' ')      // non-alphanumeric → space
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a lookup map: normalised name → canonical name in data.js
let _nameMap = null;
function getNameMap() {
  if (_nameMap) return _nameMap;
  _nameMap = {};
  DEFAULT_PLAYERS.forEach(p => { _nameMap[normName(p.name)] = p.name; });
  return _nameMap;
}

function matchName(espnName) {
  const map = getNameMap();
  const norm = normName(espnName);
  if (map[norm]) return map[norm];
  // Partial match: try matching if all words of espnName appear
  const words = norm.split(' ');
  for (const [key, canonical] of Object.entries(map)) {
    if (words.every(w => key.includes(w))) return canonical;
  }
  return null;
}

// ── Fetch from ESPN, fall back to proxy ──────────────────────
async function fetchESPN() {
  // Try direct (works if served via http://)
  try {
    const resp = await fetch(ESPN_URL, { mode: 'cors' });
    if (!resp.ok) throw new Error('ESPN direct failed: ' + resp.status);
    return await resp.json();
  } catch (e) {
    // Fall back to allorigins proxy (works from file://)
    const resp = await fetch(PROXY_URL(ESPN_URL));
    if (!resp.ok) throw new Error('Proxy also failed: ' + resp.status);
    const wrapper = await resp.json();
    return JSON.parse(wrapper.contents);
  }
}

// ── Parse competitors from ESPN response ─────────────────────
function parseCompetitors(data) {
  const event = data.events && data.events[0];
  if (!event) throw new Error('No event found in ESPN data');

  const comp = event.competitions && event.competitions[0];
  if (!comp) throw new Error('No competition found');

  const venue = comp.venue?.fullName || null;

  // Tournament logo — prefer non-dark variant
  const logos = event.logos || [];
  const logoUrl = logos.find(l => !l.rel?.includes('dark'))?.href || logos[0]?.href || null;

  return {
    tournament: event.name || 'PGA Tour',
    status:     event.status?.type?.description || 'In Progress',
    competitors: comp.competitors || [],
    venue,
    logoUrl,
    purse:        event.purse        || null,
    displayPurse: event.displayPurse || null,
  };
}

// ── Determine round scores from ESPN linescores ───────────────
// ESPN linescores: value = stroke count for completed rounds (≥60 for 18 holes)
// For in-progress rounds, value = partial stroke count (<60, fewer holes played)
// displayValue = score to par for that round (e.g. "+4", "-3", "E")
function extractRounds(competitor) {
  const rounds = { r1: null, r2: null, r3: null, r4: null,
                   r1live: false, r2live: false, r3live: false, r4live: false,
                   r1topar: null, r2topar: null, r3topar: null, r4topar: null };
  const ls = competitor.linescores || [];
  ls.forEach((period, idx) => {
    if (idx > 3) return;
    const val = Number(period.value);
    const key = 'r' + (idx + 1);
    const dv = period.displayValue;
    // Parse to-par from displayValue ("-5", "+4", "E", "-")
    let topar = null;
    if (dv === 'E') topar = 0;
    else if (dv && dv !== '-') { const n = parseInt(dv, 10); if (!isNaN(n)) topar = n; }

    if (val >= 60 && val <= 90) {
      // Completed 18-hole round
      rounds[key] = val;
      rounds[key + 'topar'] = topar;
    } else if (val > 0 && val < 60 && topar !== null) {
      // In-progress: partial stroke count, flag as live
      rounds[key + 'live'] = true;
      rounds[key + 'topar'] = topar;
    }
  });
  return rounds;
}

// ── Main sync function ────────────────────────────────────────
window.syncLiveScores = async function (onProgress) {
  onProgress && onProgress('Connecting to ESPN PGA Tour API…');

  let data;
  try {
    data = await fetchESPN();
  } catch (e) {
    throw new Error('Could not reach ESPN API: ' + e.message);
  }

  onProgress && onProgress('Parsing leaderboard data…');

  let parsed;
  try {
    parsed = parseCompetitors(data);
  } catch (e) {
    throw new Error('ESPN data format unexpected: ' + e.message);
  }

  const { tournament, status, competitors, venue, logoUrl, purse, displayPurse } = parsed;

  // Detect tournament change — if ESPN returns a new event, reset all pool data
  let tournamentChanged = false;
  try {
    const stored = localStorage.getItem(CURRENT_TOURNAMENT_KEY);
    if (stored && stored !== tournament) {
      // New tournament detected: wipe picks, scores, and old player roster
      localStorage.removeItem('golfpool_entries');
      localStorage.removeItem('golfpool_scores');
      localStorage.removeItem('golfpool_dynamicplayers');
      tournamentChanged = true;
    }
    localStorage.setItem(CURRENT_TOURNAMENT_KEY, tournament);
  } catch(e) {}

  onProgress && onProgress(`Syncing ${competitors.length} players from "${tournament}" (${status})…`);

  // Build a lookup map from DEFAULT_PLAYERS for country/world ranking
  const defaultMap = {};
  DEFAULT_PLAYERS.forEach(p => { defaultMap[normName(p.name)] = p; });

  const overrides = loadScores();
  const dynamicPlayers = [];

  competitors.forEach(comp => {
    const espnName = comp.athlete?.displayName || '';
    if (!espnName) return;

    // Try to match to existing roster (for country/world ranking)
    const canonical = matchName(espnName) || espnName;
    const existing  = defaultMap[normName(canonical)] || defaultMap[normName(espnName)] || null;

    const rounds = extractRounds(comp);

    // Live total to par from ESPN statistics — includes in-progress round holes
    const statsEntry = comp.statistics?.find(s => s.name === 'scoreToPar');
    const liveTopar = (statsEntry !== undefined && statsEntry.value !== undefined)
      ? statsEntry.value : null;

    // Holes completed in current round (ESPN competitor.status.thru)
    const liveThru = (comp.status && comp.status.thru != null) ? comp.status.thru : null;

    // Withdrawal / disqualification detection — check all ESPN status fields
    const _st = comp.status || {};
    const _stt = _st.type || {};
    const _statusStrings = [
      _stt.name, _stt.description, _stt.shortDetail,
      _st.displayValue, _st.shortDetail,
      comp.score?.displayValue,
      comp.displayOrder != null && comp.displayOrder > 900 ? 'WD' : null,
    ].filter(Boolean).join(' ');
    const wd = /\b(WD|DQ|MDF|Withdrawn|Disqualified|status-wd)\b/i.test(_statusStrings);

    // Apply any manual overrides on top of ESPN data
    const ov = overrides[canonical] || {};
    const r1 = ov.r1 !== undefined ? ov.r1 : rounds.r1;
    const r2 = ov.r2 !== undefined ? ov.r2 : rounds.r2;
    const r3 = ov.r3 !== undefined ? ov.r3 : rounds.r3;
    const r4 = ov.r4 !== undefined ? ov.r4 : rounds.r4;

    const r1live = rounds.r1live, r2live = rounds.r2live;
    const r3live = rounds.r3live, r4live = rounds.r4live;
    const r1topar = rounds.r1topar, r2topar = rounds.r2topar;
    const r3topar = rounds.r3topar, r4topar = rounds.r4topar;

    const espnCountry = comp.athlete?.flag?.alt ? countryToFlag(comp.athlete.flag.alt) : null;
    const country = (existing && existing.country) ? existing.country : (espnCountry || '🌍');
    dynamicPlayers.push({
      name:    canonical,
      country,
      world:   existing ? existing.world   : 999,
      r1, r2, r3, r4,
      r1live, r2live, r3live, r4live,       // true = round currently in progress
      r1topar, r2topar, r3topar, r4topar,   // to-par per round (completed or live)
      liveTopar,  // ESPN total running to-par (includes in-progress holes)
      liveThru,   // holes completed in current round (null if not in-progress)
      wd,         // true if player withdrew / DQ
    });

    // Persist ESPN scores into overrides — reset player entry first so stale
    // scores from a previous sync don't bleed through for in-progress rounds
    overrides[canonical] = {};
    ['r1','r2','r3','r4'].forEach(r => {
      if (rounds[r] !== null) overrides[canonical][r] = rounds[r];
    });
  });

  // Persist the full dynamic player list (used by getPlayers())
  localStorage.setItem(DYNAMIC_PLAYERS_KEY, JSON.stringify(dynamicPlayers));
  saveScores(overrides);

  // Store tournament metadata
  localStorage.setItem(TOURNAMENT_META_KEY, JSON.stringify({
    name:   tournament,
    status,
    venue,
    logoUrl,
    purse,
    displayPurse,
    lastSync: Date.now(),
  }));

  // Store last sync time (legacy key kept for compatibility)
  localStorage.setItem(LAST_SYNC_KEY, JSON.stringify({
    time: Date.now(),
    tournament,
    status,
    playerCount: competitors.length,
    unmatched: [],
  }));

  return {
    tournament,
    status,
    matched: dynamicPlayers.length,
    unmatched: [],
    tournamentChanged,
  };
};

// ── Get last sync info ────────────────────────────────────────
window.getLastSync = function () {
  try { return JSON.parse(localStorage.getItem(LAST_SYNC_KEY) || 'null'); } catch(e) { return null; }
};

// ── Format time since sync ────────────────────────────────────
window.timeSince = function (ts) {
  if (!ts) return 'Never synced';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
};
