"""Timezone utilities for location-based time adjustments."""
from zoneinfo import ZoneInfo
from datetime import datetime, timezone

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
