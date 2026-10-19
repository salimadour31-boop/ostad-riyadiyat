/* Stockage local IndexedDB (clé/valeur). Rien n'est envoyé sur le réseau. */
(function (root) {
  const NAME = 'ostad-riyadiyat', STORE = 'kv';
  let dbp;
  function open() { if (!dbp) dbp = new Promise((res, rej) => { const r = indexedDB.open(NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); return dbp; }
  async function tx(mode, fn) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode); const s = t.objectStore(STORE); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); }
  const DB = {
    get: k => tx('readonly', s => s.get(k)),
    set: (k, v) => tx('readwrite', s => { s.put(v, k); }),
    async all() { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE); const s = t.objectStore(STORE); const out = {}; const c = s.openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else res(out); }; c.onerror = () => rej(c.error); }); },
    clear: () => tx('readwrite', s => { s.clear(); })
  };
  root.DB = DB;
})(this);
