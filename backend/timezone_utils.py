"""Timezone utilities for location-based time adjustments."""
from zoneinfo import ZoneInfo
from datetime import datetime, timezone, timedelta
import re

# Map location slugs to IANA timezone identifiers
# Auto-detected from state: GA → Eastern, NV → Pacific
LOCATION_TIMEZONES = {
    "edgewood-atlanta": "America/New_York",
    "midtown-atlanta": "America/New_York",
    "douglasville": "America/New_York",
    "riverdale": "America/New_York",
    "valdosta": "America/New_York",
    "albany": "America/New_York",
    "stone-mountain": "America/New_York",
    "las-vegas": "America/Los_Angeles",
    "hibachi-truck": "America/New_York",
}

DEFAULT_TIMEZONE = "America/New_York"


def get_location_tz(location_slug: str) -> ZoneInfo:
    """Get the ZoneInfo for a location slug."""
    tz_name = LOCATION_TIMEZONES.get(location_slug, DEFAULT_TIMEZONE)
    return ZoneInfo(tz_name)


def get_location_tz_name(location_slug: str) -> str:
    """Get the IANA timezone name for a location slug."""
    return LOCATION_TIMEZONES.get(location_slug, DEFAULT_TIMEZONE)


def utc_now_in_location(location_slug: str) -> datetime:
    """Get the current time in the location's timezone."""
    tz = get_location_tz(location_slug)
    return datetime.now(timezone.utc).astimezone(tz)


def format_time_12h(hour: int, minute: int = 0) -> str:
    """Format hour:minute as 12-hour time string."""
    ampm = "PM" if hour >= 12 else "AM"
    h = hour % 12 or 12
    if minute > 0:
        return f"{h}:{minute:02d} {ampm}"
    return f"{h} {ampm}"


# Day-of-week names matching common DB hour keys (Mon=0 ... Sun=6 per datetime.weekday())
_WEEKDAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def _parse_clock(token: str):
    """Parse a clock token like '11pm', '2am', '11:30pm', '12am' -> (hour_0_23, minute).
    Returns None if unparseable or marked closed.
    Note: '12am' -> 0, '12pm' -> 12.
    """
    if not token:
        return None
    s = token.strip().lower().replace(" ", "")
    if s in ("closed", "close", "-", ""):
        return None
    m = re.match(r"^(\d{1,2})(?::(\d{2}))?(am|pm)$", s)
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2)) if m.group(2) else 0
    ampm = m.group(3)
    if ampm == "am":
        if hour == 12:
            hour = 0
    else:  # pm
        if hour != 12:
            hour += 12
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return None
    return hour, minute


def _parse_hour_range(value: str):
    """Parse a range like '11am-2am' or '10am-11:30pm'. Returns (open, close) tuples of (h, m) or None."""
    if not value:
        return None
    s = value.strip()
    if s.lower() in ("closed", "close", ""):
        return None
    # Accept '-' or '–' as separator
    parts = re.split(r"\s*[-–]\s*", s, maxsplit=1)
    if len(parts) != 2:
        return None
    open_clk = _parse_clock(parts[0])
    close_clk = _parse_clock(parts[1])
    if not open_clk or not close_clk:
        return None
    return open_clk, close_clk


def _closing_dt_for_date(hours: dict, ref_date) -> datetime | None:
    """Given the location's hours dict and a date (interpreted as the 'business day' opening date),
    return the closing datetime for that business day (timezone-naive, in location-local clock).
    Returns None if no hours defined for that day or closed."""
    if not hours:
        return None
    weekday = ref_date.weekday()  # 0=Mon..6=Sun
    day_key = _WEEKDAY_KEYS[weekday]
    rng = _parse_hour_range(hours.get(day_key, ""))
    if not rng:
        return None
    (open_h, open_m), (close_h, close_m) = rng
    open_dt = datetime(ref_date.year, ref_date.month, ref_date.day, open_h, open_m)
    close_dt = datetime(ref_date.year, ref_date.month, ref_date.day, close_h, close_m)
    # If close <= open, the closing wraps past midnight to next day
    if close_dt <= open_dt:
        close_dt += timedelta(days=1)
    return close_dt


def get_most_recent_past_close(hours: dict, now_local: datetime) -> datetime | None:
    """Return the most recent past closing datetime (timezone-aware, in now_local's tz) given a
    location's hours dict and the current local time.

    Considers up to the last 2 business days to handle close times that wrap past midnight.
    Returns None if no past close can be determined.
    """
    if not hours or not now_local:
        return None
    tz = now_local.tzinfo
    candidates = []
    today = now_local.date()
    for offset in (0, -1, -2):
        ref_date = today + timedelta(days=offset)
        close_naive = _closing_dt_for_date(hours, ref_date)
        if close_naive is None:
            continue
        close_aware = close_naive.replace(tzinfo=tz)
        if close_aware <= now_local:
            candidates.append(close_aware)
    if not candidates:
        return None
    return max(candidates)
