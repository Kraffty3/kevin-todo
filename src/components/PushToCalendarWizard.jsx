// Push-to-calendar wizard — 3 steps. Modal dialog from a project milestone.
//   1. Pick destination calendar
//   2. Pick time / duration
//   3. Review + push
import React from 'react';
import { INTEGRATIONS, SRC_META } from '../data.js';
import {
  SourceBadge, IntegrationMark, ImportantStar, SmallTag, ToggleSwitch,
} from './Shared.jsx';

export function PushToCalendarWizard({ milestone, project, connected, onClose }) {
  const connectedList = INTEGRATIONS.filter((it) => connected[it.id]);
  const [step, setStep] = React.useState(1);
  const [dest, setDest] = React.useState(connectedList[0]?.id || 'manual');
  const [when, setWhen] = React.useState({
    date: milestone.startBy,
    time: '09:00',
    duration: 60,
    kind: 'block',
    important: true,
  });
  const [pushed, setPushed] = React.useState(false);

  const canNext = step === 1 ? !!dest : step === 2 ? !!(when.date && when.time && when.duration) : true;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(20,19,15,0.30)', zIndex: 100,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 580, maxWidth: '94vw', maxHeight: '88vh',
        background: 'var(--bg)',
        border: '1px solid var(--hair-2)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-pop)',
        zIndex: 110,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--hair)', background: 'var(--panel)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="smcaps">Push to calendar</span>
            <div style={{ flex: 1 }} />
            <button className="btn ghost sm" onClick={onClose} style={{ fontSize: 14 }}>✕</button>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, letterSpacing: -0.2 }}>{milestone.name}</div>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>
            {project.name} · target {milestone.target}
          </div>
          <Stepper step={step} steps={['Calendar', 'Time & duration', 'Review']} />
        </div>

        <div className="scroll" style={{ flex: 1, padding: '20px 22px', minHeight: 0 }}>
          {!pushed && step === 1 && (
            <StepCalendar dest={dest} setDest={setDest} connected={connected} />
          )}
          {!pushed && step === 2 && (
            <StepWhen when={when} setWhen={setWhen} milestone={milestone} />
          )}
          {!pushed && step === 3 && (
            <StepReview dest={dest} when={when} milestone={milestone} project={project} />
          )}
          {pushed && (
            <PushedConfirmation dest={dest} when={when} milestone={milestone} />
          )}
        </div>

        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--hair)',
          background: 'var(--panel)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {!pushed ? (
            <>
              <button className="btn ghost sm" onClick={onClose}>Cancel</button>
              <div style={{ flex: 1 }} />
              {step > 1 && (
                <button className="btn sm" onClick={() => setStep(step - 1)}>← Back</button>
              )}
              {step < 3 && (
                <button className="btn primary sm" disabled={!canNext} onClick={() => setStep(step + 1)}>Next →</button>
              )}
              {step === 3 && (
                <button className="btn accent sm" onClick={() => setPushed(true)}>↗ Push to {(SRC_META[dest]?.name || 'calendar').toLowerCase()}</button>
              )}
            </>
          ) : (
            <>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--success)' }}>● pushed</span>
              <div style={{ flex: 1 }} />
              <button className="btn primary sm" onClick={onClose}>Done</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Stepper({ step, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <React.Fragment key={label}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 99,
                background: active ? 'var(--accent)' : (done ? 'var(--accent-bg)' : 'var(--inset)'),
                color: active ? '#fff' : (done ? 'var(--accent)' : 'var(--mute)'),
                border: `1px solid ${active || done ? 'var(--accent)' : 'var(--hair-2)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              }}>{done ? '✓' : idx}</span>
              <span className="mono" style={{ fontSize: 11, color: active ? 'var(--ink)' : 'var(--mute)' }}>{label}</span>
            </span>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 1, background: done ? 'var(--accent)' : 'var(--hair-2)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepCalendar({ dest, setDest, connected }) {
  const choices = [
    ...INTEGRATIONS.map((it) => ({ id: it.id, name: it.name, account: it.account, connected: !!connected[it.id] })),
    { id: 'manual', name: 'Manual (Todo only)', account: 'No external calendar', connected: true },
  ];
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 12 }}>
        Where should this milestone land?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {choices.map((c) => {
          const selected = dest === c.id;
          const disabled = !c.connected;
          return (
            <button key={c.id} onClick={() => !disabled && setDest(c.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: selected ? 'var(--accent-bg)' : 'var(--panel)',
              border: `1px solid ${selected ? 'var(--accent)' : 'var(--hair-2)'}`,
              borderRadius: 10,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              fontFamily: 'inherit', textAlign: 'left',
            }}>
              <IntegrationMark id={c.id} size={28} connected={c.connected} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', marginTop: 2 }}>
                  {c.connected ? c.account : 'Not connected'}
                </div>
              </div>
              {disabled && (
                <span className="mono" style={{
                  fontSize: 10, padding: '3px 8px',
                  background: 'var(--inset)', color: 'var(--mute)',
                  border: '1px solid var(--hair-2)', borderRadius: 99,
                }}>connect first</span>
              )}
              {selected && (
                <span className="mono" style={{
                  fontSize: 10, padding: '3px 8px',
                  background: 'var(--accent)', color: '#fff',
                  borderRadius: 99,
                }}>selected</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepWhen({ when, setWhen, milestone }) {
  const upd = (k, v) => setWhen({ ...when, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        When should this fire? Defaults pulled from the milestone's computed start-by date.
      </div>

      <WizardRow label="What kind">
        <ChoicePills value={when.kind} onChange={(v) => upd('kind', v)} options={[
          { id: 'block',    label: 'Focus block', sub: 'protected time' },
          { id: 'event',    label: 'Event',        sub: 'normal calendar event' },
          { id: 'reminder', label: 'Reminder',     sub: 'all-day, no block' },
        ]} />
      </WizardRow>

      <WizardRow label="Date">
        <input type="text" value={when.date} onChange={(e) => upd('date', e.target.value)} style={inputStyle(170)} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
          (milestone start-by: {milestone.startBy})
        </span>
      </WizardRow>

      {when.kind !== 'reminder' && (
        <>
          <WizardRow label="Start time">
            <input type="time" value={when.time} onChange={(e) => upd('time', e.target.value)} style={inputStyle(120)} />
          </WizardRow>
          <WizardRow label="Duration">
            <ChoicePills value={String(when.duration)} onChange={(v) => upd('duration', parseInt(v))} options={[
              { id: '30',  label: '30 min' },
              { id: '60',  label: '1 hr' },
              { id: '90',  label: '90 min' },
              { id: '120', label: '2 hr' },
            ]} />
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
              or
            </span>
            <input type="number" min={5} max={480} step={5}
              value={when.duration} onChange={(e) => upd('duration', parseInt(e.target.value) || 30)}
              style={inputStyle(70)} />
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>min</span>
          </WizardRow>
        </>
      )}

      <WizardRow label="Mark important">
        <ToggleSwitch defaultChecked={when.important} onChange={(v) => upd('important', v)} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>
          auto-generates the cascade + sub-timers
        </span>
      </WizardRow>
    </div>
  );
}

function WizardRow({ label, children }) {
  return (
    <div>
      <div className="smcaps" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

function ChoicePills({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const sel = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '7px 12px',
            background: sel ? 'var(--accent-bg)' : 'var(--panel)',
            border: `1px solid ${sel ? 'var(--accent)' : 'var(--hair-2)'}`,
            color: sel ? 'var(--accent)' : 'var(--ink-2)',
            borderRadius: 8, cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{o.label}</div>
            {o.sub && <div className="mono" style={{ fontSize: 9.5, color: 'var(--mute)', marginTop: 2 }}>{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

function inputStyle(w = 160) {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: 12, padding: '6px 10px',
    border: '1px solid var(--hair-2)', borderRadius: 6,
    background: 'var(--panel)', color: 'var(--ink-2)',
    width: w, outline: 'none',
  };
}

function StepReview({ dest, when, milestone, project }) {
  const m = SRC_META[dest] || SRC_META.manual;
  const endTime = computeEnd(when.time, when.duration);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        Looks right? Push to land on the calendar and Today timeline.
      </div>

      <div style={{
        padding: '14px 16px',
        background: 'var(--panel)',
        border: '1px solid var(--hair)',
        borderRadius: 10,
        borderLeft: `4px solid ${m.color}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SourceBadge src={dest === 'manual' ? 'manual' : dest} />
          {when.important && <ImportantStar />}
          <SmallTag>{when.kind}</SmallTag>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{milestone.name}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', marginTop: 4 }}>
          {when.date} ·{when.kind === 'reminder' ? ' all day' : ` ${when.time}–${endTime} (${when.duration} min)`}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8 }}>
          {milestone.desc}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--hair)' }}>
          from project: {project.name}
        </div>
      </div>

      <div style={{
        padding: '12px 14px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent)',
        borderRadius: 8,
      }}>
        <div className="smcaps" style={{ color: 'var(--accent)', marginBottom: 6 }}>What will happen</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <li>Appears on the Today timeline at {when.date} {when.kind !== 'reminder' && when.time}.</li>
          {when.important && <li>Cascade fires T−30/15/10/5/2 before start; sub-timers every 15m through the event.</li>}
          {dest !== 'manual' && <li>Event written to {SRC_META[dest]?.name} ({when.kind === 'block' ? 'shown as Busy' : 'visible to invitees'}).</li>}
        </ul>
      </div>
    </div>
  );
}

function computeEnd(timeStr, durationMin) {
  const [h, m] = timeStr.split(':').map(Number);
  const start = h * 60 + m;
  const end = start + durationMin;
  const eh = Math.floor((end / 60) % 24);
  const em = end % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function PushedConfirmation({ dest, when, milestone }) {
  const m = SRC_META[dest] || SRC_META.manual;
  return (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <div style={{
        width: 60, height: 60, borderRadius: 99,
        background: 'var(--success-bg)',
        border: '2px solid var(--success)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 14.5L11.5 20L22 8" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Pushed to {m.name}</div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>
        {milestone.name} · {when.date} {when.kind !== 'reminder' && when.time}
      </div>
    </div>
  );
}
