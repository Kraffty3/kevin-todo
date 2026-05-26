// Google Calendar integration — OAuth (implicit flow) + read-only event fetch.
import React from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TOKEN_KEY = 'kevin-todo:gtoken';

function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (t.expiresAt < Date.now() + 60_000) return null;
    return t;
  } catch {
    return null;
  }
}

export function useGoogleAuth() {
  const [token, setToken] = React.useState(loadToken);

  const login = useGoogleLogin({
    scope: SCOPE,
    onSuccess: (resp) => {
      const t = {
        access_token: resp.access_token,
        expiresAt: Date.now() + (resp.expires_in - 60) * 1000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
      setToken(t);
    },
    onError: (err) => {
      console.error('Google sign-in failed', err);
      alert(`Google sign-in failed: ${err?.error || 'unknown error'}`);
    },
  });

  const logout = () => {
    googleLogout();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return { token: token?.access_token || null, signedIn: !!token, login, logout };
}

function mapGoogleEvent(ge) {
  const start = new Date(ge.start.dateTime || ge.start.date);
  const end = new Date(ge.end.dateTime || ge.end.date);
  const attendees = ge.attendees?.filter((a) => !a.self && !a.resource).length || 0;
  const allDay = !ge.start.dateTime;
  return {
    id: ge.id,
    src: 'google',
    title: ge.summary || '(untitled)',
    start,
    end,
    location: ge.location,
    attendees,
    important: ge.colorId === '11' || attendees >= 2,
    allDay,
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function useGoogleCalendar(token) {
  const [state, setState] = React.useState({
    today: [],
    week: {},
    days: [],
    dateHeader: { weekday: '', date: '' },
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!token) {
      setState((s) => ({ ...s, today: [], week: {}, error: null }));
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const params = new URLSearchParams({
      timeMin: yesterdayStart.toISOString(),
      timeMax: tomorrowEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    fetch(`${CAL_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text();
          throw new Error(`Calendar API ${r.status}: ${body.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const all = (data.items || [])
          .filter((e) => e.start && (e.start.dateTime || e.start.date))
          .map(mapGoogleEvent)
          .filter((e) => !e.allDay);

        const today = all.filter((e) => e.start >= todayStart && e.start <= todayEnd);

        const week = {};
        for (const e of all) {
          const d = e.start.getDate();
          (week[d] = week[d] || []).push(e);
        }

        const yesterday = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);
        const days = [yesterday, todayStart, tomorrow].map((d, i) => ({
          day: d.getDate(),
          label: `${SHORT_DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`,
          current: i === 1,
        }));

        const dateHeader = {
          weekday: DAY_NAMES[now.getDay()],
          date: `${FULL_MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
        };

        setState({ today, week, days, dateHeader, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Calendar fetch failed', err);
        setState((s) => ({ ...s, loading: false, error: err.message }));
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
