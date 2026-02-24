// Version Changelog Data
// Update this with each release

export const APP_VERSION = '2.1.0';

export const CHANGELOG = {
  '2.1.0': {
    date: '2026-02-24',
    title: 'Enhanced PWA Features',
    isCritical: false,
    changes: [
      { type: 'feature', text: 'Version changelog popup on updates' },
      { type: 'feature', text: 'Background sync for offline posts' },
      { type: 'feature', text: 'Critical update force-refresh' },
      { type: 'improvement', text: 'Better offline support' }
    ]
  },
  '2.0.0': {
    date: '2026-02-24',
    title: 'Authentication & Location Features',
    isCritical: false,
    changes: [
      { type: 'feature', text: 'Google OAuth sign-in' },
      { type: 'feature', text: 'Email/password authentication' },
      { type: 'feature', text: 'Per-location feature toggles (Tip Staff, DJ Tips)' },
      { type: 'feature', text: 'PWA auto-update detection' },
      { type: 'improvement', text: 'Admin dashboard location cards' }
    ]
  },
  '1.0.0': {
    date: '2026-02-23',
    title: 'Initial Release',
    isCritical: false,
    changes: [
      { type: 'feature', text: 'Restaurant locations with check-in' },
      { type: 'feature', text: 'Social wall and DMs' },
      { type: 'feature', text: 'Menu with filtering' },
      { type: 'feature', text: 'Events and merchandise' },
      { type: 'feature', text: 'F&F Token economy' }
    ]
  }
};

// Get changelog for a specific version
export const getChangelog = (version) => CHANGELOG[version] || null;

// Get all changelogs since a version
export const getChangelogsSince = (fromVersion) => {
  const versions = Object.keys(CHANGELOG);
  const fromIndex = versions.indexOf(fromVersion);
  
  if (fromIndex === -1) return Object.entries(CHANGELOG);
  
  return Object.entries(CHANGELOG).slice(0, fromIndex);
};

// Check if any version since lastVersion is critical
export const hasCriticalUpdate = (lastVersion) => {
  const changelogs = getChangelogsSince(lastVersion);
  return changelogs.some(([_, data]) => data.isCritical);
};
