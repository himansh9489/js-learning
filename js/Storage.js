// storageService.js

const storageKeys = {
  THEME: "app:theme",
  LOCALE: "app:locale",
  CART: "app:cart",
  CHECKOUT_STATE: "app:checkoutState",
  // add more as needed
};

// ---------- Cookies (for understanding; set real auth cookie on server) ----------

const cookieStorage = {
  set(name, value, options = {}) {
    const { days = 7, path = "/", secure = true, sameSite = "Lax" } = options;

    const expires = new Date(Date.now() + days * 864e5).toUTCString();

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Expires=${expires}; Path=${path}; SameSite=${sameSite}`;
    if (secure) cookie += "; Secure";

    document.cookie = cookie;
  },

  get(name) {
    const decoded = decodeURIComponent(document.cookie || "");
    const parts = decoded.split("; ").find((row) => row.startsWith(`${name}=`));
    return parts ? parts.split("=")[1] : null;
  },

  remove(name, path = "/") {
    document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`;
  },
};

// ---------- Local & Session Storage wrappers ----------

function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

const localStore = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : safeParse(raw, fallback);
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const sessionStore = {
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get(key, fallback = null) {
    const raw = sessionStorage.getItem(key);
    return raw == null ? fallback : safeParse(raw, fallback);
  },
  remove(key) {
    sessionStorage.removeItem(key);
  },
};

// ---------- Simple IndexedDB wrapper (for larger data) ----------

function openDb(dbName = "app-db", storeName = "kv") {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(
  key,
  value,
  { dbName = "app-db", storeName = "kv" } = {},
) {
  const db = await openDb(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key, { dbName = "app-db", storeName = "kv" } = {}) {
  const db = await openDb(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbRemove(key, { dbName = "app-db", storeName = "kv" } = {}) {
  const db = await openDb(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- High-level helpers for typical use-cases ----------

export const storageService = {
  keys: storageKeys,

  cookies: cookieStorage,
  local: localStore,
  session: sessionStore,
  idb: { set: idbSet, get: idbGet, remove: idbRemove },

  // Examples:

  setTheme(theme) {
    localStore.set(storageKeys.THEME, theme);
  },
  getTheme() {
    return localStore.get(storageKeys.THEME, "light");
  },

  setLocale(locale) {
    localStore.set(storageKeys.LOCALE, locale);
  },
  getLocale() {
    return localStore.get(storageKeys.LOCALE, "en");
  },

  saveCart(cart) {
    localStore.set(storageKeys.CART, cart);
  },
  loadCart() {
    return localStore.get(storageKeys.CART, []);
  },

  saveCheckoutState(state) {
    sessionStore.set(storageKeys.CHECKOUT_STATE, state);
  },
  loadCheckoutState() {
    return sessionStore.get(storageKeys.CHECKOUT_STATE, null);
  },
};
