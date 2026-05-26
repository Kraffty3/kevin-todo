// App shell — top bar, left nav, view router.
import React from 'react';
import {
  DEMO_NOW, fmtClock, INTEGRATIONS, SRC_META,
  TODAY_EVENTS, WEEK_EVENTS, PROJECTS,
} from './data.js';
import { IntegrationMark, SourceBadge } from './components/Shared.jsx';
import { TodayView } from './views/TodayView.jsx';
import { ProjectsView } from './views/ProjectsView.jsx';
import { SettingsView } from './views/SettingsView.jsx';
import { EventTimerPanel } from './components/EventTimerPanel.jsx';
import { ConnectionsPanel } from './components/ConnectionsPanel.jsx';

const DEFAULT_ACCENT = '#c0772c';

export default function App() {
  const [view, setView] = React.useState('today');
  const [todayView, setTodayView] = React.useState('day');
  const [connectionsOpen, setConnectionsOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState(null);
  const [cascadeDefaults, setCascadeDefaults] = React.useState({ values: [30, 15, 10, 5, 2] });
  const [connected, setConnected] = React.useState({ google: true, apple: true, outlook: true });

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT);
  }, []);

  const visibleEvents = TODAY_EVENTS.filter(
    (e) => e.src === 'manual' || connected[e.src]
  );
  const visibleWeek = Object.fromEntries(
    Object.entries(WEEK_EVENTS).map(([k, list]) => [
      k, list.filter((e) => e.src === 'manual' || connected[e.src]),
    ])
  );

  const nextUp = visibleEvents
    .filter((e) => e.important && e.start.getTime() > DEMO_NOW.getTime())
    .sort((a, b) => a.start - b.start)[0];

  const selectedEvent = selectedEventId
    ? [...visibleEvents, ...Object.values(visibleWeek).flat()].find((e) => e.id === selectedEventId)
    : null;

  const toggleConnection = (id) => setConnected((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar
        nextUp={nextUp}
        connected={connected}
        onOpenConnections={() => setConnectionsOpen(true)}
        onSelectEvent={setSelectedEventId}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftNav
          view={view}
          onView={setView}
          connected={connected}
          onOpenConnections={() => setConnectionsOpen(true)}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          {view === 'today' && (
            <TodayView
              events={visibleEvents}
              weekEvents={visibleWeek}
              view={todayView}
              onView={setTodayView}
              onSelectEvent={setSelectedEventId}
            />
          )}
          {view === 'projects' && (
            <ProjectsView projects={PROJECTS} connected={connected} />
          )}
          {view === 'settings' && (
            <SettingsView
              defaults={cascadeDefaults}
              onDefaults={setCascadeDefaults}
              connected={connected}
              onToggleConnection={toggleConnection}
            />
          )}
        </main>
      </div>

      {selectedEvent && (
        <EventTimerPanel
          event={selectedEvent}
          defaults={cascadeDefaults}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      <ConnectionsPanel
        open={connectionsOpen}
        connected={connected}
        onToggle={toggleConnection}
        onClose={() => setConnectionsOpen(false)}
      />
    </div>
  );
}

function TopBar({ nextUp, connected, onOpenConnections, onSelectEvent }) {
  const connectedCount = Object.values(connected).filter(Boolean).length;
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '10px 18px',
      background: 'var(--panel)',
      borderBottom: '1px solid var(--hair-2)',
      height: 56, boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandMark />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>todo</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', marginLeft: 4 }}>· Kevin Ko</span>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <NextUpStrip event={nextUp} onSelectEvent={onSelectEvent} />
      </div>

      <button onClick={onOpenConnections} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 8px 5px 10px',
        background: 'var(--soft)',
        border: '1px solid var(--hair-2)',
        borderRadius: 99,
        cursor: 'pointer',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {INTEGRATIONS.map((it, i) => (
            <span key={it.id} style={{ marginLeft: i === 0 ? 0 : -6, position: 'relative', zIndex: INTEGRATIONS.length - i, filter: connected[it.id] ? 'none' : 'grayscale(1)' }}>
              <IntegrationMark id={it.id} size={22} connected={connected[it.id]} />
            </span>
          ))}
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
          {connectedCount}/3 connected
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{fmtClock()} · Tue</span>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 7,
      background: 'var(--ink)', color: '#fff',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', inset: 6,
        borderRadius: 2,
        background: 'transparent',
        border: '1.5px solid #fff',
        borderTopLeftRadius: 99,
        borderBottomRightRadius: 99,
      }} />
    </span>
  );
}

function NextUpStrip({ event, onSelectEvent }) {
  if (!event) {
    return (
      <div style={{
        padding: '6px 14px',
        background: 'var(--soft)',
        border: '1px solid var(--hair)',
        borderRadius: 99,
        fontSize: 12, color: 'var(--mute)',
      }}>
        No important items queued today
      </div>
    );
  }
  const minsUntil = Math.round((event.start.getTime() - DEMO_NOW.getTime()) / 60000);

  return (
    <button onClick={() => onSelectEvent && onSelectEvent(event.id)} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '4px 12px 4px 12px',
      background: 'var(--accent-bg)',
      border: '1px solid var(--accent)',
      borderRadius: 99,
      maxWidth: 460,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}>
      <span className="smcaps" style={{ color: 'var(--accent)', fontSize: 9.5, flex: '0 0 auto' }}>Next up</span>
      <span style={{
        fontSize: 13, fontWeight: 500, color: 'var(--ink)',
        minWidth: 0, flex: '0 1 auto',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{event.title}</span>
      <SourceBadge src={event.src} size="xs" />
      <span style={{ width: 1, height: 16, background: 'var(--hair-2)', flex: '0 0 auto' }} />
      <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', flex: '0 0 auto' }}>
        {minsUntil}m
      </span>
      <span className="mono" style={{
        fontSize: 9.5, color: 'var(--accent)', flex: '0 0 auto',
        opacity: 0.8, letterSpacing: 0.3,
      }}>· T−30 fired</span>
    </button>
  );
}

function LeftNav({ view, onView, connected, onOpenConnections }) {
  const items = [
    { id: 'today',    label: 'Today',    icon: <NavIconToday /> },
    { id: 'projects', label: 'Projects', icon: <NavIconProjects /> },
    { id: 'settings', label: 'Settings', icon: <NavIconSettings /> },
  ];
  return (
    <nav style={{
      width: 200, flex: '0 0 200px',
      background: 'var(--panel)',
      borderRight: '1px solid var(--hair-2)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 0',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 10px' }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => onView(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px',
            border: 0, borderRadius: 6,
            background: view === it.id ? 'var(--soft)' : 'transparent',
            color: view === it.id ? 'var(--ink)' : 'var(--ink-3)',
            cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: view === it.id ? 600 : 500,
            textAlign: 'left',
          }}>
            <span style={{ color: view === it.id ? 'var(--ink)' : 'var(--mute)' }}>{it.icon}</span>
            {it.label}
            {it.id === 'today' && <span className="mono" style={{
              marginLeft: 'auto', fontSize: 10,
              color: 'var(--mute)',
              padding: '2px 6px',
              background: view === it.id ? 'var(--panel)' : 'var(--soft)',
              borderRadius: 99,
              border: '1px solid var(--hair-2)',
            }}>7</span>}
            {it.id === 'projects' && <span className="mono" style={{
              marginLeft: 'auto', fontSize: 10,
              color: 'var(--mute)',
              padding: '2px 6px',
              background: view === it.id ? 'var(--panel)' : 'var(--soft)',
              borderRadius: 99,
              border: '1px solid var(--hair-2)',
            }}>4</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--hair)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="smcaps">Sources</span>
          <span className="mono" style={{
            marginLeft: 'auto', fontSize: 9.5, color: 'var(--mute)',
          }}>{Object.values(connected).filter(Boolean).length}/3</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {INTEGRATIONS.map((it) => (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11.5,
              color: connected[it.id] ? 'var(--ink-3)' : 'var(--faint)',
            }}>
              <IntegrationMark id={it.id} size={16} connected={connected[it.id]} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.name}
              </span>
              <span className="dot" style={{
                background: connected[it.id] ? 'var(--success)' : 'var(--hair-2)',
                width: 6, height: 6,
              }} />
            </div>
          ))}
        </div>
        <button onClick={onOpenConnections} style={{
          marginTop: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '7px 10px',
          background: 'var(--panel)',
          border: '1px dashed var(--hair-3)',
          borderRadius: 6,
          color: 'var(--ink-2)',
          fontFamily: 'inherit', fontSize: 11.5, fontWeight: 500,
          cursor: 'pointer',
        }}>
          <span className="mono" style={{ fontSize: 12, lineHeight: 1 }}>＋</span>
          Connect calendar
        </button>
      </div>
    </nav>
  );
}

function NavIconToday() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function NavIconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function NavIconProjects() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="6.75" width="9" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10.5" width="6" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
