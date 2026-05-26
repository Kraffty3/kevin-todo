// Mock data + clock + integrations. The mock IS the design — hand-engineered
// to demonstrate every problem from the doc on load.
//
// Demo clock: pinned to Tue May 19, 13:37 local. All "now" / "in 23 min"
// references resolve against this so the demo is deterministic.

export const DEMO_NOW = new Date(2026, 4, 19, 13, 37);
export const fmtClock = (d = DEMO_NOW) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const INTEGRATIONS = [
  { id: 'google',  name: 'Google Calendar',  account: 'kevin@gmail.com',     color: 'var(--google)',  bg: 'var(--google-bg)',  letter: 'G' },
  { id: 'apple',   name: 'Apple Calendar',   account: 'kevin@icloud.com',    color: 'var(--apple)',   bg: 'var(--apple-bg)',   letter: 'A' },
  { id: 'outlook', name: 'Outlook (Work)',   account: 'k.ko@acme.com',       color: 'var(--outlook)', bg: 'var(--outlook-bg)', letter: 'O' },
];

export const SRC_META = {
  google:  { name: 'Google',  color: 'var(--google)',  bg: 'var(--google-bg)'  },
  apple:   { name: 'Apple',   color: 'var(--apple)',   bg: 'var(--apple-bg)'   },
  outlook: { name: 'Outlook', color: 'var(--outlook)', bg: 'var(--outlook-bg)' },
  manual:  { name: 'Manual',  color: 'var(--manual)',  bg: 'var(--manual-bg)'  },
};

const at = (h, m = 0) => new Date(2026, 4, 19, h, m);
const onDay = (day, h, m = 0) => new Date(2026, 4, day, h, m);

export const TODAY_EVENTS = [
  {
    id: 'e-deepwork',
    src: 'outlook',
    title: 'Deep work — model eval',
    start: at(9, 0), end: at(11, 0),
    protectedBlock: true,
    location: 'focus',
  },
  {
    id: 'e-standup',
    src: 'outlook',
    title: 'Eng standup',
    start: at(11, 30), end: at(12, 0),
    attendees: 6,
    location: 'Zoom · #eng',
  },
  {
    id: 'e-lunch',
    src: 'apple',
    title: 'Lunch w/ Sam',
    start: at(12, 0), end: at(13, 0),
    location: 'Mae’s',
  },
  {
    id: 'e-review',
    src: 'outlook',
    title: 'Q3 model review',
    start: at(14, 0), end: at(15, 0),
    attendees: 4,
    important: true,
    location: 'Conf B / Zoom',
  },
  {
    id: 'e-pickup',
    src: 'google',
    title: 'Annie pickup',
    start: at(14, 0), end: at(14, 30),
    location: 'Stanton Elementary',
  },
  {
    id: 'e-writeup',
    src: 'manual',
    title: 'Submit churn writeup',
    start: at(16, 0), end: at(16, 45),
    important: true,
    note: 'Hand to lead + 2 partners for sign-off',
  },
  {
    id: 'e-gym',
    src: 'apple',
    title: 'Gym',
    start: at(17, 30), end: at(18, 30),
  },
];

export const STALE = [
  { id: 's1', src: 'google',  title: 'Coffee w/ recruiter?',        age: 9,  note: 'Never accepted' },
  { id: 's2', src: 'apple',   title: 'Reschedule dentist',          age: 14, note: 'Reminder, no date' },
  { id: 's3', src: 'outlook', title: 'Reply: vendor demo invite',   age: 6,  note: 'Sat in inbox' },
];

export const INBOX = [
  { id: 'i1', src: 'manual', title: 'Draft offsite agenda' },
  { id: 'i2', src: 'manual', title: 'Sign updated NDA' },
  { id: 'i3', src: 'google', title: 'Pick a date — Daniel’s thing' },
];

export const WEEK_EVENTS = {
  18: [
    { id: 'w18-1', src: 'outlook', title: 'Standup',     start: onDay(18, 9, 0),  end: onDay(18, 10, 0) },
    { id: 'w18-2', src: 'apple',   title: 'Dentist',     start: onDay(18, 12, 0), end: onDay(18, 13, 0) },
    { id: 'w18-3', src: 'outlook', title: 'Sprint plan', start: onDay(18, 14, 0), end: onDay(18, 15, 30) },
  ],
  19: TODAY_EVENTS,
  20: [
    { id: 'w20-1', src: 'outlook', title: 'Eng review',                  start: onDay(20, 10, 0), end: onDay(20, 11, 30) },
    { id: 'w20-2', src: 'google',  title: 'Daniel’s thing',              start: onDay(20, 13, 0), end: onDay(20, 14, 0) },
    { id: 'w20-3', src: 'manual',  title: 'Q3 milestone: model frozen',  start: onDay(20, 16, 0), end: onDay(20, 17, 0), important: true },
  ],
};

export const PROJECTS = [
  {
    id: 'q3-churn',
    name: 'Q3 churn model',
    desc: 'Ship a churn predictor live behind a feature flag',
    finalDate: 'Aug 14, 2026',
    spacing: 'even',
    progress: 0.30,
    milestones: [
      { id: 'm1', name: 'Frozen feature set', desc: 'No new features after this date',           startBy: 'Jun 20', target: 'Jun 24', status: 'done',     computed: true,  pushable: false },
      { id: 'm2', name: 'First eval pass',    desc: 'Hold-out AUC ≥ 0.78',                       startBy: 'Jul 02', target: 'Jul 10', status: 'in-flight',computed: true,  pushable: true  },
      { id: 'm3', name: 'Stakeholder review', desc: 'Lead + 2 partners sign-off',                startBy: 'Jul 18', target: 'Jul 24', status: 'next',     computed: true,  pushable: true  },
      { id: 'm4', name: 'Model frozen',       desc: 'Code + weights tagged, train data archived',startBy: 'Aug 01', target: 'Aug 07', status: 'next',     computed: true,  pushable: true  },
      { id: 'm5', name: 'Q3 launch',          desc: 'Live behind feature flag',                  startBy: 'Aug 10', target: 'Aug 14', status: 'target',   computed: false, pushable: false, anchor: true },
    ],
  },
  {
    id: 'pricing-v2',
    name: 'Pricing v2 analysis',
    desc: 'Quantify uplift of tiered pricing across 3 cohorts',
    finalDate: 'Sep 30, 2026',
    spacing: 'even',
    progress: 0.10,
    milestones: [
      { id: 'pm1', name: 'Cohort definitions',   desc: 'Lock the 3 segments we’ll measure',          startBy: 'Aug 18', target: 'Aug 22', status: 'in-flight', computed: false, pushable: true },
      { id: 'pm2', name: 'Lift estimation',       desc: 'Backtest + counterfactual model',            startBy: 'Aug 28', target: 'Sep 08', status: 'next',     computed: true,  pushable: true },
      { id: 'pm3', name: 'Exec readout',          desc: 'Memo + slides',                              startBy: 'Sep 18', target: 'Sep 25', status: 'next',     computed: true,  pushable: true },
      { id: 'pm4', name: 'Recommendation locked', desc: 'Final tiering proposal',                     startBy: 'Sep 26', target: 'Sep 30', status: 'target',   computed: false, pushable: false, anchor: true },
    ],
  },
  {
    id: 'hackathon',
    name: 'Q3 hackathon prep',
    desc: 'Two-day push with the eng team — pitch ready',
    finalDate: 'Jun 12, 2026',
    spacing: 'manual',
    progress: 0.55,
    milestones: [
      { id: 'hm1', name: 'Theme picked',     desc: 'Internal-tooling angle',         startBy: 'May 12', target: 'May 14', status: 'done',     computed: false, pushable: false },
      { id: 'hm2', name: 'Working demo',     desc: 'End-to-end happy path',          startBy: 'May 28', target: 'Jun 03', status: 'in-flight',computed: false, pushable: true },
      { id: 'hm3', name: 'Pitch + handoff',  desc: 'Slides + README + leave-behind', startBy: 'Jun 10', target: 'Jun 12', status: 'target',   computed: false, pushable: false, anchor: true },
    ],
  },
  {
    id: 'eoy-review',
    name: 'EoY self-review',
    desc: 'Pull the year together for perf cycle',
    finalDate: 'Nov 21, 2026',
    spacing: 'even',
    progress: 0.0,
    milestones: [
      { id: 'em1', name: 'Outline + asks', desc: 'Bullet list of wins, gaps, asks', startBy: 'Oct 20', target: 'Oct 27', status: 'next',   computed: true,  pushable: true },
      { id: 'em2', name: 'Draft',          desc: 'Full write-up',                   startBy: 'Nov 04', target: 'Nov 12', status: 'next',   computed: true,  pushable: true },
      { id: 'em3', name: 'Submit',         desc: 'In the system',                   startBy: 'Nov 18', target: 'Nov 21', status: 'target', computed: false, pushable: false, anchor: true },
    ],
  },
];
