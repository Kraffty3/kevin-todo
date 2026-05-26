// Google OAuth — direct implicit flow with URL redirect (no popup, no COOP issues).
// Flow:
//   1. user clicks Connect → page navigates to accounts.google.com
//   2. Google authenticates, redirects back with token in URL hash
//   3. on app load, consumeRedirect() parses hash, stores token, clears hash
import React from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events';
const TOKEN_KEY = 'kevin-todo:gtoken';
const STATE_KEY = 'kevin-todo:oauth-state';
const USER_KEY = 'kevin-todo:user';

function randomState(len = 32) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

export function startLogin() {
  if (!CLIENT_ID) {
    alert('VITE_GOOGLE_CLIENT_ID is not configured.');
    return;
  }
  const state = randomState();
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: 'token',
    scope: SCOPE,
    include_granted_scopes: 'true',
    state,
    prompt: 'consent',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function loadStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (t.expiresAt < Date.now() + 60_000) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function consumeRedirect() {
  if (!window.location.hash || window.location.hash.length < 2) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  const state = params.get('state');
  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!state || state !== expectedState) {
    console.error('OAuth state mismatch — possible CSRF');
    return null;
  }
  sessionStorage.removeItem(STATE_KEY);

  const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
  const token = {
    access_token: accessToken,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));

  // Clean URL so the hash isn't visible / re-parsed on refresh
  window.history.replaceState(null, '', window.location.pathname + window.location.search);

  return token;
}

async function fetchUserInfo(accessToken) {
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const info = await resp.json();
    const user = { email: info.email, name: info.name, picture: info.picture };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    console.error('userinfo failed', err);
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = React.useState(loadStoredToken);
  const [user, setUser] = React.useState(loadStoredUser);

  React.useEffect(() => {
    const fromRedirect = consumeRedirect();
    if (fromRedirect) {
      setToken(fromRedirect);
      fetchUserInfo(fromRedirect.access_token).then((u) => {
        if (u) setUser(u);
      });
    } else if (token && !user) {
      fetchUserInfo(token.access_token).then((u) => {
        if (u) setUser(u);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return {
    token: token?.access_token || null,
    user,
    signedIn: !!token,
    login: startLogin,
    logout,
    configured: !!CLIENT_ID,
  };
}
