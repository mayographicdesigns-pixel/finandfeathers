/**
 * Timezone utilities for location-based time display.
 * Uses the Intl.DateTimeFormat API for timezone conversion.
 */

/**
 * Format a time string (HH:MM) in 12-hour format for a specific timezone.
 * @param {string} timeStr - "HH:MM" format (e.g. "20:00")
 * @param {string} timezone - IANA timezone (e.g. "America/New_York")
 * @returns {string} Formatted time like "8 PM" or "8:30 PM"
 */
export const formatTimeInTz = (timeStr, tz) => {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    // Create a date object and format in the target timezone
    const date = new Date();
    date.setUTCHours(h, m, 0, 0);
    // Since schedule times are already in local time, just format directly
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    if (m > 0) return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    return `${hour} ${ampm}`;
  } catch {
    return timeStr;
  }
};

/**
 * Format a UTC ISO timestamp to local time in a specific timezone.
 * @param {string} isoStr - ISO 8601 timestamp (e.g. "2026-03-25T12:00:00Z")
 * @param {string} tz - IANA timezone (e.g. "America/New_York")
 * @returns {string} Formatted time like "8:00 PM"
 */
export const formatTimestampInTz = (isoStr, tz) => {
  if (!isoStr || !tz) return '';
  try {
    const date = new Date(isoStr);
    return date.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

/**
 * Format a UTC ISO timestamp to date string in a specific timezone.
 * @param {string} isoStr - ISO 8601 timestamp
 * @param {string} tz - IANA timezone
 * @returns {string} Formatted date like "Mon, Mar 25"
 */
export const formatDateInTz = (isoStr, tz) => {
  if (!isoStr || !tz) return '';
  try {
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

/**
 * Format a date string (YYYY-MM-DD) for display.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string} Formatted date like "Mon, Mar 25"
 */
export const formatScheduleDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
};

/**
 * Get "time ago" string from an ISO timestamp, adjusted for a timezone.
 * @param {string} isoStr - ISO timestamp
 * @param {string} tz - IANA timezone
 * @returns {string} Like "5m ago", "2h ago", "1d ago"
 */
export const timeAgoInTz = (isoStr, tz) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
};

/**
 * Get the short timezone abbreviation for display.
 * @param {string} tz - IANA timezone (e.g. "America/New_York")
 * @returns {string} Like "EST", "PST"
 */
export const getTzAbbreviation = (tz) => {
  if (!tz) return '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || '';
  } catch {
    return '';
  }
};

/**
 * Get current local time for a timezone.
 * @param {string} tz - IANA timezone
 * @returns {string} Like "8:30 PM EST"
 */
export const getCurrentLocalTime = (tz) => {
  if (!tz) return '';
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
};
