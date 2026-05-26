// App shell — top bar, left nav, view router, real Google Calendar wiring.
import React from 'react';
import { INTEGRATIONS, PROJECTS } from './data.js';
import { IntegrationMark, SourceBadge } from './components/Shared.jsx';
import { TodayView } from './views/TodayView.jsx';
import { ProjectsView } from './views/ProjectsView.jsx';
import { SettingsView } from './views/SettingsView.jsx';
import { EventTimerPanel } from './components/EventTimerPanel.jsx';
import { ConnectionsPanel } from './components/ConnectionsPanel.jsx';
import { useAuth } from './lib/auth.js';
import { useGoogleCalendar, buildDateLabels } from './lib/calendar.js';
import { useLocalEvents } from './lib/quickAdd.js';

const DEFAULT_ACCENT = '#c0772c';

function fmtClock(d) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
const SHORT_WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function App() {
  const [view, setView] = React.useState('today');
  const [todayView, setTodayView] = React.useState('day');
  const [connectionsOpen, setConnectionsOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState(null);
  const [cascadeDefaults, setCascadeDefaults] = React.useState({ values: [30, 15, 10, 5, 2] });
  const [dayOffset, setDayOffset] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  const auth = useAuth();
  const local = useLocalEvents();

  // Refresh "now" every 30 s so the timeline / timer update without reloads
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT);
  }, []);

  const now = new Date();
  const centerDate = React.useMemo(() => {
    const d = startOfDay(now);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset, tick, now.getDate()]);

  const cal = useGoogleCalendar(auth.token, centerDate);
  const { days, dateHeader } = buildDateLabels(centerDate);

  // Merge local quick-add events with Google events for the visible day
  const dayStart = startOfDay(centerDate);
  const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
  const localToday = local.events.filter((e) => e.start >= dayStart && e.start <= dayEnd);

  const events = [...cal.today, ...localToday];

  const weekEvents = React.useMemo(() => {
    const merged = { ...cal.week };
    for (const e of local.events) {
      const d = e.start.getDate();
      merged[d] = [...(merged[d] || []), e];
    }
    return merged;
  }, [cal.week, local.events]);

  const nextUp = events
    .filter((e) => e.important && e.start.getTime() > now.getTime())
    .sort((a, b) => a.start - b.start)[0];

  const selectedEvent = selectedEventId
    ? [...events, ...Object.values(weekEvents).flat()].find((e) => e.id === selectedEventId)
    : null;

  const shiftDay = (delta) => setDayOffset((o) => o + delta);
  const resetDay = () => setDayOffset(0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar
        nextUp={nextUp}
        now={now}
        auth={auth}
        onOpenConnections={() => setConnectionsOpen(true)}
        onSelectEvent={setSelectedEventId}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftNav
          view={view}
          onView={setView}
          auth={auth}
          onOpenConnections={() => setConnectionsOpen(true)}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          {view === 'today' && !auth.signedIn && local.events.length === 0 && (
            <EmptyConnect onConnect={auth.login} configured={auth.configured} />
          )}
          {view === 'today' && (auth.signedIn || local.events.length > 0) && (
            <TodayView
              events={events}
              weekEvents={weekEvents}
              view={todayView}
              onView={setTodayView}
              onSelectEvent={setSelectedEventId}
              now={now}
              days={days}
              dateHeader={dateHeader}
              dayOffset={dayOffset}
              onShiftDay={shiftDay}
              onResetDay={resetDay}
              loading={cal.loading}
              error={cal.error}
              auth={auth}
              onAddLocal={local.addEvent}
            />
          )}
          {view === 'projects' && (
            <ProjectsView projects={PROJECTS} connected={{ google: auth.signedIn }} />
          )}
          {view === 'settings' && (
            <SettingsView
              defaults={cascadeDefaults}
              onDefaults={setCascadeDefaults}
              auth={auth}
            />
          )}
        </main>
      </div>

      {selectedEvent && (
        <EventTimerPanel
          event={selectedEvent}
          defaults={cascadeDefaults}
          now={now}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      <ConnectionsPanel
        open={connectionsOpen}
        auth={auth}
        onClose={() => setConnectionsOpen(false)}
      />
    </div>
  );
}

function EmptyConnect({ onConnect, configured }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: 40,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 99,
        background: 'var(--soft)',
        border: '1px solid var(--hair-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IntegrationMark id="google" size={32} connected={false} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Connect Google Calendar</div>
        <div style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.5 }}>
          Sign in to load your real events. The app reads your primary calendar in read-only mode — nothing is written back yet.
        </div>
      </div>
      <button
        className="btn primary"
        onClick={onConnect}
        disabled={!configured}
        style={{ padding: '10px 18px', fontSize: 13 }}
      >
        Sign in with Google
      </button>
      {!configured && (
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--conflict)' }}>
          VITE_GOOGLE_CLIENT_ID is not set
        </div>
      )}
    </div>
  );
}

function TopBar({ nextUp, now, auth, onOpenConnections, onSelectEvent }) {
  const connectedCount = auth.signedIn ? 1 : 0;
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
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>Done</span>
        {auth.user?.email && (
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', marginLeft: 4 }}>
            · {auth.user.email}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <NextUpStrip event={nextUp} now={now} onSelectEvent={onSelectEvent} />
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
          {INTEGRATIONS.map((it, i) => {
            const isConnected = it.id === 'google' && auth.signedIn;
            return (
              <span key={it.id} style={{
                marginLeft: i === 0 ? 0 : -6,
                position: 'relative',
                zIndex: INTEGRATIONS.length - i,
                filter: isConnected ? 'none' : 'grayscale(1)',
                opacity: isConnected ? 1 : 0.55,
              }}>
                <IntegrationMark id={it.id} size={22} connected={isConnected} />
              </span>
            );
          })}
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
          {connectedCount}/1 connected
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
          {fmtClock(now)} · {SHORT_WEEKDAY[now.getDay()]}
        </span>
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

function NextUpStrip({ event, now, onSelectEvent }) {
  if (!event) {
    return (
      <div style={{
        padding: '6px 14px',
        background: 'var(--soft)',
        border: '1px solid var(--hair)',
        borderRadius: 99,
        fontSize: 12, color: 'var(--mute)',
      }}>
        No important items queued
      </div>
    );
  }
  const minsUntil = Math.round((event.start.getTime() - now.getTime()) / 60000);
  return (
    <button onClick={() => onSelectEvent && onSelectEvent(event.id)} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '4px 12px',
      background: 'var(--accent-bg)',
      border: '1px solid var(--accent)',
      borderRadius: 99,
      maxWidth: 460, minWidth: 0,
      whiteSpace: 'nowrap', overflow: 'hidden',
      cursor: 'pointer', fontFamily: 'inherit',
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
    </button>
  );
}

function LeftNav({ view, onView, auth, onOpenConnections }) {
  const items = [
    { id: 'today', label: 'Today', icon: <NavIconToday /> },
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
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--hair)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="smcaps">Sources</span>
          <span className="mono" style={{
            marginLeft: 'auto', fontSize: 9.5, color: 'var(--mute)',
          }}>{auth.signedIn ? '1' : '0'}/1</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {INTEGRATIONS.map((it) => {
            const isConnected = it.id === 'google' && auth.signedIn;
            const available = it.id === 'google';
            return (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11.5,
                color: isConnected ? 'var(--ink-3)' : 'var(--faint)',
                opacity: available ? 1 : 0.6,
              }}>
                <IntegrationMark id={it.id} size={16} connected={isConnected} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.name}
                  {!available && (
                    <span className="mono" style={{ fontSize: 9, color: 'var(--faint)', marginLeft: 4 }}>
                      (soon)
                    </span>
                  )}
                </span>
                <span className="dot" style={{
                  background: isConnected ? 'var(--success)' : 'var(--hair-2)',
                  width: 6, height: 6,
                }} />
              </div>
            );
          })}
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
          <span className="mono" style={{ fontSize: 12, lineHeight: 1 }}>⚙</span>
          Manage connections
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
