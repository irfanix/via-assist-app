/* ============================================================
   db.js: IndexedDB wrapper (with in-memory fallback) + Settings
   ============================================================ */

const DB = (function () {

  const DB_NAME = 'via-assist';
  const STORE = 'records';
  const VERSION = 1;

  let idb = null;
  let memory = [];          // fallback if IndexedDB is unavailable
  let useMemory = false;

  function uid() {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  async function init() {
    if (!('indexedDB' in window)) { useMemory = true; return; }
    try {
      idb = await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains(STORE)) {
            d.createObjectStore(STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB unavailable, using memory fallback', e);
      useMemory = true;
    }
  }

  function store(mode) { return idb.transaction(STORE, mode).objectStore(STORE); }

  function put(rec) {
    rec.updatedAt = new Date().toISOString();
    if (useMemory) {
      const i = memory.findIndex(r => r.id === rec.id);
      if (i >= 0) memory[i] = rec; else memory.push(rec);
      return Promise.resolve(rec);
    }
    return new Promise((resolve, reject) => {
      const r = store('readwrite').put(rec);
      r.onsuccess = () => resolve(rec);
      r.onerror = () => reject(r.error);
    });
  }

  function get(id) {
    if (useMemory) return Promise.resolve(memory.find(r => r.id === id) || null);
    return new Promise((resolve, reject) => {
      const r = store('readonly').get(id);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }

  function all() {
    if (useMemory) return Promise.resolve(memory.slice());
    return new Promise((resolve, reject) => {
      const r = store('readonly').getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  }

  function del(id) {
    if (useMemory) {
      memory = memory.filter(r => r.id !== id);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const r = store('readwrite').delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }

  function clear() {
    if (useMemory) { memory = []; return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      const r = store('readwrite').clear();
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }

  return { init, put, get, all, del, clear, uid };
})();

/* ------------------------------------------------------------
   Settings: small key/value store in localStorage
   ------------------------------------------------------------ */
const Settings = (function () {
  const KEY = 'via-assist-settings';
  const defaults = {
    worker: '',
    facility: '',
    referral: '',
    demo: false,
    lang: 'en'
  };

  function read() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function get(k) { return read()[k]; }

  function set(k, v) {
    const s = read();
    s[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  function setAll(obj) {
    const s = Object.assign(read(), obj);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  return { get, set, setAll, all: read };
})();