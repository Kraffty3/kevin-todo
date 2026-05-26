// Tick engine — schedules + fires browser notifications for cascade and
// sub-timer ticks across all important events. Persists "fired" set in
// localStorage so a reload doesn't re-fire ticks that already happened.
import React from 'react';

const FIRED_KEY = 'kevin-todo:fired-ticks';
const SNOOZE_KEY = 'kevin-todo:snoozed';

// Build the full list of expected ticks for an event.
export function buildTicks(event, cascadeValues) {
  const ticks = [];
  // Pre-event cascade
  for (const m of cascadeValues) {
    ticks.push({
      id: `${event.id}:pre:${m}`,
      at: new Date(event.start.getTime() - m * 60_000),
      kind: 'pre',
      label: `T−${m}m`,
      mins: m,
      eventId: event.id,
      eventTitle: event.title,
    });
  }
  // During-event sub-timers
  const duration = Math.round((event.end.getTime() - event.start.getTime()) / 60_000);
  for (let m = 15; m < duration; m += 15) {
    ticks.push({
      id: `${event.id}:mid:${m}`,
      at: new Date(event.start.getTime() + m * 60_000),
      kind: 'mid',
      label: `${m}m in`,
      mins: m,
      eventId: event.id,
      eventTitle: event.title,
    });
  }
  if (duration > 10) {
    const last5 = duration - 5;
    if (!ticks.find((t) => t.kind === 'mid' && t.mins === last5)) {
      ticks.push({
        id: `${event.id}:last5`,
        at: new Date(event.start.getTime() + last5 * 60_000),
        kind: 'last5',
        label: 'last 5 min',
        mins: last5,
        eventId: event.id,
        eventTitle: event.title,
      });
    }
  }
  ticks.push({
    id: `${event.id}:end`,
    at: event.end,
    kind: 'end',
    label: 'end',
    mins: duration,
    eventId: event.id,
    eventTitle: event.title,
  });
  return ticks.sort((a, b) => a.at - b.at);
}

function loadFired() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function saveFired(set) {
  localStorage.setItem(FIRED_KEY, JSON.stringify([...set]));
}
function loadSnoozed() {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveSnoozed(obj) {
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(obj));
}

function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export function fireTestNotification() {
  if (!notificationsSupported() || Notification.permission !== 'granted') {
    alert('Notifications not enabled');
    return;
  }
  new Notification('Done — test notification', {
    body: 'Notifications are working. You will see one of these for each cascade tick on important events.',
    icon: '/favicon.ico',
    tag: 'test',
  });
}

function fireTickNotification(tick, onClick) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const bodyByKind = {
    pre: `Starts in ${tick.mins} min`,
    mid: `${tick.mins} min in`,
    last5: '5 min remaining',
    end: 'Event ending',
  };
  const titleByKind = {
    pre: `T−${tick.mins}m · ${tick.eventTitle}`,
    mid: `${tick.mins}m in · ${tick.eventTitle}`,
    last5: `Wrap up · ${tick.eventTitle}`,
    end: `End · ${tick.eventTitle}`,
  };
  const notif = new Notification(titleByKind[tick.kind], {
    body: bodyByKind[tick.kind],
    icon: '/favicon.ico',
    tag: tick.id,
    requireInteraction: tick.kind === 'pre' && tick.mins <= 5,
  });
  notif.onclick = () => {
    window.focus();
    notif.close();
    onClick && onClick(tick.eventId);
  };
}

// Main runner — schedules + fires for all important events.
export function useTickRunner(importantEvents, cascadeValues, onTickClick) {
  const [fired, setFired] = React.useState(loadFired);
  const [snoozed, setSnoozed] = React.useState(loadSnoozed);
  const [permission, setPermission] = React.useState(getNotificationPermission());
  const onTickClickRef = React.useRef(onTickClick);
  React.useEffect(() => { onTickClickRef.current = onTickClick; }, [onTickClick]);

  React.useEffect(() => {
    const check = () => {
      const now = Date.now();
      let changed = false;
      const next = new Set(fired);

      for (const event of importantEvents) {
        const snoozedUntil = snoozed[event.id];
        const isSnoozed = snoozedUntil && snoozedUntil > now;
        const ticks = buildTicks(event, cascadeValues);
        for (const tick of ticks) {
          if (next.has(tick.id)) continue;
          const at = tick.at.getTime();
          if (at > now) continue;
          // Tick is in the past — mark fired.
          // Only ACTUALLY notify if it crossed within the last 90s and event isn't snoozed.
          const crossed = at > now - 90_000;
          if (crossed && !isSnoozed && permission === 'granted') {
            fireTickNotification(tick, onTickClickRef.current);
          }
          next.add(tick.id);
          changed = true;
        }
      }

      if (changed) {
        setFired(next);
        saveFired(next);
      }
    };

    check();
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, [importantEvents, cascadeValues, permission, snoozed]);

  const restart = React.useCallback((eventId) => {
    const next = new Set([...fired].filter((id) => !id.startsWith(`${eventId}:`)));
    setFired(next);
    saveFired(next);
    const ns = { ...snoozed };
    delete ns[eventId];
    setSnoozed(ns);
    saveSnoozed(ns);
  }, [fired, snoozed]);

  const snooze = React.useCallback((eventId, mins = 5) => {
    const ns = { ...snoozed, [eventId]: Date.now() + mins * 60_000 };
    setSnoozed(ns);
    saveSnoozed(ns);
  }, [snoozed]);

  const requestPermission = React.useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  return { fired, snoozed, permission, restart, snooze, requestPermission };
}

// Helper for the event-timer panel: returns whether a given tick has been
// fired (or is in the past — past ticks always show as "done" visually).
export function isTickDone(tick, fired, now) {
  if (fired.has(tick.id)) return true;
  return tick.at.getTime() <= now.getTime();
}
