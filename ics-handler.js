/**
 * Format JS Date → ICS floating DATE-TIME (YYYYMMDDTHHMMSS)
 */
function formatIcsDate(date) {
  if (!date || isNaN(date.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
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
 * Create Date from MM/DD/YYYY + time (LOCAL time, no UTC shift)
 */
function createSafeDate(dateStr, time) {
  if (!dateStr || dateStr === "N/A") return null;

  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if ([month, day, year].some(Number.isNaN)) return null;

  const h = time?.hours ?? 0;
  const m = time?.minutes ?? 0;

  const date = new Date(year, month, day, h, m, 0);
  return isNaN(date.getTime()) ? null : date;
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
export function exportToIcs(data, type) {
  const events = [];
  const prodId = "-//uO Schedule Sync//EN";

  data.forEach((item) => {
    const uid = `uO-${Date.now()}-${Math.random().toString(36).slice(2)}@uottawa`;

    const dtStamp =
      new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const event = ["BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${dtStamp}`];

    if (type === "My Class Schedule") {
      const times = parseTimes(item.componentTime);
      if (!times) return;

      const start = createSafeDate(item.startDate, times.start);
      const end = createSafeDate(item.startDate, times.end);

      const dtStart = formatIcsDate(start);
      const dtEnd = formatIcsDate(end);
      if (!dtStart || !dtEnd) return;

      const untilDate = createSafeDate(item.endDate, {
        hours: 23,
        minutes: 59,
      });
      const until = formatIcsDate(untilDate);
      if (!until) return;

      const byDay = DAY_MAP[item.componentDay] ?? "MO";

      event.push(
        `SUMMARY:${icsEscape(`${item.courseCode} (${item.component})`)}`,
        `DESCRIPTION:${icsEscape(
          `${item.courseName}\nInstructor: ${item.instructor}`
        )}`,
        `LOCATION:${icsEscape(item.room)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${until};BYDAY=${byDay}`
      );
    } else {
      // Exams
      const times = parseTimes(item.schedule);
      if (!times) return;

      const start = createSafeDate(item.examDate, times.start);
      const end = createSafeDate(item.examDate, times.end);

      const dtStart = formatIcsDate(start);
      const dtEnd = formatIcsDate(end);
      if (!dtStart || !dtEnd) return;

      event.push(
        `SUMMARY:${icsEscape(`Exam: ${item.courseCode}`)}`,
        `DESCRIPTION:${icsEscape(
          `${item.description}\nType: ${item.examType}`
        )}`,
        `LOCATION:${icsEscape(item.room)}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`
      );
    }

    event.push("END:VEVENT");
    events.push(event.join("\r\n"));
  });

  if (!events.length) {
    console.error("No valid events to export");
    return;
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
  a.download = `uOttawa_Schedule_${Date.now()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
