// ============================================================
// db.js — Supabase integration
// Syncs entries and scores between Supabase and localStorage.
// Must load after data.js (needs ENTRIES_KEY, SCORES_KEY globals).
// ============================================================
(function () {
  const SUPABASE_URL     = 'https://brlmebonzrnvjfyzbmbu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybG1lYm9uenJudmpmeXpibWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTUwOTQsImV4cCI6MjA4ODk5MTA5NH0.SaXlIhko_PDjGOSCprP5N_5DwIe3aGm18OqMmnX13V0';

  let sb = null;
  try {
    if (window.supabase) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn('[db] Supabase init failed:', e);
  }

  // ── Pull Supabase → localStorage ──────────────────────────
  async function syncFromSupabase() {
    if (!sb) return;
    try {
      const [{ data: entries, error: ee }, { data: scores, error: se }] = await Promise.all([
        sb.from('entries').select('*').order('ts', { ascending: true }),
        sb.from('scores').select('*'),
      ]);
      if (ee) console.warn('[db] entries fetch:', ee.message);
      if (se) console.warn('[db] scores fetch:', se.message);

      if (entries && entries.length > 0) {
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(
          entries.map(e => ({ name: e.name, picks: e.picks, tiebreaker: e.tiebreaker, ts: e.ts }))
        ));
      }
      if (scores && scores.length > 0) {
        const map = {};
        scores.forEach(s => {
          map[s.player_name] = { r1: s.r1, r2: s.r2, r3: s.r3, r4: s.r4 };
        });
        localStorage.setItem(SCORES_KEY, JSON.stringify(map));
      }
    } catch (e) {
      console.warn('[db] syncFromSupabase error:', e);
    }
  }

  // ── Override saveEntry ─────────────────────────────────────
  const _origSaveEntry = saveEntry;
  window.saveEntry = function (name, picks, tiebreaker) {
    _origSaveEntry(name, picks, tiebreaker);
    if (!sb) return;
    const ts = Date.now();
    sb.from('entries')
      .upsert({ name, picks, tiebreaker, ts }, { onConflict: 'name' })
      .then(({ error }) => { if (error) console.warn('[db] saveEntry:', error.message); });
  };

  // ── Override deleteEntry ───────────────────────────────────
  const _origDeleteEntry = deleteEntry;
  window.deleteEntry = function (name) {
    _origDeleteEntry(name);
    if (!sb) return;
    sb.from('entries')
      .delete().eq('name', name)
      .then(({ error }) => { if (error) console.warn('[db] deleteEntry:', error.message); });
  };

  // ── Override saveScores (used by admin updatePlayerScore) ──
  const _origSaveScores = saveScores;
  window.saveScores = function (scores) {
    _origSaveScores(scores);
    if (!sb) return;
    const rows = Object.entries(scores).map(([player_name, s]) => ({
      player_name,
      r1: s.r1 != null ? s.r1 : null,
      r2: s.r2 != null ? s.r2 : null,
      r3: s.r3 != null ? s.r3 : null,
      r4: s.r4 != null ? s.r4 : null,
    }));
    if (!rows.length) return;
    sb.from('scores')
      .upsert(rows, { onConflict: 'player_name' })
      .then(({ error }) => { if (error) console.warn('[db] saveScores:', error.message); });
  };

  // ── Expose promise — pages await this before first render ──
  window.dbReady = syncFromSupabase();
}());
