// Today view — vertical timeline + right queue, with Day / 3-day toggle.
import React from 'react';
import { SRC_META, INBOX } from '../data.js';
import {
  SourceBadge, EventCard, HourLines, NowLine,
  QuickAdd, StaleStrip, SectionLabel,
  ImportantStar, CascadePips, fmtHour, fmtRange,
} from '../components/Shared.jsx';

const DAY_HPHR = 64;
const WK_HPHR = 40;
const DAY_START = 8;
const DAY_END = 19;

function fmtClock(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function TodayView({ events, weekEvents, view, onView, onSelectEvent, now, days, dateHeader }) {
  return (
    <div style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, borderRight: '1px solid var(--hair)' }}>
        <TodaySubHeader view={view} onView={onView} dateHeader={dateHeader} />
        <div style={{ padding: '12px 22px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--hair)' }}>
          <QuickAdd />
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.keys(SRC_META).filter(k => k !== 'manual').map(k => (
              <SourceBadge key={k} src={k} />
            ))}
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {view === 'day'
            ? <DayBody events={events} now={now} onSelectEvent={onSelectEvent} />
            : <WeekBody week={weekEvents} now={now} days={days} onSelectEvent={onSelectEvent} />}
        </div>

        <StaleStrip />
      </div>

      <RightQueue events={events} now={now} onSelectEvent={onSelectEvent} />
    </div>
  );
}

function TodaySubHeader({ view, onView, dateHeader }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 22px 12px',
      borderBottom: '1px solid var(--hair)',
    }}>
      <div>
        <div className="smcaps">{dateHeader.weekday}</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, marginTop: 2 }}>{dateHeader.date}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
        <button className="btn sm">‹</button>
        <button className="btn sm">Today</button>
        <button className="btn sm">›</button>
      </div>
      <div style={{ flex: 1 }} />
      <div className="seg">
        <button className={view === 'day' ? 'on' : ''} onClick={() => onView('day')}>Day</button>
        <button className={view === 'week' ? 'on' : ''} onClick={() => onView('week')}>3-day</button>
      </div>
    </div>
  );
}

function DayBody({ events, now, onSelectEvent }) {
  const hours = DAY_END - DAY_START;
  const totalH = hours * DAY_HPHR + 24;
  const nowH = (now.getHours() + now.getMinutes() / 60) - DAY_START;
  const nowTop = nowH * DAY_HPHR + 8;
  const nowInView = nowH >= 0 && nowH <= hours;

  const conflicts = groupConflicts(events);

  return (
    <div style={{ display: 'flex', position: 'relative', minHeight: totalH + 30 }}>
      <TimeRailWithTitle startHr={DAY_START} endHr={DAY_END} />
      <div style={{ flex: 1, position: 'relative', padding: '8px 0' }}>
        <HourLines count={hours + 1} hPerHr={DAY_HPHR} />
        {events.map((e) => {
          const start = (e.start.getHours() + e.start.getMinutes() / 60) - DAY_START;
          const end =   (e.end.getHours()   + e.end.getMinutes()   / 60) - DAY_START;
          const top = start * DAY_HPHR + 8 + 2;
          const height = Math.max(28, (end - start) * DAY_HPHR - 4);
          const past = e.end.getTime() < now.getTime();
          const current = e.start.getTime() <= now.getTime() && e.end.getTime() > now.getTime();
          const group = conflicts[e.id];
          const half = group ? (group.idx === 0 ? 'left' : 'right') : null;
          return (
            <EventCard key={e.id}
              event={e}
              geometry={{ top, height }}
              past={past} current={current}
              conflictHalf={half}
              onClick={() => onSelectEvent && onSelectEvent(e.id)}
            />
          );
        })}
        {Object.values(conflicts).filter((g, i, a) => a.findIndex(x => x.key === g.key) === i).map((g) => {
          const start = (g.start - DAY_START) * DAY_HPHR + 8 + 2;
          const h = (g.end - g.start) * DAY_HPHR - 4;
          return (
            <div key={g.key} style={{
              position: 'absolute', top: start, height: h,
              left: 'calc(50% - 0.5px)', width: 1, background: 'var(--conflict)', zIndex: 3,
            }} />
          );
        })}
        {nowInView && <NowLine top={nowTop} label={fmtClock(now)} />}
      </div>
    </div>
  );
}

function TimeRailWithTitle({ startHr, endHr }) {
  const out = [];
  for (let h = startHr; h <= endHr; h++) {
    const i = h - startHr;
    out.push(
      <div key={h} style={{ position: 'absolute', top: i * DAY_HPHR + 8 - 6, right: 10, color: 'var(--mute)' }}>
        <span className="mono" style={{ fontSize: 10 }}>{fmtHour(h)}</span>
      </div>
    );
  }
  return (
    <div style={{
      position: 'relative', width: 56, flex: '0 0 56px',
      borderRight: '1px solid var(--hair)',
    }}>
      {out}
    </div>
  );
}

function groupConflicts(events) {
  const result = {};
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()) {
        const groupStart = Math.min(a.start.getHours() + a.start.getMinutes()/60, b.start.getHours() + b.start.getMinutes()/60);
        const groupEnd   = Math.max(a.end.getHours()   + a.end.getMinutes()/60,   b.end.getHours()   + b.end.getMinutes()/60);
        const key = `${a.id}__${b.id}`;
        result[a.id] = { key, idx: 0, start: groupStart, end: groupEnd };
        result[b.id] = { key, idx: 1, start: groupStart, end: groupEnd };
      }
    }
  }
  return result;
}

function WeekBody({ week, now, days, onSelectEvent }) {
  const hours = DAY_END - DAY_START;
  const bodyH = hours * WK_HPHR + 24;
  const nowH = (now.getHours() + now.getMinutes() / 60) - DAY_START;
  const nowInView = nowH >= 0 && nowH <= hours;

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <div style={{ width: 56, flex: '0 0 56px', borderRight: '1px solid var(--hair)', position: 'relative' }}>
        <div style={{ height: 32, borderBottom: '1px solid var(--hair)' }} />
        {Array.from({ length: hours + 1 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', top: 32 + i * WK_HPHR - 6, right: 10, color: 'var(--mute)' }}>
            <span className="mono" style={{ fontSize: 10 }}>{fmtHour(DAY_START + i)}</span>
          </div>
        ))}
      </div>
      {days.map((d) => {
        const events = week[d.day] || [];
        const nowTop = nowH * WK_HPHR + 8;
        const conflicts = groupConflicts(events);
        return (
          <div key={d.day} style={{
            flex: 1, position: 'relative', minWidth: 0,
            borderRight: '1px solid var(--hair)',
            background: d.current ? 'var(--panel)' : 'transparent',
          }}>
            <div style={{
              padding: '8px 12px', borderBottom: '1px solid var(--hair)',
              fontSize: 12, fontWeight: d.current ? 600 : 500,
              color: d.current ? 'var(--ink)' : 'var(--ink-3)',
              background: d.current ? 'var(--accent-bg)' : 'var(--bg)',
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, boxSizing: 'border-box',
            }}>
              {d.current && <span className="dot" style={{ background: 'var(--accent)' }} />}
              <span>{d.label}</span>
              {d.current && <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>today</span>}
            </div>
            <div style={{ position: 'relative', height: bodyH, padding: '8px 0' }}>
              <HourLines count={hours + 1} hPerHr={WK_HPHR} />
              {events.map((e, i) => {
                const start = (e.start.getHours() + e.start.getMinutes() / 60) - DAY_START;
                const end =   (e.end.getHours()   + e.end.getMinutes()   / 60) - DAY_START;
                const top = start * WK_HPHR + 8 + 1;
                const height = Math.max(22, (end - start) * WK_HPHR - 2);
                const past = e.end.getTime() < now.getTime();
                const current = d.current && e.start.getTime() <= now.getTime() && e.end.getTime() > now.getTime();
                const group = conflicts[e.id];
                const half = group ? (group.idx === 0 ? 'left' : 'right') : null;
                return (
                  <EventCard key={e.id || i}
                    event={e}
                    geometry={{ top, height }}
                    past={past} current={current}
                    conflictHalf={half}
                    compact
                    onClick={() => onSelectEvent && e.id && onSelectEvent(e.id)}
                  />
                );
              })}
              {Object.values(conflicts).filter((g, i, a) => a.findIndex(x => x.key === g.key) === i).map((g) => {
                const start = (g.start - DAY_START) * WK_HPHR + 8 + 1;
                const h = (g.end - g.start) * WK_HPHR - 2;
                return (
                  <div key={g.key} style={{
                    position: 'absolute', top: start, height: h,
                    left: 'calc(50% - 0.5px)', width: 1, background: 'var(--conflict)', zIndex: 3,
                  }} />
                );
              })}
              {d.current && nowInView && <NowLine top={nowTop} label={fmtClock(now)} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RightQueue({ events, now, onSelectEvent }) {
  const important = events.filter((e) => e.important);
  return (
    <div style={{
      width: 320, flex: '0 0 320px',
      background: 'var(--softer)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--hair)' }}>
        <SectionLabel>Important · today</SectionLabel>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {important.length === 0 && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', padding: '6px 2px' }}>
              No important items today.
            </div>
          )}
          {important.map((e) => (
            <QueueItem key={e.id} event={e} now={now} onClick={() => onSelectEvent && onSelectEvent(e.id)} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
        <SectionLabel>Inbox · unscheduled</SectionLabel>
        <div style={{ marginTop: 8 }}>
          {INBOX.map((it) => (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
              borderBottom: '1px dashed var(--hair)',
            }}>
              <SourceBadge src={it.src} dotOnly />
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-2)' }}>{it.title}</span>
              <button className="btn sm ghost" style={{ padding: '2px 6px', color: 'var(--mute)' }}>↗</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px', flex: 1 }}>
        <SectionLabel>Filters</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
          {Object.entries(SRC_META).map(([k, v]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: v.color }} />
              <SourceBadge src={k} />
            </label>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Show stale strip</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Highlight conflicts</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function QueueItem({ event, now, onClick }) {
  const m = SRC_META[event.src];
  const inMeeting = event.start.getTime() <= now.getTime() && event.end.getTime() > now.getTime();
  const minsUntil = Math.round((event.start.getTime() - now.getTime()) / 60000);
  const tFired = minsUntil <= 0 ? 5 :
                 minsUntil <= 2 ? 4 :
                 minsUntil <= 5 ? 3 :
                 minsUntil <= 10 ? 2 :
                 minsUntil <= 15 ? 1 :
                 minsUntil <= 30 ? 1 : 0;
  return (
    <div onClick={onClick} style={{
      background: 'var(--panel)',
      border: '1px solid var(--hair)',
      borderRadius: 8,
      padding: '10px 12px',
      borderLeft: `3px solid ${m.color}`,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ImportantStar />
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 4 }}>
        {fmtRange(event.start, event.end)} · {inMeeting ? 'now' : (minsUntil > 0 ? `in ${minsUntil}m` : `${-minsUntil}m ago`)}
      </div>
      {!inMeeting && (
        <div style={{ marginTop: 8 }}>
          <CascadePips firedThrough={tFired} compact label={false} />
        </div>
      )}
      {inMeeting && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', marginTop: 8 }}>
          cascade complete · in meeting
        </div>
      )}
    </div>
  );
}
