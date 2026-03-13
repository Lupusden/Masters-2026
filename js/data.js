// ============================================================
// data.js  —  2026 AT&T Pebble Beach Pro-Am
// $20M purse · 80 players · No cut · Feb 12-15, 2026
// ============================================================

const TOURNAMENT = {
  name:     'AT&T Pebble Beach Pro-Am',
  season:   '2026',
  dates:    'February 12–15, 2026',
  venue:    'Pebble Beach Golf Links & Spyglass Hill',
  location: 'Pebble Beach, California',
  purse:    20000000,
  par:      72,
  rounds:   4,
  nocut:    true,
};

// Prize money by finishing position (1–80)
const PRIZE_TABLE = {
  1:3600000, 2:2160000, 3:1360000, 4:960000, 5:795000,
  6:715000,  7:665000,  8:615000,  9:575000, 10:535000,
  11:495000, 12:455000, 13:415000, 14:375000, 15:352000,
  16:332000, 17:312000, 18:292000, 19:272000, 20:252000,
  21:232000, 22:217000, 23:202000, 24:187000, 25:172000,
  26:158000, 27:150000, 28:143000, 29:137000, 30:131000,
  31:125000, 32:119000, 33:114000, 34:109000, 35:104000,
  36:99000,  37:94000,  38:89000,  39:84000,  40:80000,
  41:76000,  42:72000,  43:68000,  44:64000,  45:60000,
  46:57000,  47:54000,  48:52000,  49:50000,  50:48000,
  51:47000,  52:46000,  53:45000,  54:44000,  55:43000,
  56:42000,  57:41000,  58:40000,  59:39500,  60:39000,
  61:38500,  62:38000,  63:37500,  64:37000,  65:36500,
  66:36000,  67:35500,  68:35000,  69:34750,  70:34500,
  71:34250,  72:34000,  73:33750,  74:33500,  75:33250,
  76:33000,  77:32750,  78:32500,  79:32250,  80:32000,
};

// ── Player roster ────────────────────────────────────────────
// Scores stored in localStorage under key 'pebblebeach2026_scores'
// R1 pre-loaded from Round 1 results (Feb 12 2026); R2-R4 entered via admin
// null = round not yet played

const DEFAULT_PLAYERS = [
  // R1 known scores (par 72 per course)
  { name: 'Ryo Hisatsune',       country: '🇯🇵', world: 28,  r1:  62, r2: null, r3: null, r4: null },
  { name: 'Sam Burns',           country: '🇺🇸', world: 15,  r1:  63, r2: null, r3: null, r4: null },
  { name: 'Keegan Bradley',      country: '🇺🇸', world: 23,  r1:  63, r2: null, r3: null, r4: null },
  { name: 'Chris Gotterup',      country: '🇺🇸', world: 5,   r1:  64, r2: null, r3: null, r4: null },
  { name: 'Tony Finau',          country: '🇺🇸', world: 22,  r1:  64, r2: null, r3: null, r4: null },
  { name: 'Patrick Rodgers',     country: '🇺🇸', world: 45,  r1:  64, r2: null, r3: null, r4: null },
  { name: 'Andrew Novak',        country: '🇺🇸', world: 56,  r1:  65, r2: null, r3: null, r4: null },
  { name: 'Akshay Bhatia',       country: '🇺🇸', world: 18,  r1:  65, r2: null, r3: null, r4: null },
  { name: 'Nick Taylor',         country: '🇨🇦', world: 27,  r1:  65, r2: null, r3: null, r4: null },
  { name: 'Tom Hoge',            country: '🇺🇸', world: 48,  r1:  65, r2: null, r3: null, r4: null },
  { name: 'Jordan Spieth',       country: '🇺🇸', world: 12,  r1:  66, r2: null, r3: null, r4: null },
  { name: 'Justin Rose',         country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', world: 3,   r1:  66, r2: null, r3: null, r4: null },
  { name: 'Collin Morikawa',     country: '🇺🇸', world: 8,   r1:  66, r2: null, r3: null, r4: null },
  { name: 'Viktor Hovland',      country: '🇳🇴', world: 10,  r1:  66, r2: null, r3: null, r4: null },
  { name: 'Xander Schauffele',   country: '🇺🇸', world: 6,   r1:  66, r2: null, r3: null, r4: null },
  { name: 'Shane Lowry',         country: '🇮🇪', world: 16,  r1:  67, r2: null, r3: null, r4: null },
  { name: 'Tommy Fleetwood',     country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', world: 14,  r1:  67, r2: null, r3: null, r4: null },
  { name: 'Robert MacIntyre',    country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', world: 20,  r1:  67, r2: null, r3: null, r4: null },
  { name: 'Patrick Cantlay',     country: '🇺🇸', world: 17,  r1:  67, r2: null, r3: null, r4: null },
  { name: 'Cameron Young',       country: '🇺🇸', world: 25,  r1:  67, r2: null, r3: null, r4: null },
  { name: 'Rory McIlroy',        country: '🇬🇧', world: 2,   r1:  68, r2: null, r3: null, r4: null },
  { name: 'Rickie Fowler',       country: '🇺🇸', world: 32,  r1:  68, r2: null, r3: null, r4: null },
  { name: 'Tom Kim',             country: '🇰🇷', world: 26,  r1:  68, r2: null, r3: null, r4: null },
  { name: 'Hideki Matsuyama',    country: '🇯🇵', world: 11,  r1:  68, r2: null, r3: null, r4: null },
  { name: 'Russell Henley',      country: '🇺🇸', world: 29,  r1:  68, r2: null, r3: null, r4: null },
  { name: 'Lucas Glover',        country: '🇺🇸', world: 35,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Ludvig Åberg',        country: '🇸🇪', world: 7,   r1:  69, r2: null, r3: null, r4: null },
  { name: 'Min Woo Lee',         country: '🇦🇺', world: 21,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Daniel Berger',       country: '🇺🇸', world: 41,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Brian Harman',        country: '🇺🇸', world: 34,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Matt Fitzpatrick',    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', world: 30,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Sahith Theegala',     country: '🇺🇸', world: 24,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Jason Day',           country: '🇦🇺', world: 37,  r1:  69, r2: null, r3: null, r4: null },
  { name: 'Max Greyserman',      country: '🇺🇸', world: 44,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Jake Knapp',          country: '🇺🇸', world: 50,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Corey Conners',       country: '🇨🇦', world: 43,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Sepp Straka',         country: '🇦🇹', world: 38,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Si Woo Kim',          country: '🇰🇷', world: 36,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Chris Kirk',          country: '🇺🇸', world: 59,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Kurt Kitayama',       country: '🇺🇸', world: 46,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Billy Horschel',      country: '🇺🇸', world: 49,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Matt McCarty',        country: '🇺🇸', world: 55,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Jhonattan Vegas',     country: '🇻🇪', world: 65,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Emiliano Grillo',     country: '🇦🇷', world: 52,  r1:  70, r2: null, r3: null, r4: null },
  { name: 'Harris English',      country: '🇺🇸', world: 60,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Ryan Fox',            country: '🇳🇿', world: 53,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Stephan Jaeger',      country: '🇩🇪', world: 67,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Michael Kim',         country: '🇺🇸', world: 71,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Mackenzie Hughes',    country: '🇨🇦', world: 63,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Keith Mitchell',      country: '🇺🇸', world: 66,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Alex Noren',          country: '🇸🇪', world: 72,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'J.T. Poston',         country: '🇺🇸', world: 58,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Denny McCarthy',      country: '🇺🇸', world: 61,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Max McGreevy',        country: '🇺🇸', world: 75,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Taylor Pendrith',     country: '🇨🇦', world: 57,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Marco Penge',         country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', world: 78,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'J.J. Spaun',          country: '🇺🇸', world: 69,  r1:  71, r2: null, r3: null, r4: null },
  { name: 'Scottie Scheffler',   country: '🇺🇸', world: 1,   r1:  72, r2: null, r3: null, r4: null },
  { name: 'Wyndham Clark',       country: '🇺🇸', world: 40,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Garrick Higgo',       country: '🇿🇦', world: 70,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Maverick McNealy',    country: '🇺🇸', world: 54,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Ryan Gerard',         country: '🇺🇸', world: 80,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Steven Fisk',         country: '🇺🇸', world: 77,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Matti Schmid',        country: '🇩🇪', world: 74,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Michael Thorbjornsen',country: '🇺🇸', world: 76,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Sami Valimaki',       country: '🇫🇮', world: 79,  r1:  73, r2: null, r3: null, r4: null },
  { name: 'Nico Echavarria',     country: '🇨🇴', world: 68,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Kevin Yu',            country: '🇺🇸', world: 73,  r1:  72, r2: null, r3: null, r4: null },
  { name: 'Ben Griffin',         country: '🇺🇸', world: 64,  r1:  73, r2: null, r3: null, r4: null },
  { name: 'Harry Hall',          country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', world: 62,  r1:  73, r2: null, r3: null, r4: null },
  { name: 'Rico Hoey',           country: '🇺🇸', world: 72,  r1:  73, r2: null, r3: null, r4: null },
  { name: 'Adam Schenk',         country: '🇺🇸', world: 51,  r1:  73, r2: null, r3: null, r4: null },
  { name: 'Brian Campbell',      country: '🇺🇸', world: 83,  r1:  74, r2: null, r3: null, r4: null },
  { name: 'Pierceson Coody',     country: '🇺🇸', world: 81,  r1:  74, r2: null, r3: null, r4: null },
  { name: 'Sam Stevens',         country: '🇺🇸', world: 82,  r1:  74, r2: null, r3: null, r4: null },
  { name: 'Jacob Bridgeman',     country: '🇺🇸', world: 85,  r1:  75, r2: null, r3: null, r4: null },
  { name: 'Aldrich Potgieter',   country: '🇿🇦', world: 84,  r1:  75, r2: null, r3: null, r4: null },
  { name: 'Bud Cauley',          country: '🇺🇸', world: 86,  r1:  76, r2: null, r3: null, r4: null },
  { name: 'Joe Highsmith',       country: '🇺🇸', world: 87,  r1:  76, r2: null, r3: null, r4: null },
];

// ── Score storage helpers ────────────────────────────────────
const SCORES_KEY  = 'pebblebeach2026_scores';
const ENTRIES_KEY = 'pebblebeach2026_entries';

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '{}'); } catch(e) { return {}; }
}

function saveScores(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

// Returns the active player list:
// • If ESPN has been synced, uses the dynamic live roster (current tournament)
// • Otherwise falls back to the hardcoded DEFAULT_PLAYERS roster
// Manual overrides from localStorage are always applied on top.
function getPlayers() {
  const overrides = loadScores();

  // Check for a live ESPN-synced roster
  try {
    const dynamic = JSON.parse(localStorage.getItem('pebblebeach2026_dynamicplayers') || 'null');
    if (dynamic && dynamic.length > 0) {
      return dynamic.map(p => {
        const ov = overrides[p.name] || {};
        return {
          ...p,
          r1: ov.r1 !== undefined ? ov.r1 : p.r1,
          r2: ov.r2 !== undefined ? ov.r2 : p.r2,
          r3: ov.r3 !== undefined ? ov.r3 : p.r3,
          r4: ov.r4 !== undefined ? ov.r4 : p.r4,
        };
      });
    }
  } catch (e) { /* fall through */ }

  // Fall back to hardcoded Pebble Beach roster
  return DEFAULT_PLAYERS.map(p => {
    const ov = overrides[p.name] || {};
    return {
      ...p,
      r1: ov.r1 !== undefined ? ov.r1 : p.r1,
      r2: ov.r2 !== undefined ? ov.r2 : p.r2,
      r3: ov.r3 !== undefined ? ov.r3 : p.r3,
      r4: ov.r4 !== undefined ? ov.r4 : p.r4,
    };
  });
}

function updatePlayerScore(name, round, score) {
  const overrides = loadScores();
  if (!overrides[name]) overrides[name] = {};
  overrides[name][round] = score === null ? null : Number(score);
  saveScores(overrides);
}

// ── Tournament score helpers ─────────────────────────────────
const PAR = 72;

function totalScore(player) {
  const rounds = [player.r1, player.r2, player.r3, player.r4].filter(r => r !== null);
  if (rounds.length === 0) return null;
  return rounds.reduce((a, b) => a + b, 0);
}

function roundsPlayed(player) {
  return [player.r1, player.r2, player.r3, player.r4].filter(r => r !== null).length;
}

function scoreToPar(player) {
  // Use ESPN's live running total when available (includes in-progress holes)
  if (player.liveTopar !== undefined && player.liveTopar !== null) {
    return player.liveTopar;
  }
  const ts = totalScore(player);
  if (ts === null) return null;
  return ts - (PAR * roundsPlayed(player));
}

function formatScoreToPar(val) {
  if (val === null || val === undefined) return '—';
  if (val === 0) return 'E';
  return val > 0 ? '+' + val : String(val);
}

function formatPrize(amount) {
  if (!amount && amount !== 0) return '—';
  return '$' + amount.toLocaleString('en-US');
}

// ── Prize calculation (current standings, tie-splitting) ─────
function calculateCurrentPrizes(players) {
  // Scale prize amounts to match the live tournament purse
  let purseScale = 1;
  try {
    const meta = JSON.parse(localStorage.getItem('pebblebeach2026_tournamentmeta') || 'null');
    if (meta && meta.purse && TOURNAMENT.purse) purseScale = meta.purse / TOURNAMENT.purse;
  } catch(e) {}

  const scored = players
    .map(p => ({ name: p.name, stp: scoreToPar(p), rounds: roundsPlayed(p) }))
    .filter(p => p.stp !== null)
    .sort((a, b) => a.stp - b.stp);

  const prizes = {};
  let i = 0;
  while (i < scored.length) {
    let j = i;
    while (j < scored.length - 1 && scored[j + 1].stp === scored[i].stp) j++;
    const count = j - i + 1;
    let sum = 0;
    for (let k = i; k <= j; k++) sum += (PRIZE_TABLE[k + 1] || 0);
    const avg = Math.round((sum / count) * purseScale);
    for (let k = i; k <= j; k++) prizes[scored[k].name] = avg;
    i = j + 1;
  }
  return prizes;
}

// ── Pool entries helpers ─────────────────────────────────────
function loadEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]'); } catch(e) { return []; }
}

function saveEntry(name, picks, tiebreaker) {
  const entries = loadEntries();
  const idx = entries.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
  const entry = { name, picks, tiebreaker, ts: Date.now() };
  if (idx !== -1) entries[idx] = entry; else entries.push(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

function deleteEntry(name) {
  const entries = loadEntries().filter(e => e.name !== name);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}
