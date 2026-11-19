export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Calendar values stay in local time at noon. Never round-trip date-only values
// through UTC or add elapsed milliseconds across daylight-saving transitions.
export function calendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date;
}

export function localDate(date = new Date()) {
  return [date.getFullYear().toString().padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")].join("-");
}

export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return Number(value.slice(0, 4)) > 0 && localDate(calendarDate(value)) === value;
}

export function addDays(value, amount) {
  const date = calendarDate(value);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

export function startOfWeek(value) {
  return addDays(value, -((calendarDate(value).getDay() + 6) % 7));
}

export function firstWeekdayOnOrAfter(value, weekday) {
  const currentDay = (calendarDate(value).getDay() + 6) % 7;
  return addDays(value, (DAYS.indexOf(weekday) - currentDay + 7) % 7);
}

export function timeToMinutes(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

export function validateEvent(event, kind) {
  const issues = [];
  const add = (field, message) => issues.push({ id: event.id, field, message });
  const isClass = kind === "class";

  if (isClass && !DAYS.includes(event.componentDay)) add("componentDay", "Choose a day.");
  for (const field of isClass ? ["startDate", "endDate"] : ["examDate"]) {
    if (!isIsoDate(event[field])) add(field, "Enter a valid date.");
  }
  if (isClass && isIsoDate(event.startDate) && isIsoDate(event.endDate) &&
      event.endDate < event.startDate) {
    add("endDate", "End date must be on or after the start date.");
  }

  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  if (start === null) add("startTime", "Enter a valid time.");
  if (end === null) add("endTime", "Enter a valid time.");
  if (start !== null && end !== null && end <= start) {
    add("endTime", "End time must be after the start time.");
  }
  if (isClass && !issues.length &&
      firstWeekdayOnOrAfter(event.startDate, event.componentDay) > event.endDate) {
    add("endDate", "This date range does not include the selected weekday.");
  }
  return issues;
}

// Derive bounds directly from each series; do not expand an entire semester.
export function preparePreview(events, kind) {
  const validEvents = [];
  const issues = [];
  let firstDate = null;
  let lastDate = null;
  let earliest = 1440;
  let latest = 0;

  for (const event of events) {
    const errors = validateEvent(event, kind);
    issues.push(...errors);
    if (errors.length) continue;

    const first = kind === "class"
      ? firstWeekdayOnOrAfter(event.startDate, event.componentDay) : event.examDate;
    const nextAfterEnd = kind === "class"
      ? firstWeekdayOnOrAfter(event.endDate, event.componentDay) : first;
    const last = kind === "class" && nextAfterEnd > event.endDate
      ? addDays(nextAfterEnd, -7) : nextAfterEnd;
    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);

    validEvents.push({ event, firstDate: first, lastDate: last, startMinutes, endMinutes });
    if (firstDate === null || first < firstDate) firstDate = first;
    if (lastDate === null || last > lastDate) lastDate = last;
    earliest = Math.min(earliest, startMinutes);
    latest = Math.max(latest, endMinutes);
  }

  return {
    kind,
    validEvents,
    issues,
    // Keep the columns stable across weeks, including exam weeks with gaps.
    visibleWeekdays: DAYS.map((_, index) => index).filter((index) => index < 5 ||
      validEvents.some(({ firstDate }) => (calendarDate(firstDate).getDay() + 6) % 7 === index)),
    bounds: firstDate ? {
      firstDate, lastDate, firstWeek: startOfWeek(firstDate), lastWeek: startOfWeek(lastDate),
    } : null,
    startMinutes: validEvents.length ? Math.max(0, Math.floor(earliest / 60) * 60 - 60) : 480,
    endMinutes: validEvents.length ? Math.min(1440, Math.ceil(latest / 60) * 60 + 60) : 1080,
  };
}

export function initialPreviewWeek(bounds, today = localDate()) {
  if (!bounds) return null;
  const current = startOfWeek(today);
  return current >= bounds.firstWeek && current <= bounds.lastWeek ? current : bounds.firstWeek;
}

export function clampPreviewWeek(week, bounds, today = localDate()) {
  if (!bounds) return null;
  if (!week) return initialPreviewWeek(bounds, today);
  return week < bounds.firstWeek ? bounds.firstWeek : week > bounds.lastWeek ? bounds.lastWeek : week;
}

// Called separately for each day. Connected overlap groups share equal lane
// widths; a lane can be reused as soon as its previous event ends.
export function layoutDayOccurrences(occurrences) {
  const sorted = [...occurrences].sort((a, b) =>
    a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes ||
    a.eventId.localeCompare(b.eventId));
  const result = [];
  let group = [];
  let groupEnd = -1;

  function finishGroup() {
    const laneEnds = [];
    const placed = group.map((occurrence) => {
      let lane = laneEnds.findIndex((end) => end <= occurrence.startMinutes);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = occurrence.endMinutes;
      return { ...occurrence, lane };
    });
    result.push(...placed.map((occurrence) => ({
      ...occurrence, laneCount: laneEnds.length, conflict: group.length > 1,
    })));
    group = [];
  }

  for (const occurrence of sorted) {
    if (group.length && occurrence.startMinutes >= groupEnd) finishGroup();
    if (!group.length) groupEnd = occurrence.endMinutes;
    else groupEnd = Math.max(groupEnd, occurrence.endMinutes);
    group.push(occurrence);
  }
  if (group.length) finishGroup();
  return result;
}

export function buildWeekPreview(prepared, weekStart) {
  if (!weekStart) return { days: [], conflictCount: 0 };
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: addDays(weekStart, index), weekday: index, occurrences: [],
  }));
  const weekEnd = days[6].date;

  for (const entry of prepared.validEvents) {
    const { event, firstDate, lastDate, startMinutes, endMinutes } = entry;
    const date = prepared.kind === "class"
      ? firstWeekdayOnOrAfter(weekStart, event.componentDay) : firstDate;
    if (date < firstDate || date > lastDate || date < weekStart || date > weekEnd) continue;

    days.find((day) => day.date === date).occurrences.push({
      eventId: event.id, courseId: event.courseId, date, startMinutes, endMinutes,
      courseCode: event.courseCode,
      label: prepared.kind === "class" ? event.component || "Class event" : event.examType || "Exam",
      room: event.room,
    });
  }

  const conflicts = new Set();
  for (const day of days) {
    day.occurrences = layoutDayOccurrences(day.occurrences);
    for (const occurrence of day.occurrences) {
      if (occurrence.conflict) conflicts.add(occurrence.eventId);
    }
  }
  return {
    days: days.filter((day) => prepared.visibleWeekdays.includes(day.weekday)),
    conflictCount: conflicts.size,
  };
}
