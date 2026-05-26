// Quick-add: natural-language parsing + local store + Google Calendar write.
import React from 'react';
import * as chrono from 'chrono-node';

const LOCAL_KEY = 'kevin-todo:local-events';
const CAL_INSERT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Parse a free-text quick-add string into a structured event.
// Returns null if no date/time was detected (need at least one).
export function parseQuickAdd(text, referenceDate = new Date()) {
  if (!text || !text.trim()) return null;
  const results = chrono.parse(text, referenceDate, { forwardDate: true });
  if (results.length === 0) return null;

  const r = results[0];
  const start = r.start.date();
  let end;
  if (r.end) {
    end = r.end.date();
  } else {
    // No end date — default to 30 min duration
    end = new Date(start.getTime() + 30 * 60_000);
  }

  // Strip the matched date phrase from the text to get a clean title
  let title = (text.slice(0, r.index) + text.slice(r.index + r.text.length)).trim();
  title = title.replace(/\s+/g, ' ').replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, '');

  // "important" or leading "!" in the title flags it
  let important = false;
  const importantRe = /\b(important|urgent|!important)\b/i;
  if (importantRe.test(title)) {
    important = true;
    title = title.replace(importantRe, '').trim();
  }
  if (title.startsWith('!')) {
    important = true;
    title = title.slice(1).trim();
  }

  if (!title) title = r.text;

  return { title, start, end, important };
}

// ── Local event storage ────────────────────────────────────────────────
function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
  } catch {
    return [];
  }
}

function saveLocal(events) {
  const serialized = events.map((e) => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));
  localStorage.setItem(LOCAL_KEY, JSON.stringify(serialized));
}

export function useLocalEvents() {
  const [events, setEvents] = React.useState(loadLocal);

  const addEvent = React.useCallback((parsed) => {
    const e = {
      id: `local-${Date.now()}`,
      src: 'manual',
      title: parsed.title,
      start: parsed.start,
      end: parsed.end,
      important: parsed.important,
      location: undefined,
      attendees: 0,
      allDay: false,
    };
    setEvents((prev) => {
      const next = [...prev, e];
      saveLocal(next);
      return next;
    });
    return e;
  }, []);

  const removeEvent = React.useCallback((id) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocal(next);
      return next;
    });
  }, []);

  return { events, addEvent, removeEvent };
}

// ── Google Calendar insert ─────────────────────────────────────────────
export async function pushToGoogleCalendar(token, parsed) {
  const body = {
    summary: parsed.title,
    start: { dateTime: parsed.start.toISOString() },
    end: { dateTime: parsed.end.toISOString() },
  };
  // Mark important via Tomato color (matches our import heuristic)
  if (parsed.important) body.colorId = '11';

  const resp = await fetch(CAL_INSERT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Calendar insert ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}
