// Shared hi-fi atoms — source badge, integration mark, cascade pips,
// timeline event card, now-line, quick-add, stale strip.
import React from 'react';
import { SRC_META, STALE } from '../data.js';

export function SourceBadge({ src = 'google', size = 'sm', dotOnly }) {
  const m = SRC_META[src] || SRC_META.manual;
  if (dotOnly) {
    return (
      <span
        className="dot"
        style={{ background: m.color, width: size === 'xs' ? 6 : 8, height: size === 'xs' ? 6 : 8 }}
      />
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'xs' ? '1px 6px' : '2px 8px',
      borderRadius: 99,
      background: m.bg,
      color: m.color,
      fontFamily: 'var(--font-mono)',
      fontSize: size === 'xs' ? 9.5 : 10.5,
      letterSpacing: 0.2,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
    }}>
      <span className="dot" style={{ background: m.color, width: 5, height: 5 }} />
      {m.name.toLowerCase()}
    </span>
  );
}

export function IntegrationMark({ id = 'google', size = 22, connected = true }) {
  const m = SRC_META[id] || SRC_META.manual;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 99,
      background: connected ? m.bg : 'var(--inset)',
      color: connected ? m.color : 'var(--faint)',
      border: `1px solid ${connected ? m.color : 'var(--hair-2)'}`,
      fontFamily: 'var(--font-mono)',
      fontSize: Math.round(size * 0.5),
      fontWeight: 600,
      lineHeight: 1,
      opacity: connected ? 1 : 0.7,
    }}>
      {(SRC_META[id]?.name || id).charAt(0).toUpperCase()}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    'done':       { bg: 'var(--inset)',     bd: 'var(--hair-2)', fg: 'var(--mute)',    label: 'done'     },
    'in-flight':  { bg: 'var(--accent-bg)', bd: 'var(--accent)', fg: 'var(--accent)',  label: 'in flight'},
    'next':       { bg: 'var(--panel)',     bd: 'var(--hair-2)', fg: 'var(--ink-3)',   label: 'next'     },
    'target':     { bg: 'var(--success-bg)',bd: 'var(--success)',fg: 'var(--success)', label: 'target'   },
    'stale':      { bg: 'var(--soft)',      bd: 'var(--hair-3)', fg: 'var(--mute)',    label: 'stale'    },
  };
  const m = map[status] || map['next'];
  return (
    <span className="mono" style={{
      display: 'inline-block',
      fontSize: 10, lineHeight: 1,
      padding: '4px 8px', borderRadius: 99,
      background: m.bg, border: `1px solid ${m.bd}`, color: m.fg,
      textTransform: 'lowercase', letterSpacing: 0.3,
    }}>{m.label}</span>
  );
}

export function CascadePips({ values = [30, 15, 10, 5, 2], firedThrough = 0, compact, label = true, editable, onEdit }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label && <span className="smcaps" style={{ fontSize: 9.5 }}>cascade</span>}
      <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        {values.map((v, i) => {
          const fired = i < firedThrough;
          return (
            <span key={v} title={`T−${v}m`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px 2px 4px',
              borderRadius: 99,
              border: `1px solid ${fired ? 'var(--accent)' : 'var(--hair-2)'}`,
              background: fired ? 'var(--accent-bg)' : 'var(--panel)',
              cursor: editable ? 'pointer' : 'default',
            }}>
              <span style={{
                width: compact ? 5 : 6, height: compact ? 5 : 6, borderRadius: 99,
                background: fired ? 'var(--accent)' : 'transparent',
                border: `1px solid ${fired ? 'var(--accent)' : 'var(--hair-3)'}`,
              }} />
              <span className="mono" style={{ fontSize: 9.5, color: fired ? 'var(--accent)' : 'var(--ink-3)' }}>
                {v}m
              </span>
            </span>
          );
        })}
        {editable && (
          <button className="btn sm ghost" onClick={onEdit} style={{ padding: '1px 6px', fontSize: 10, color: 'var(--mute)' }}>
            edit
          </button>
        )}
      </div>
    </div>
  );
}

export function EventCard({ event, geometry, current, past, conflictHalf, compact, onClick }) {
  const m = SRC_META[event.src] || SRC_META.manual;
  const proto = event.protectedBlock;
  const conflict = conflictHalf != null;
  const showCascade = !!event.important && !current;

  const bgImage = proto ? 'var(--hatch-protected)' : (conflict ? 'var(--hatch-conflict)' : 'none');
  const left  = conflictHalf === 'left'  ? 8 : (conflictHalf === 'right' ? '50%' : 8);
  const right = conflictHalf === 'left'  ? '50%' : 8;

  return (
    <div onClick={onClick} style={{
      position: 'absolute',
      top: geometry.top, height: geometry.height,
      left, right,
      marginLeft: conflictHalf === 'right' ? 1 : 0,
      marginRight: conflictHalf === 'left' ? 1 : 0,
      background: 'var(--panel)',
      backgroundImage: bgImage,
      backgroundColor: past ? 'var(--soft)' : 'var(--panel)',
      borderLeft: `3px solid ${m.color}`,
      border: '1px solid var(--hair)',
      borderLeftWidth: 3, borderLeftColor: m.color,
      borderRadius: 6,
      padding: compact ? '5px 8px' : '7px 10px',
      display: 'flex', flexDirection: 'column', gap: 2,
      opacity: past ? 0.75 : 1,
      cursor: onClick ? 'pointer' : 'default',
      overflow: 'hidden',
      boxShadow: current ? '0 0 0 2px rgba(192,119,44,0.18)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: compact ? 11.5 : 12.5, fontWeight: 500,
          color: 'var(--ink)', lineHeight: 1.25,
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{event.title}</span>
        {event.important && <ImportantStar />}
        {proto && !compact && <SmallTag>protected</SmallTag>}
        {conflict && !compact && <SmallTag danger>conflict</SmallTag>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mute)' }}>
        <SourceBadge src={event.src} size="xs" />
        <span className="mono" style={{ fontSize: 10 }}>{fmtRange(event.start, event.end)}</span>
      </div>
      {!compact && event.location && (
        <div className="mono" style={{ fontSize: 9.5, color: 'var(--faint)', marginTop: 1 }}>
          {event.location}
        </div>
      )}
      {showCascade && !compact && (
        <div style={{ marginTop: 4 }}>
          <CascadePips firedThrough={0} compact label={false} />
        </div>
      )}
    </div>
  );
}

export function fmtRange(s, e) {
  const f = (d) => {
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'p' : 'a';
    const hh = ((h + 11) % 12) + 1;
    return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2,'0')}${ampm}`;
  };
  return `${f(s)} – ${f(e)}`;
}

export function ImportantStar() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 14, height: 14, borderRadius: 3,
      background: 'var(--accent)', color: '#fff',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, lineHeight: 1,
    }}>!</span>
  );
}

export function SmallTag({ children, danger }) {
  return (
    <span className="mono" style={{
      fontSize: 9, lineHeight: 1,
      padding: '2px 5px', borderRadius: 3,
      border: `1px solid ${danger ? 'var(--conflict)' : 'var(--hair-2)'}`,
      color: danger ? 'var(--conflict)' : 'var(--mute)',
      textTransform: 'lowercase', letterSpacing: 0.3,
    }}>{children}</span>
  );
}

export function HourLines({ count, hPerHr }) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(<div key={i} style={{ position: 'absolute', top: i * hPerHr, left: 0, right: 0, height: 1, background: 'var(--hair)' }} />);
  }
  return <>{out}</>;
}

export function NowLine({ top, label = '' }) {
  return (
    <div style={{ position: 'absolute', top, left: -56, right: 0, pointerEvents: 'none', zIndex: 4 }}>
      <span className="mono" style={{
        position: 'absolute', top: -7, left: 4,
        fontSize: 9.5, fontWeight: 600, color: 'var(--conflict)',
        background: 'var(--bg)', padding: '0 4px',
      }}>{label}</span>
      <div style={{ position: 'absolute', top: -3.5, left: 46, width: 7, height: 7, borderRadius: 99, background: 'var(--conflict)' }} />
      <div style={{ position: 'absolute', top: 0, left: 52, right: 0, height: 1, background: 'var(--conflict)' }} />
    </div>
  );
}

export function fmtHour(h) {
  const ampm = h >= 12 ? 'p' : 'a';
  return `${((h + 11) % 12) + 1} ${ampm}`;
}

export function QuickAdd({ placeholder = 'Add a thing — “Submit churn writeup at 4p”' }) {
  const [val, setVal] = React.useState('');
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px',
      background: 'var(--panel)',
      border: '1px solid var(--hair-2)',
      borderRadius: 8,
      flex: 1,
      cursor: 'text',
    }}>
      <span className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>＋</span>
      <input
        value={val} onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 0, outline: 0, background: 'transparent',
          fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)',
        }}
      />
      <span className="mono" style={{
        fontSize: 9.5, color: 'var(--faint)',
        border: '1px solid var(--hair-2)', borderRadius: 3, padding: '1px 5px',
      }}>↵</span>
    </label>
  );
}

export function StaleStrip({ items = STALE, onClearAll, onKeep }) {
  return (
    <div style={{
      borderTop: '1px solid var(--hair)',
      background: 'var(--soft)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div className="smcaps">Stale · {items.length}</div>
      <div style={{ display: 'flex', gap: 8, flex: 1, overflowX: 'auto', minWidth: 0 }} className="scroll">
        {items.map((it) => (
          <div key={it.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            border: '1px dashed var(--hair-3)',
            borderRadius: 99,
            background: 'var(--panel)',
            fontSize: 11.5, color: 'var(--ink-3)',
            whiteSpace: 'nowrap', flex: '0 0 auto',
          }}>
            <SourceBadge src={it.src} dotOnly />
            <span>{it.title}</span>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--mute)' }}>{it.age}d</span>
            <button className="btn sm ghost" style={{ padding: 0, fontSize: 10, color: 'var(--faint)' }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm" onClick={onKeep}>Keep all</button>
        <button className="btn sm primary" onClick={onClearAll}>Clear all</button>
      </div>
    </div>
  );
}

export function SectionLabel({ children, right, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span className="smcaps">{children}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
      {right}
    </div>
  );
}

export function ToggleSwitch({ defaultChecked, onChange }) {
  const [on, setOn] = React.useState(!!defaultChecked);
  return (
    <button onClick={() => { setOn(!on); onChange && onChange(!on); }} style={{
      width: 34, height: 20, padding: 2,
      background: on ? 'var(--accent)' : 'var(--hair-2)',
      border: 0, borderRadius: 99,
      display: 'inline-flex', alignItems: 'center',
      cursor: 'pointer',
      transition: 'background 120ms ease',
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: 99,
        background: '#fff',
        transform: on ? 'translateX(14px)' : 'translateX(0px)',
        transition: 'transform 120ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
