import { firstWeekdayOnOrAfter, isIsoDate } from "./schedule-preview.js";

/** Format a calendar date and wall-clock time without DST normalization. */
function formatIcsDate(date, time) {
  if (!isIsoDate(date) || !time || !Number.isInteger(time.hours) ||
      !Number.isInteger(time.minutes) || time.hours < 0 || time.hours > 23 ||
      time.minutes < 0 || time.minutes > 59) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.replaceAll("-", "")}T${pad(time.hours)}${pad(time.minutes)}00`;
}

/**
 * Parse times like:
 * "2:00PM - 5:00PM"
 * "9AM – 12PM"
 */
function parseTimes(timeStr) {
  if (!timeStr || timeStr === "N/A") return null;

  const parts = timeStr.split(/\s*[-–]\s*/);
  if (parts.length !== 2) return null;

  const convert = (t) => {
    const s = t.toUpperCase().replace(/\s+/g, "");
    const isPM = s.includes("PM");
    const isAM = s.includes("AM");

    let time = s.replace(/[AP]M/, "");
    let [h, m] = time.split(":").map(Number);

    if (Number.isNaN(h)) return null;
    if (Number.isNaN(m)) m = 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return { hours: h, minutes: m };
  };

  const start = convert(parts[0]);
  const end = convert(parts[1]);

  return start && end ? { start, end } : null;
}

/**
 * Convert the source MM/DD/YYYY value to a validated calendar date.
 */
function sourceDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return null;

  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const date = `${parts[2].padStart(4, "0")}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  return isIsoDate(date) ? date : null;
}

/**
 * Day mapping for RRULE
 */
const DAY_MAP = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
  Sunday: "SU",
};

/**
 * Minimal ICS escaping
 */
function icsEscape(str) {
  return String(str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Export to ICS
 */
export function exportToIcs(data, type, { filename = `uOttawa_Schedule_${Date.now()}.ics` } = {}) {
  const events = [];
  const prodId = "-//uO Schedule Sync//EN";

  data.forEach((item) => {
    const uid = `uO-${Date.now()}-${Math.random().toString(36).slice(2)}@uottawa`;

    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const event = ["BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${dtStamp}`];

    if (type === "My Class Schedule") {
      const times = parseTimes(item.componentTime);
      if (!times) return;

      const rangeStart = sourceDate(item.startDate);
      const rangeEnd = sourceDate(item.endDate);
      const byDay = DAY_MAP[item.componentDay];
      if (!rangeStart || !rangeEnd || !byDay) return;

      // Start on the first scheduled weekday on or after the term start.
      const first = firstWeekdayOnOrAfter(rangeStart, item.componentDay);

      const dtStart = formatIcsDate(first, times.start);
      const dtEnd = formatIcsDate(first, times.end);
      if (!dtStart || !dtEnd) return;

      const until = formatIcsDate(rangeEnd, {
        hours: 23,
        minutes: 59,
      });
      if (!until || first > rangeEnd) return;

      event.push(
        `SUMMARY:${icsEscape(`${item.courseCode} (${item.component})`)}`,
        `DESCRIPTION:${icsEscape(`${item.courseName}\nInstructor: ${item.instructor}`)}`,
        `LOCATION:${icsEscape(item.room)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${until};BYDAY=${byDay}`,
      );
    } else {
      // Exams
      const times = parseTimes(item.schedule);
      if (!times) return;

      const date = sourceDate(item.examDate);
      const dtStart = formatIcsDate(date, times.start);
      const dtEnd = formatIcsDate(date, times.end);
      if (!dtStart || !dtEnd) return;

      const details = [item.courseName];
      if (item.description !== item.courseName) details.push(item.description);
      details.push(`Type: ${item.examType}`);
      event.push(
        `SUMMARY:${icsEscape(`Exam: ${item.courseCode}`)}`,
        `DESCRIPTION:${icsEscape(details.filter(Boolean).join("\n"))}`,
        `LOCATION:${icsEscape(item.room)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
      );
    }

    event.push("END:VEVENT");
    events.push(event.join("\r\n"));
  });

  if (!events.length) {
    console.error("No valid events to export");
    return 0;
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `PRODID:${prodId}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return events.length;
}
