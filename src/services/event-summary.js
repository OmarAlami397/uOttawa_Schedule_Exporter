import { calendarDate, formatTime, isIsoDate, timeToMinutes, validateEvent } from "./schedule-preview.js";

const COMPONENT_NAMES = { LEC: "Lecture", LAB: "Lab", DGD: "Discussion", TUT: "Tutorial", SEM: "Seminar" };

export function componentLabel(event, isClass) {
  return isClass ? COMPONENT_NAMES[event.component] || event.component || "Class event" : event.examType || "Exam";
}

export function eventIssues(event, isClass) {
  return validateEvent(event, isClass ? "class" : "exam");
}

export function eventSummary(event, isClass) {
  const start = timeToMinutes(event.startTime);
  const end = timeToMinutes(event.endTime);
  const day = isClass ? event.componentDay : isIsoDate(event.examDate)
    ? calendarDate(event.examDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "Date needed";
  const time = start !== null && end !== null && end > start
    ? `${formatTime(start)}–${formatTime(end)}` : "Time needs attention";
  return [day || "Day needed", time, event.room || "Room not provided"].join(" · ");
}
