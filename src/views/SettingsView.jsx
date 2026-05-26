// Settings view — cascade defaults + sub-timer rules + calendar connections.
// Replaces the previous Timers tab; per-event timers now live on the event itself.
import React from 'react';
import { INTEGRATIONS } from '../data.js';
import { ToggleSwitch } from '../components/Shared.jsx';
import { IntegrationCard } from '../components/ConnectionsPanel.jsx';
import { fireTestNotification, getNotificationPermission, requestNotificationPermission } from '../lib/timers.js';

export function SettingsView({ defaults, onDefaults, auth }) {
  const [addVal, setAddVal] = React.useState('');

  const addStep = () => {
    const v = parseInt(addVal, 10);
    if (!v || v < 1) return;
    const next = [...defaults.values, v].sort((a, b) => b - a);
    onDefaults({ ...defaults, values: next });
    setAddVal('');
  };
  const removeStep = (v) => {
    onDefaults({ ...defaults, values: defaults.values.filter((x) => x !== v) });
  };

  return (
    <div className="scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--hair)' }}>
        <div className="smcaps">Settings</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, marginTop: 4 }}>Timer settings</div>
        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 6, maxWidth: 620, lineHeight: 1.55 }}>
          Per-event timers open automatically when you click an event on Today. These are the defaults applied to every important event — and the rules for the in-event sub-timers.
        </div>
      </div>

      <SettingsSection
        title="Cascade · before event"
        sub="Pings leading up to the event start. Applies to anything marked important."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {defaults.values.map((v) => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 6px 5px 12px',
              background: 'var(--accent-bg)', border: '1px solid var(--accent)',
              borderRadius: 99, color: 'var(--accent)',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 500,
            }}>
              T−{v}m
              <button onClick={() => removeStep(v)} style={{
                width: 18, height: 18, border: 0, background: 'transparent',
                color: 'var(--accent)', cursor: 'pointer', padding: 0,
                fontSize: 14, lineHeight: 1, borderRadius: 99,
              }}>×</button>
            </span>
          ))}
          <input
            type="number" min={1} max={120}
            placeholder="add min"
            value={addVal} onChange={(e) => setAddVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addStep(); }}
            style={{
              width: 84, padding: '5px 10px',
              border: '1px dashed var(--hair-3)',
              borderRadius: 99,
              background: 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-2)',
              outline: 'none',
            }}
          />
          <button className="btn sm" onClick={addStep}>＋ Add step</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>preset:</span>
          {[
            { name: 'gentle',     vals: [15, 5] },
            { name: 'standard',   vals: [30, 15, 10, 5, 2] },
            { name: 'aggressive', vals: [45, 30, 20, 15, 10, 5, 2, 1] },
          ].map(p => (
            <button key={p.name} onClick={() => onDefaults({ ...defaults, values: p.vals })}
              className="mono" style={{
                fontSize: 10.5, padding: '4px 9px',
                border: '1px solid var(--hair-2)', borderRadius: 99,
                background: 'var(--panel)', color: 'var(--ink-3)', cursor: 'pointer',
              }}>{p.name}</button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sub-timers · during event"
        sub="Pacing checkpoints generated for every event of a given duration."
      >
        <SettingsRow label="Checkpoint cadence">
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>every</span>
          <select defaultValue="15" style={selectStyle()}>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>minutes through the event</span>
        </SettingsRow>
        <SettingsRow label="Wrap warning">
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>fire</span>
          <select defaultValue="5" style={selectStyle()}>
            <option value="0">off</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>minutes before end</span>
        </SettingsRow>
        <SettingsRow label="End marker">
          <ToggleSwitch defaultChecked />
          <span className="mono" style={{ fontSize: 12, color: 'var(--mute)' }}>tick a row when the event ends</span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Delivery"
        sub="Notifications fire while this tab is open. Closed-tab delivery would need a service worker — out of scope for now."
      >
        <NotificationControls />
      </SettingsSection>

      <SettingsSection
        title="Calendar connections"
        sub="Connect Google Calendar to load real events. Apple and Outlook are coming later."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {INTEGRATIONS.map((it) => (
            <IntegrationCard key={it.id} integration={it} auth={auth} />
          ))}
        </div>
      </SettingsSection>

      <div style={{ height: 40 }} />
    </div>
  );
}

function NotificationControls() {
  const [permission, setPermission] = React.useState(getNotificationPermission());

  const request = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const labelByState = {
    granted: 'Enabled',
    denied: 'Blocked in browser settings',
    default: 'Not enabled yet',
    unsupported: 'Not supported by this browser',
  };
  const colorByState = {
    granted: 'var(--success)',
    denied: 'var(--conflict)',
    default: 'var(--mute)',
    unsupported: 'var(--faint)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SettingsRow label="Browser notifications">
        <span className="mono" style={{ fontSize: 12, color: colorByState[permission], fontWeight: 600 }}>
          {labelByState[permission]}
        </span>
        {permission === 'default' && (
          <button className="btn sm primary" onClick={request}>Enable</button>
        )}
        {permission === 'granted' && (
          <button className="btn sm" onClick={fireTestNotification}>Send test notification</button>
        )}
      </SettingsRow>
      {permission === 'denied' && (
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', lineHeight: 1.5 }}>
          You blocked notifications. Re-enable in your browser's site settings for this domain.
        </div>
      )}
    </div>
  );
}

function SettingsSection({ title, sub, children }) {
  return (
    <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--hair)' }}>
      <div style={{ marginBottom: 14, maxWidth: 620 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0',
      borderTop: '1px dashed var(--hair)',
    }}>
      <span style={{ flex: '0 0 200px', fontSize: 12.5, color: 'var(--ink-2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

function selectStyle() {
  return {
    fontFamily: 'inherit',
    fontSize: 12, padding: '4px 8px',
    border: '1px solid var(--hair-2)',
    borderRadius: 6,
    background: 'var(--panel)',
    color: 'var(--ink-2)',
  };
}
