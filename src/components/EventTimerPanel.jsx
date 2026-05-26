// Event timer panel — slides in when an event is clicked from the timeline.
// Real-time countdown, cascade pre-ticks, sub-timers during the event, wired
// Restart and Snooze.
import React from 'react';
import { SRC_META } from '../data.js';
import {
  SourceBadge, ImportantStar, SmallTag, SectionLabel, fmtRange,
} from './Shared.jsx';
import { buildTicks } from '../lib/timers.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function EventTimerPanel({ event, defaults, now, timer, onClose }) {
  // Re-render every second so the countdown ticks live.
  const [, setSecondTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSecondTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!event) return null;

  // Use live now for the displayed countdown so seconds update each tick.
  const liveNow = new Date();
  const m = SRC_META[event.src];
  const durationMins = Math.round((event.end.getTime() - event.start.getTime()) / 60_000);
  const secsUntilStart = Math.round((event.start.getTime() - liveNow.getTime()) / 1000);
  const secsUntilEnd = Math.round((event.end.getTime() - liveNow.getTime()) / 1000);
  const past = secsUntilEnd < 0;
  const inProgress = !past && secsUntilStart <= 0;

  const isSnoozed = timer?.snoozed?.[event.id] && timer.snoozed[event.id] > liveNow.getTime();

  // Build all ticks
  const allTicks = React.useMemo(
    () => buildTicks(event, defaults.values),
    [event.id, event.start, event.end, defaults.values.join(',')]
  );
  const preCascade = allTicks.filter((t) => t.kind === 'pre').sort((a, b) => b.mins - a.mins);
  const subs = allTicks.filter((t) => t.kind !== 'pre');

  const tickDone = (t) => {
    if (timer?.fired?.has(t.id)) return true;
    return t.at.getTime() <= liveNow.getTime();
  };

  // Big countdown
  let countSecs, countLabel, countColor;
  if (past) {
    countSecs = 0; countLabel = 'Completed'; countColor = 'var(--mute)';
  } else if (inProgress) {
    countSecs = Math.max(0, secsUntilEnd); countLabel = 'Ends in'; countColor = 'var(--success)';
  } else {
    countSecs = Math.max(0, secsUntilStart); countLabel = 'Starts in'; countColor = 'var(--accent)';
  }
  const hours = Math.floor(countSecs / 3600);
  const mins = Math.floor((countSecs % 3600) / 60);
  const secs = countSecs % 60;
  const display = `${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;

  const onSnooze = () => timer?.snooze && timer.snooze(event.id, 5);
  const onRestart = () => timer?.restart && timer.restart(event.id);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,19,15,0.20)',
        zIndex: 80,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 520,
        maxWidth: '92vw',
        background: 'var(--bg)',
        borderLeft: '1px solid var(--hair-2)',
        zIndex: 90,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-pop)',
      }}>
        <div style={{
          padding: '14px 18px',
          background: 'var(--panel)',
          borderBottom: '1px solid var(--hair)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button className="btn ghost sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>←</span> Back
          </button>
          <div style={{ flex: 1 }} />
          <span className="smcaps">Event timer</span>
          <button className="btn ghost sm" onClick={onClose} style={{ padding: '4px 8px', fontSize: 13 }}>✕</button>
        </div>

        <div style={{
          padding: '18px 22px 16px',
          borderBottom: '1px solid var(--hair)',
          background: 'var(--panel)',
          borderLeft: `4px solid ${m.color}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SourceBadge src={event.src} />
            {event.important && <ImportantStar />}
            {event.protectedBlock && <SmallTag>protected</SmallTag>}
            {inProgress && <SmallTag>in progress</SmallTag>}
            {past && <SmallTag>past</SmallTag>}
            {isSnoozed && <SmallTag danger>snoozed</SmallTag>}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, marginTop: 8 }}>{event.title}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', marginTop: 6 }}>
            {fmtRange(event.start, event.end)} · {durationMins} min{event.location ? ` · ${event.location}` : ''}
          </div>
        </div>

        <div style={{
          padding: '20px 22px 18px',
          borderBottom: '1px solid var(--hair)',
          background: past ? 'var(--soft)' : (inProgress ? 'var(--success-bg)' : 'var(--accent-bg)'),
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="smcaps" style={{ color: countColor }}>{countLabel}</div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 600, color: countColor, lineHeight: 1, marginTop: 6, letterSpacing: -1 }}>
              {display}
            </div>
            {isSnoozed && (
              <div className="mono" style={{ fontSize: 10, color: 'var(--conflict)', marginTop: 8 }}>
                notifications muted for {Math.ceil((timer.snoozed[event.id] - liveNow.getTime()) / 60_000)}m
              </div>
            )}
          </div>
          {!past && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={onSnooze} disabled={!timer}>Snooze 5</button>
              <button className="btn accent" onClick={onRestart} disabled={!timer}>↻ Restart</button>
            </div>
          )}
        </div>

        <div className="scroll" style={{ flex: 1, padding: '18px 22px', minHeight: 0 }}>
          <SectionLabel right={<span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{preCascade.length} steps · auto</span>}>
            Cascade · before event
          </SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {preCascade.map((t) => (
              <TickRow key={t.id} tick={t} done={tickDone(t)} contextNow={liveNow} />
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <SectionLabel right={
              <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>
                every 15m · last 5 warning · {durationMins}m
              </span>
            }>
              Sub-timers · during event
            </SectionLabel>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {subs.map((t) => (
              <TickRow key={t.id} tick={t} done={tickDone(t)} contextNow={liveNow} />
            ))}
          </div>
        </div>

        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--hair)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>
            {timer?.permission === 'granted'
              ? 'browser notifications on · keep this tab open'
              : 'enable notifications to get pinged'}
          </span>
          <div style={{ flex: 1 }} />
        </div>
      </div>
    </>
  );
}

function TickRow({ tick, done, contextNow }) {
  const past = tick.at.getTime() <= contextNow.getTime();
  const minsRel = Math.round((tick.at.getTime() - contextNow.getTime()) / 60_000);
  const kindStyles = {
    pre:   { bg: 'var(--accent-bg)',  fg: 'var(--accent)',  bd: 'var(--accent)'  },
    mid:   { bg: 'var(--google-bg)',  fg: 'var(--google)',  bd: 'var(--google)'  },
    last5: { bg: 'var(--accent-bg)',  fg: 'var(--accent)',  bd: 'var(--accent)'  },
    end:   { bg: 'var(--success-bg)', fg: 'var(--success)', bd: 'var(--success)' },
  };
  const s = kindStyles[tick.kind];

  let timeNote;
  if (past) timeNote = `fired ${formatRel(-minsRel)}`;
  else timeNote = `in ${formatRel(minsRel)}`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: 'var(--panel)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      opacity: done ? 0.78 : 1,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4,
        background: done ? s.fg : 'var(--panel)',
        border: `1.5px solid ${done ? s.fg : 'var(--hair-3)'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5L4.5 9L10 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="mono" style={{
        fontSize: 11, fontWeight: 500,
        color: s.fg,
        padding: '2px 8px', borderRadius: 99,
        background: s.bg,
        border: `1px solid ${s.bd}`,
        flexShrink: 0,
      }}>
        {tick.label}
      </span>
      <span style={{
        flex: 1, fontSize: 12.5, color: done ? 'var(--mute)' : 'var(--ink-2)',
        textDecoration: done ? 'line-through' : 'none',
      }}>
        {tick.kind === 'pre' ? `Ping ${tick.mins} min before start` :
         tick.kind === 'end' ? `Event ends` :
         tick.kind === 'last5' ? `Wrap warning — 5 min remaining` :
         `Checkpoint at ${tick.mins} min`}
      </span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', flexShrink: 0 }}>
        {tick.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </span>
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--faint)', minWidth: 64, textAlign: 'right', flexShrink: 0 }}>
        {timeNote}
      </span>
    </div>
  );
}

function formatRel(m) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
