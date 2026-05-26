// Google Calendar fetcher — given an access token + a center date,
// returns today's events + a 3-day window (yesterday/today/tomorrow relative
// to the center).
import React from 'react';

const CAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export function buildDateLabels(centerDate) {
  const d = new Date(centerDate);
  d.setHours(0, 0, 0, 0);
  const yesterday = new Date(d); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(d); tomorrow.setDate(tomorrow.getDate() + 1);

  const days = [yesterday, d, tomorrow].map((day, i) => ({
    day: day.getDate(),
    label: `${DAY_NAMES_SHORT[day.getDay()]} · ${MONTHS_SHORT[day.getMonth()]} ${day.getDate()}`,
    current: i === 1,
  }));

  const dateHeader = {
    weekday: DAY_NAMES_LONG[d.getDay()],
    date: `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
  };

  return { days, dateHeader };
}

export function useGoogleCalendar(token, centerDate) {
  const [state, setState] = React.useState({
    today: [],
    week: {},
    loading: false,
    error: null,
  });

  const centerMs = centerDate.getTime();

  React.useEffect(() => {
    if (!token) {
      setState({ today: [], week: {}, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    const center = new Date(centerMs); center.setHours(0, 0, 0, 0);
    const dayStart = center;
    const dayEnd = new Date(center); dayEnd.setHours(23, 59, 59, 999);
    const rangeStart = new Date(dayStart); rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(dayEnd); rangeEnd.setDate(rangeEnd.getDate() + 1);

    const params = new URLSearchParams({
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    fetch(`${CAL_BASE}?${params}`, { headers: { Authorization: `Bearer ${token}` } })
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

        const today = all.filter((e) => e.start >= dayStart && e.start <= dayEnd);

        const week = {};
        for (const e of all) {
          const d = e.start.getDate();
          (week[d] = week[d] || []).push(e);
        }

        setState({ today, week, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Calendar fetch failed', err);
        setState({ today: [], week: {}, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [token, centerMs]);

  return state;
}
