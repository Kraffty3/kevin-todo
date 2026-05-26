// Connections panel — slide-in panel showing the 3 integrations and
// their real connection state.
//   - Google: real OAuth via auth.login() / auth.logout()
//   - Apple / Outlook: not implemented yet, shown as "coming later"
import React from 'react';
import { INTEGRATIONS, SRC_META } from '../data.js';
import { IntegrationMark } from './Shared.jsx';

const AVAILABLE = new Set(['google']);

export function ConnectionsPanel({ open, auth, onClose }) {
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
            Connect any combination. Today's timeline shows events from every connected source. Apple and Outlook are coming later — for now, Google is the only real option.
          </p>

          {INTEGRATIONS.map((it) => (
            <IntegrationCard key={it.id} integration={it} auth={auth} />
          ))}

          {!auth.configured && (
            <div style={{
              padding: '12px 14px',
              border: '1px dashed var(--conflict)',
              borderRadius: 8,
              background: 'var(--conflict-bg)',
            }}>
              <div className="smcaps" style={{ marginBottom: 6, color: 'var(--conflict)' }}>Not configured</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                VITE_GOOGLE_CLIENT_ID env var is missing. Set it locally in .env.local and on Vercel.
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid var(--hair)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--panel)',
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
            {auth.signedIn ? '1 of 1 available connected' : '0 of 1 available connected'}
          </span>
          <div style={{ flex: 1 }} />
          <button className="btn primary sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}

export function IntegrationCard({ integration, auth }) {
  const m = SRC_META[integration.id];
  const isAvailable = AVAILABLE.has(integration.id);
  const isGoogle = integration.id === 'google';
  const connected = isGoogle && auth.signedIn;

  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--panel)',
      border: '1px solid var(--hair)',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: isAvailable ? 1 : 0.6,
    }}>
      <IntegrationMark id={integration.id} size={36} connected={connected} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{integration.name}</span>
          {!isAvailable && (
            <span className="mono" style={{
              fontSize: 9.5, padding: '2px 6px',
              borderRadius: 99,
              background: 'var(--soft)', color: 'var(--mute)',
              border: '1px solid var(--hair-2)',
            }}>coming later</span>
          )}
          {isAvailable && connected && (
            <span className="mono" style={{
              fontSize: 9.5, padding: '2px 6px',
              borderRadius: 99,
              background: 'var(--success-bg)', color: 'var(--success)',
              border: '1px solid var(--success)',
            }}>● connected</span>
          )}
          {isAvailable && !connected && (
            <span className="mono" style={{
              fontSize: 9.5, padding: '2px 6px',
              borderRadius: 99,
              background: 'var(--soft)', color: 'var(--mute)',
              border: '1px solid var(--hair-2)',
            }}>not connected</span>
          )}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', marginTop: 4 }}>
          {!isAvailable && 'Native sync not built yet'}
          {isAvailable && connected && (auth.user?.email || 'Connected to Google Calendar')}
          {isAvailable && !connected && 'Read-only access to your events'}
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
      {isAvailable && (
        <button
          className={connected ? 'btn sm' : 'btn sm primary'}
          onClick={() => (connected ? auth.logout() : auth.login())}
          disabled={!auth.configured}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </button>
      )}
      {!isAvailable && (
        <button className="btn sm" disabled style={{ cursor: 'not-allowed', opacity: 0.5 }}>
          Connect
        </button>
      )}
    </div>
  );
}
