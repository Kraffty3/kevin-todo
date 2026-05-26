// Connections panel — slide-in panel showing the 3 integrations and
// their connection state. Any/all combination is valid.
import React from 'react';
import { INTEGRATIONS, SRC_META } from '../data.js';
import { IntegrationMark } from './Shared.jsx';

export function ConnectionsPanel({ open, connected, onToggle, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,19,15,0.18)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 160ms ease',
        zIndex: 60,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420,
        background: 'var(--bg)',
        borderLeft: '1px solid var(--hair-2)',
        transform: open ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 220ms cubic-bezier(.2,.7,.2,1)',
        zIndex: 70,
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-pop)',
      }}>
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--hair)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div className="smcaps">Connections</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>Calendar sources</div>
          </div>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{
            margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55,
          }}>
            Connect any combination of the three. The unified Today timeline merges every connected source. Each service gets a color used everywhere in the app.
          </p>

          {INTEGRATIONS.map((it) => (
            <IntegrationCard
              key={it.id}
              integration={it}
              connected={!!connected[it.id]}
              onToggle={() => onToggle(it.id)}
            />
          ))}

          <div style={{
            padding: '12px 14px',
            border: '1px dashed var(--hair-2)',
            borderRadius: 8,
            background: 'transparent',
          }}>
            <div className="smcaps" style={{ marginBottom: 6 }}>Future</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              All sources read through a single ImportSource interface. Swapping the mock for a real OAuth feed is a one-file change — the rest of the app doesn’t care.
            </div>
          </div>
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid var(--hair)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--panel)',
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
            {Object.values(connected).filter(Boolean).length} of 3 connected
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn primary sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}

export function IntegrationCard({ integration, connected, onToggle }) {
  const m = SRC_META[integration.id];
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--panel)',
      border: '1px solid var(--hair)',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: connected ? 1 : 0.85,
    }}>
      <IntegrationMark id={integration.id} size={36} connected={connected} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{integration.name}</span>
          {connected ? (
            <span className="mono" style={{
              fontSize: 9.5, padding: '2px 6px',
              borderRadius: 99,
              background: 'var(--success-bg)', color: 'var(--success)',
              border: '1px solid var(--success)',
            }}>● connected</span>
          ) : (
            <span className="mono" style={{
              fontSize: 9.5, padding: '2px 6px',
              borderRadius: 99,
              background: 'var(--soft)', color: 'var(--mute)',
              border: '1px solid var(--hair-2)',
            }}>not connected</span>
          )}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', marginTop: 4 }}>
          {connected ? `${integration.account} · synced 2m ago` : `Sign in with ${integration.name.split(' ')[0]}`}
        </div>
        {connected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>color</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '1px 8px', borderRadius: 99,
              background: m.bg, color: m.color,
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
            }}>
              <span className="dot" style={{ background: m.color, width: 6, height: 6 }} />
              {m.name.toLowerCase()}
            </span>
          </div>
        )}
      </div>
      <button className="btn sm" onClick={onToggle}>
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
