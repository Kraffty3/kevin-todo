// Quick-add input with chrono-node parsing.
// Shows a live preview chip with the parsed time and an optional
// "also push to Google Calendar" toggle.
import React from 'react';
import { parseQuickAdd, pushToGoogleCalendar } from '../lib/quickAdd.js';
import { SourceBadge, ImportantStar } from './Shared.jsx';

function fmtPreviewTime(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);

  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dDay.getTime() === today.getTime()) return `today, ${time}`;
  if (dDay.getTime() === tomorrow.getTime()) return `tomorrow, ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
}

export function QuickAddInput({ auth, onAddLocal, placeholder = 'Add a thing — "Submit churn writeup at 4p"' }) {
  const [val, setVal] = React.useState('');
  const [pushToGoogle, setPushToGoogle] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const parsed = React.useMemo(() => parseQuickAdd(val), [val]);

  const canPushGoogle = auth?.signedIn && pushToGoogle;
  const canSubmit = !!parsed && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErrorMsg('');

    try {
      // Always add locally so it shows immediately on the timeline
      onAddLocal && onAddLocal(parsed);

      if (canPushGoogle) {
        await pushToGoogleCalendar(auth.token, parsed);
      }

      setVal('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        background: 'var(--panel)',
        border: '1px solid var(--hair-2)',
        borderRadius: 8,
        cursor: 'text',
      }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>＋</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={placeholder}
          disabled={busy}
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)',
          }}
        />
        {parsed && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 8px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: 99,
            fontSize: 10.5, color: 'var(--accent)',
            whiteSpace: 'nowrap',
          }}>
            {parsed.important && <ImportantStar />}
            <span className="mono">{fmtPreviewTime(parsed.start)}</span>
          </span>
        )}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="btn sm primary"
          style={{ opacity: canSubmit ? 1 : 0.4 }}
        >
          {busy ? '…' : 'Add'}
        </button>
        <span className="mono" style={{
          fontSize: 9.5, color: 'var(--faint)',
          border: '1px solid var(--hair-2)', borderRadius: 3, padding: '1px 5px',
        }}>↵</span>
      </label>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 14px',
        fontSize: 11, color: 'var(--mute)',
        minHeight: 16,
      }}>
        {auth?.signedIn ? (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pushToGoogle}
              onChange={(e) => setPushToGoogle(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="mono">also push to Google Calendar</span>
          </label>
        ) : (
          <span className="mono" style={{ color: 'var(--faint)' }}>
            (sign in to push to Google)
          </span>
        )}
        {parsed && (
          <span className="mono" style={{ color: 'var(--ink-3)' }}>
            · {parsed.title || '(no title)'}
            {' '}
            <span style={{ color: 'var(--faint)' }}>
              {parsed.start.toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
              {' → '}
              {parsed.end.toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </span>
        )}
        {errorMsg && (
          <span className="mono" style={{ color: 'var(--conflict)' }}>
            error: {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
