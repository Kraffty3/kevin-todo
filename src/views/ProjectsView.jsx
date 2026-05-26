// Projects view — list of projects (Monday.com-ish), each row expandable
// to its milestone grid. Column rename: Target → Target completion.
// "Push to Today" → "Push to calendar" — opens a wizard.
import React from 'react';
import { StatusPill, SmallTag } from '../components/Shared.jsx';
import { PushToCalendarWizard } from '../components/PushToCalendarWizard.jsx';

export function ProjectsView({ projects, connected }) {
  const [expanded, setExpanded] = React.useState({ [projects[0].id]: true });
  const [wizardFor, setWizardFor] = React.useState(null);

  const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <ProjectsHeader count={projects.length} />

      <div style={{ padding: '14px 22px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {projects.map((p) => (
          <ProjectBlock
            key={p.id}
            project={p}
            expanded={!!expanded[p.id]}
            onToggle={() => toggle(p.id)}
            onPush={(m) => setWizardFor({ milestone: m, project: p })}
          />
        ))}
      </div>

      {wizardFor && (
        <PushToCalendarWizard
          milestone={wizardFor.milestone}
          project={wizardFor.project}
          connected={connected}
          onClose={() => setWizardFor(null)}
        />
      )}
    </div>
  );
}

function ProjectsHeader({ count }) {
  return (
    <div style={{
      padding: '20px 22px 16px',
      borderBottom: '1px solid var(--hair)',
      display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap',
    }}>
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        <div className="smcaps">Projects</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>Backwards planner</h1>
          <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
            {count} projects · click a row to open milestones
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm">＋ New project</button>
        <button className="btn sm">Sort</button>
      </div>
    </div>
  );
}

function ProjectBlock({ project, expanded, onToggle, onPush }) {
  const next = project.milestones.find((m) => m.status === 'in-flight') ||
               project.milestones.find((m) => m.status === 'next');

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 200px 130px 130px 120px 36px',
        gap: 14, alignItems: 'center',
        width: '100%', textAlign: 'left',
        padding: '14px 18px',
        background: expanded ? 'var(--soft)' : 'var(--panel)',
        border: 0, borderBottom: expanded ? '1px solid var(--hair)' : 'none',
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <Chevron open={expanded} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.desc}
          </div>
        </div>
        <div>
          <div className="smcaps" style={{ marginBottom: 4 }}>Progress</div>
          <ProgressBar value={project.progress} />
        </div>
        <div>
          <div className="smcaps" style={{ marginBottom: 4 }}>Next milestone</div>
          <span style={{ fontSize: 11.5, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {next ? next.name : '—'}
          </span>
        </div>
        <div>
          <div className="smcaps" style={{ marginBottom: 4 }}>Target completion</div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
            {project.finalDate}
          </span>
        </div>
        <div>
          <div className="smcaps" style={{ marginBottom: 4 }}>Milestones</div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
            {project.milestones.length}/6
          </span>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', textAlign: 'right' }}>
          {expanded ? '–' : '+'}
        </span>
      </button>

      {expanded && (
        <MilestoneGrid project={project} onPush={onPush} />
      )}
    </div>
  );
}

function Chevron({ open }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 4,
      background: 'var(--inset)',
      color: 'var(--ink-3)',
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 120ms ease',
    }}>
      <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
        <path d="M2 1.5L7 5.5L2 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99,
        background: 'var(--inset)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.round(value * 100)}%`, height: '100%',
          background: 'var(--accent)', borderRadius: 99,
        }} />
      </div>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', minWidth: 28, textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function MilestoneGrid({ project, onPush }) {
  const cols = '40px 1.4fr 2fr 130px 150px 120px 160px';
  return (
    <div style={{ overflowX: 'auto' }} className="scroll">
      <div style={{ minWidth: 1000 }}>
        <div style={{
          padding: '10px 16px',
          background: 'var(--softer)',
          borderBottom: '1px solid var(--hair)',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <span className="smcaps">Milestones</span>
          <div className="seg">
            <button className={project.spacing === 'even' ? 'on' : ''}>Even spacing</button>
            <button className={project.spacing === 'manual' ? 'on' : ''}>Manual</button>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn sm">＋ Add milestone</button>
          <button className="btn sm">Export</button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: cols, gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--hair)',
        }}>
          <div className="smcaps">#</div>
          <div className="smcaps">Milestone</div>
          <div className="smcaps">Description</div>
          <div className="smcaps">Start-by</div>
          <div className="smcaps">Target completion</div>
          <div className="smcaps">Status</div>
          <div></div>
        </div>

        {project.milestones.map((m, i) => (
          <MilestoneRow key={m.id} m={m} i={i} cols={cols} onPush={onPush} />
        ))}

        <div style={{ padding: '10px 16px', color: 'var(--mute)', borderTop: '1px dashed var(--hair)' }}>
          <span className="mono" style={{ fontSize: 11 }}>＋ Add milestone</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginLeft: 6 }}>
            · {6 - project.milestones.length} of 6 remaining
          </span>
        </div>
      </div>
    </div>
  );
}

function MilestoneRow({ m, i, cols, onPush }) {
  const isAnchor = m.anchor;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols, gap: 12,
      padding: '14px 16px',
      borderBottom: '1px solid var(--hair)',
      alignItems: 'center',
      background: isAnchor ? 'var(--success-bg)' : 'transparent',
    }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{String(i + 1).padStart(2, '0')}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{
          width: 9, height: 9, borderRadius: 99, flexShrink: 0,
          background:
            m.status === 'done' ? 'var(--mute)' :
            isAnchor ? 'var(--success)' :
            m.status === 'in-flight' ? 'var(--accent)' : 'var(--ink-3)',
          opacity: m.status === 'done' ? 0.5 : 1,
        }} />
        <span style={{
          fontSize: 13.5, fontWeight: 500,
          color: m.status === 'done' ? 'var(--mute)' : 'var(--ink)',
          textDecoration: m.status === 'done' ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{m.name}</span>
        {isAnchor && <SmallTag>anchor</SmallTag>}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{m.desc}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="mono" style={{
          fontSize: 11.5, fontWeight: m.computed ? 600 : 500,
          color: m.computed ? 'var(--accent)' : 'var(--ink-2)',
          borderBottom: m.computed ? '1px dashed var(--accent)' : 'none',
          paddingBottom: 1,
        }}>{m.startBy}</span>
        {m.computed && (
          <span className="mono" title="Computed from final date" style={{
            fontSize: 9.5, color: 'var(--accent)',
            padding: '1px 4px', border: '1px solid var(--accent)', borderRadius: 3,
          }}>↩ auto</span>
        )}
      </div>

      <div className="mono" style={{
        fontSize: 11.5, fontWeight: isAnchor ? 600 : 500,
        color: isAnchor ? 'var(--success)' : 'var(--ink-2)',
      }}>{m.target}</div>

      <div><StatusPill status={m.status} /></div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {m.pushable ? (
          <button className="btn sm" onClick={() => onPush(m)}>↗ Push to calendar</button>
        ) : (
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>—</span>
        )}
      </div>
    </div>
  );
}
