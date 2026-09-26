/**
 * Browser storage, wrapped so a blocked or unavailable storage never breaks
 * the app.
 *
 * Session token: kept in memory and mirrored to sessionStorage, so it
 * survives a reload of the tab but not closing it. This is a deliberate
 * decision (API_CONTRACT.md §11.6): the backend accepts only a Bearer header,
 * the app loads no third-party scripts, and the token never goes into a URL
 * or a log. Theme preference is stored in localStorage.
 */

function safe(storageName) {
  return {
    get(key) {
      try { return window[storageName].getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window[storageName].setItem(key, value); } catch { /* storage unavailable */ }
    },
    remove(key) {
      try { window[storageName].removeItem(key); } catch { /* storage unavailable */ }
    },
  };
}

export const local = safe('localStorage');
const session = safe('sessionStorage');

const TOKEN_KEY = 'ifrsmart.session';
let memoryToken = session.get(TOKEN_KEY);

export const tokenStore = {
  get: () => memoryToken,
  set(token) {
    memoryToken = token;
    session.set(TOKEN_KEY, token);
  },
  clear() {
    memoryToken = null;
    session.remove(TOKEN_KEY);
  },
};
