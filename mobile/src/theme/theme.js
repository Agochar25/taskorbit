export const colors = {
  ink: '#1a2142', ink2: '#3b4468', ink3: '#7a84a6',
  mist: '#eef1f7', paper: '#ffffff', line: '#dde2ee',
  blue: '#3d5afe', blueSoft: '#e7ebff',
  teal: '#0f9d8f', tealSoft: '#dff5f2',
  amber: '#d98a1f', amberSoft: '#fcefd9',
  coral: '#d9434a', coralSoft: '#fde6e7',
};
export const healthColor = { ON_TRACK: colors.teal, DONE: colors.teal, AT_RISK: colors.amber, OVERDUE: colors.coral, IDLE: colors.ink3 };
export const tones = {
  neutral: { bg: '#e8ebf4', fg: colors.ink2 }, blue: { bg: colors.blueSoft, fg: '#2237b8' },
  teal: { bg: colors.tealSoft, fg: '#0a6b61' }, amber: { bg: colors.amberSoft, fg: '#8a5208' }, coral: { bg: colors.coralSoft, fg: '#9c2229' },
};
export const statusTone = { NOT_STARTED: 'neutral', PENDING: 'neutral', IN_PROGRESS: 'blue', COMPLETED: 'teal' };
export const priorityTone = { LOW: 'neutral', MEDIUM: 'amber', HIGH: 'coral' };
export const healthTone = { ON_TRACK: 'teal', DONE: 'teal', AT_RISK: 'amber', OVERDUE: 'coral', IDLE: 'neutral' };
