import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, calendarDate, DAYS, formatTime } from "../services/schedule-preview.js";

const COLORS = ["#dbeafe", "#dcfce7", "#f3e8ff", "#ffedd5", "#fce7f3", "#ccfbf1", "#fef9c3", "#e0e7ff"];

function courseColor(id) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

function dateLabel(value, options) {
  return calendarDate(value).toLocaleDateString("en-CA", options);
}

function EventDetails({ event, anchor }) {
  const detailsRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    const { width, height } = detailsRef.current.getBoundingClientRect();
    const gap = anchor.pointer ? 12 : 8;
    const preferredLeft = anchor.pointer
      ? (anchor.right + width + gap * 2 <= window.innerWidth ? anchor.right + gap : anchor.left - width - gap)
      : anchor.left;
    const left = Math.max(gap, Math.min(preferredLeft, window.innerWidth - width - gap));
    const top = anchor.bottom + height + gap * 2 <= window.innerHeight
      ? anchor.bottom + gap : Math.max(gap, anchor.top - height - gap);
    setPosition({ left, top });
  }, [anchor]);

  return createPortal(
    <div id="preview-event-details" className="calendar-event-details" role="tooltip"
      ref={detailsRef} style={position || { left: 0, top: 0, visibility: "hidden" }}>
      <strong>{event.courseCode || "Untitled course"}</strong>
      <span>{event.label}</span>
      <span>{dateLabel(event.date, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
      <span>{formatTime(event.startMinutes)} – {formatTime(event.endMinutes)}</span>
      {event.room && <span>{event.room}</span>}
      {event.conflict && <span className="calendar-event-conflict-message">Overlaps another event</span>}
      <span className="calendar-event-help">Select to edit</span>
    </div>,
    document.body,
  );
}

export default function WeeklyPreview({
  weekStart, bounds, days, conflictCount, startMinutes, endMinutes,
  warnings, hasEvents, isActive, onNavigate, onSelectEvent,
}) {
  const [hoveredDetails, setHoveredDetails] = useState(null);
  const [focusedDetails, setFocusedDetails] = useState(null);
  const details = hoveredDetails || focusedDetails;
  const detailsVisible = isActive && details !== null;

  useEffect(() => {
    setHoveredDetails(null);
    setFocusedDetails(null);
  }, [weekStart, days, isActive]);

  useEffect(() => {
    if (!detailsVisible) return;
    function dismiss(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setHoveredDetails(null);
      setFocusedDetails(null);
    }
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [detailsVisible]);

  function showDetails(event, button, pointer) {
    if (pointer) {
      setHoveredDetails({ event, anchor: {
        left: pointer.clientX, right: pointer.clientX,
        top: pointer.clientY, bottom: pointer.clientY, pointer: true,
      } });
    } else {
      setFocusedDetails({ event, anchor: button.getBoundingClientRect() });
    }
  }

  function hideDetails() {
    setHoveredDetails(null);
    setFocusedDetails(null);
  }

  function clearDetailsForEvent(setDetails, event) {
    // An old leave/blur event must not clear a newer event's details.
    setDetails((current) => current?.event.eventId === event.eventId ? null : current);
  }

  const weekEnd = weekStart ? addDays(weekStart, 6) : null;
  const range = weekStart
    ? `${dateLabel(weekStart, { month: "short", day: "numeric", year: "numeric" })} – ${dateLabel(weekEnd, { month: "short", day: "numeric", year: "numeric" })}`
    : "No dates to preview";
  const minuteRange = endMinutes - startMinutes;
  const hourCount = minuteRange / 60;
  const labelStep = hourCount > 16 ? 120 : 60;
  const hours = [];
  for (let minute = startMinutes; minute < endMinutes; minute += labelStep) hours.push(minute);
  hours.push(endMinutes);
  const position = (minute) => `${(minute - startMinutes) / minuteRange * 100}%`;
  const eventCount = days.reduce((count, day) => count + day.occurrences.length, 0);

  return (
    <>
      <div className="week-navigation">
        <button type="button" className="secondary" aria-label="Previous week"
          disabled={!bounds || weekStart <= bounds.firstWeek} onClick={() => onNavigate(-7)}>
          ‹
        </button>
        <p className="week-range" role="status" aria-live="polite" aria-atomic="true">{range}</p>
        <button type="button" className="secondary" aria-label="Next week"
          disabled={!bounds || weekStart >= bounds.lastWeek} onClick={() => onNavigate(7)}>
          ›
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="preview-warning">
          <p id="preview-warning-label" role="status">
            {warnings.length} {warnings.length === 1 ? "event needs" : "events need"} attention
          </p>
          <ul aria-labelledby="preview-warning-label">
            {warnings.map(({ event, issues }) => (
              <li key={event.id}>
                <button type="button" className="preview-warning-link"
                  onClick={() => onSelectEvent(event.id, issues[0].field)}>
                  {event.courseCode || "Untitled course"} · {event.component || event.examType || "Event"}
                  {event.componentDay && ` · ${event.componentDay}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {conflictCount > 0 && (
        <p className="preview-conflicts" role="status">
          {conflictCount} events overlap this week. You can still export.
        </p>
      )}

      {!bounds ? (
        <p className="export-empty">
          {hasEvents ? "No valid events to preview." : "No events left to preview."}
        </p>
      ) : (
        <>
          {!eventCount && <p className="preview-empty-week" role="status">No events this week.</p>}
          <p className="sr-only" id="preview-help">Hover over or focus an event for full details. Select it to edit.</p>
          <div className="weekly-calendar" role="region" aria-label="Weekly schedule"
            aria-describedby="preview-help">
            <div className="calendar-grid" style={{ "--calendar-days": days.length, "--calendar-hours": hourCount }}>
              <div className="calendar-corner">Time</div>
              {days.map((day) => (
                <div key={day.date} className="calendar-day-heading">
                  <span>{DAYS[day.weekday].slice(0, 3)}</span>
                  <span>{dateLabel(day.date, { month: "short", day: "numeric" })}</span>
                </div>
              ))}
              <div className="calendar-time-gutter" aria-hidden="true">
                {hours.map((minute, index) => (
                  <span key={minute} className={`calendar-hour${index === hours.length - 1 ? " calendar-last-hour" : ""}`}
                    style={{ top: position(minute) }}>{formatTime(minute)}</span>
                ))}
              </div>
              {days.map((day) => (
                <div key={day.date} className="calendar-day">
                  {day.occurrences.map((event) => {
                    const time = `${formatTime(event.startMinutes)} – ${formatTime(event.endMinutes)}`;
                    const label = `${event.courseCode || "Untitled course"}, ${event.label}, ${dateLabel(event.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${time}${event.room ? `, ${event.room}` : ""}${event.conflict ? ", overlaps another event" : ""}`;
                    return (
                      <button key={event.eventId} type="button" className={`calendar-event${event.conflict ? " calendar-event-conflict" : ""}`}
                        aria-label={label}
                        aria-describedby={isActive && details?.event.eventId === event.eventId ? "preview-event-details" : undefined}
                        style={{
                          top: position(event.startMinutes),
                          height: `${(event.endMinutes - event.startMinutes) / minuteRange * 100}%`,
                          left: `calc(${event.lane * 100 / event.laneCount}% + 2px)`,
                          width: `calc(${100 / event.laneCount}% - 4px)`,
                          backgroundColor: courseColor(event.courseId),
                        }}
                        onMouseEnter={(e) => showDetails(event, e.currentTarget, e)}
                        onMouseMove={(e) => showDetails(event, e.currentTarget, e)}
                        onMouseLeave={() => clearDetailsForEvent(setHoveredDetails, event)}
                        onFocus={(e) => showDetails(event, e.currentTarget)}
                        onBlur={() => clearDetailsForEvent(setFocusedDetails, event)}
                        onClick={() => {
                          hideDetails();
                          onSelectEvent(event.eventId);
                        }}>
                        <span className="calendar-event-summary" aria-hidden="true">
                          <strong>{event.conflict && "⚠ "}{event.courseCode?.split("-")[0].trim() || "Event"}</strong>
                          {" · "}<span>{event.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {isActive && details && <EventDetails {...details} />}
    </>
  );
}
