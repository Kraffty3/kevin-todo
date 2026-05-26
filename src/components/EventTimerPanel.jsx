// Event timer panel — slides in when an event is clicked from the timeline.
// Auto-generates: cascade leading up to start (T-30, T-15, T-10, T-5, T-2)
// + during-event sub-timers (every 15m through duration + a last-5-min warning + end).
import React from 'react';
import { DEMO_NOW, SRC_META } from '../data.js';
import {
  SourceBadge, ImportantStar, SmallTag, SectionLabel, fmtRange,
} from './Shared.jsx';

function buildPreCascade(values, eventStart) {
  return values.slice().sort((a, b) => b - a).map((m) => ({
    at: new Date(eventStart.getTime() - m * 60000),
    mins: m,
    label: `T−${m}m`,
    kind: 'pre',
  }));
}

function buildSubTimers(eventStart, eventEnd) {
  const durationMins = Math.round((eventEnd.getTime() - eventStart.getTime()) / 60000);
  const ticks = [];
  for (let m = 15; m < durationMins; m += 15) {
    ticks.push({ at: new Date(eventStart.getTime() + m * 60000), mins: m, label: `${m}m in`, kind: 'mid' });
  }
  if (durationMins > 10) {
    const last5 = durationMins - 5;
    if (!ticks.find((t) => t.mins === last5)) {
      ticks.push({ at: new Date(eventStart.getTime() + last5 * 60000), mins: last5, label: 'last 5 min', kind: 'last5' });
    }
  }
  ticks.push({ at: eventEnd, mins: durationMins, label: 'end', kind: 'end' });
  return ticks.sort((a, b) => a.at - b.at);
}

function tickKey(t) {
  return `${t.kind}-${t.at.getTime()}`;
}

export function EventTimerPanel({ event, defaults, onClose }) {
  const [checkedExtra, setCheckedExtra] = React.useState({});

  if (!event) return null;

  const m = SRC_META[event.src];
  const durationMins = Math.round((event.end.getTime() - event.start.getTime()) / 60000);
  const minsUntil = Math.round((event.start.getTime() - DEMO_NOW.getTime()) / 60000);
  const minsLeft = Math.round((event.end.getTime() - DEMO_NOW.getTime()) / 60000);
  const past = event.end.getTime() < DEMO_NOW.getTime();
  const inProgress = !past && event.start.getTime() <= DEMO_NOW.getTime();

  const preCascade = buildPreCascade(defaults.values, event.start);
  const subs = buildSubTimers(event.start, event.end);

  const tickDone = (t) => {
    if (checkedExtra[tickKey(t)] !== undefined) return checkedExtra[tickKey(t)];
    return t.at.getTime() <= DEMO_NOW.getTime();
  };

  const toggleTick = (t) => {
    const key = tickKey(t);
    setCheckedExtra((s) => ({ ...s, [key]: !tickDone(t) }));
  };

  const countSecs = 14;
  let countMins, countLabel, countColor;
  if (past) {
    countMins = 0; countLabel = 'Completed'; countColor = 'var(--mute)';
  } else if (inProgress) {
    countMins = minsLeft; countLabel = 'Ends in'; countColor = 'var(--success)';
  } else {
    countMins = minsUntil; countLabel = 'Starts in'; countColor = 'var(--accent)';
  }
  const display = `${String(Math.floor(Math.max(countMins, 0) / 60)).padStart(2, '0')}:${String(Math.max(countMins, 0) % 60).padStart(2, '0')}:${String(countSecs).padStart(2, '0')}`;

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
          </div>
          {!past && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn">Snooze 5</button>
              <button className="btn accent">↻ Restart timer</button>
            </div>
          )}
        </div>

        <div className="scroll" style={{ flex: 1, padding: '18px 22px', minHeight: 0 }}>
          <SectionLabel right={<span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{preCascade.length} steps · auto</span>}>
            Cascade · before event
          </SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {preCascade.map((t) => (
              <TickRow key={tickKey(t)}
                tick={t}
                done={tickDone(t)}
                onToggle={() => toggleTick(t)}
                contextNow={DEMO_NOW}
              />
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
              <TickRow key={tickKey(t)}
                tick={t}
                done={tickDone(t)}
                onToggle={() => toggleTick(t)}
                contextNow={DEMO_NOW}
              />
            ))}
          </div>
        </div>

        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--hair)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>
            ticks auto-fire as time passes · tap to mark manually
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn sm">Customize…</button>
        </div>
      </div>
    </>
  );
}

function TickRow({ tick, done, onToggle, contextNow }) {
  const past = tick.at.getTime() <= contextNow.getTime();
  const minsRel = Math.round((tick.at.getTime() - contextNow.getTime()) / 60000);
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
    <label style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: 'var(--panel)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      cursor: 'pointer',
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
      <input type="checkbox" checked={done} onChange={onToggle} style={{ display: 'none' }} />
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
    </label>
  );
}

function formatRel(m) {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
