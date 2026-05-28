"""Regression tests for DJ auto-logout helpers in timezone_utils."""
from datetime import datetime, date
from zoneinfo import ZoneInfo
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from timezone_utils import (
    _parse_clock,
    _parse_hour_range,
    _closing_dt_for_date,
    get_most_recent_past_close,
)


def test_parse_clock():
    assert _parse_clock("11pm") == (23, 0)
    assert _parse_clock("2am") == (2, 0)
    assert _parse_clock("12am") == (0, 0)
    assert _parse_clock("12pm") == (12, 0)
    assert _parse_clock("11:30pm") == (23, 30)
    assert _parse_clock("Closed") is None
    assert _parse_clock("") is None
    assert _parse_clock("garbage") is None


def test_parse_hour_range():
    assert _parse_hour_range("11am-11pm") == ((11, 0), (23, 0))
    assert _parse_hour_range("11am-2am") == ((11, 0), (2, 0))
    assert _parse_hour_range("10am-11:30pm") == ((10, 0), (23, 30))
    assert _parse_hour_range("11am – 12am") == ((11, 0), (0, 0))
    assert _parse_hour_range("Closed") is None
    assert _parse_hour_range("") is None


def test_closing_dt_wraps_past_midnight():
    hours = {"saturday": "11am-2am"}
    dt = _closing_dt_for_date(hours, date(2026, 2, 28))  # Saturday
    assert dt.year == 2026 and dt.month == 3 and dt.day == 1 and dt.hour == 2


HOURS_FULL = {
    "monday": "11am-11pm",
    "tuesday": "11am-11pm",
    "wednesday": "11am-11pm",
    "thursday": "11am-11pm",
    "friday": "11am-2am",
    "saturday": "11am-2am",
    "sunday": "10am-11:30pm",
}


def _et(y, mo, d, h, mi):
    return datetime(y, mo, d, h, mi, tzinfo=ZoneInfo("America/New_York"))


def test_logout_triggers_30_min_after_saturday_close():
    # Sunday 02:35 ET — Saturday closed at 2am Sunday (35 min ago)
    now = _et(2026, 3, 1, 2, 35)
    last = get_most_recent_past_close(HOURS_FULL, now)
    assert last is not None
    diff_min = (now - last).total_seconds() / 60
    assert 30 <= diff_min <= 60


def test_no_logout_during_open_hours():
    # Sunday 6pm — Sunday close is 11:30pm
    now = _et(2026, 3, 1, 18, 0)
    last = get_most_recent_past_close(HOURS_FULL, now)
    # Most recent past close is Saturday's 2am Sunday close = 16h ago.
    # In the auto_logout policy we also require checked_in_at < last_close,
    # so a fresh check-in today would NOT be logged out.
    diff_h = (now - last).total_seconds() / 3600
    assert diff_h > 8  # safety check: many hours since prior close


def test_no_logout_at_exactly_close():
    # Sunday 11:30pm exactly = 0 min since close → don't trigger
    now = _et(2026, 3, 1, 23, 30)
    last = get_most_recent_past_close(HOURS_FULL, now)
    diff = (now - last).total_seconds() / 60
    assert diff == 0


def test_logout_triggers_at_midnight_after_sunday_close():
    # Monday 00:05 ET — Sunday closed 11:30pm = 35 min ago
    now = _et(2026, 3, 2, 0, 5)
    last = get_most_recent_past_close(HOURS_FULL, now)
    diff = (now - last).total_seconds() / 60
    assert 30 <= diff <= 60


def test_closed_day_handled():
    hours = {
        "monday": "11am-11pm",
        "tuesday": "11am-11pm",
        "wednesday": "11am-11pm",
        "thursday": "11am-11pm",
        "friday": "11am-12am",
        "saturday": "11am-12am",
        "sunday": "Closed",
    }
    # Sunday 11pm — Sun is Closed; Sat closed at midnight Sun (23h ago)
    now = _et(2026, 3, 1, 23, 0)
    last = get_most_recent_past_close(hours, now)
    assert last is not None
    diff_h = (now - last).total_seconds() / 3600
    assert diff_h > 8


if __name__ == "__main__":
    test_parse_clock()
    test_parse_hour_range()
    test_closing_dt_wraps_past_midnight()
    test_logout_triggers_30_min_after_saturday_close()
    test_no_logout_during_open_hours()
    test_no_logout_at_exactly_close()
    test_logout_triggers_at_midnight_after_sunday_close()
    test_closed_day_handled()
    print("All DJ auto-logout tests passed ✓")
