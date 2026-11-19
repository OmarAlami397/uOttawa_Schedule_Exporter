import { DAYS, isIsoDate, validateEvent } from "../services/schedule-preview.js";

export { DAYS };
export const CLASS_PAGE = "My Class Schedule";
export const EXAM_PAGE = "My Exam Schedule";

export function dateToInput(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";

  const result = `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  return isIsoDate(result) ? result : "";
}

function dateFromInput(value) {
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

export function timeToInput(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);

  if (minutes > 59 || (match[3] ? hours < 1 || hours > 12 : hours > 23)) return "";
  if (match[3]) hours = (hours % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const emptyReview = { courses: [], events: [] };

export function createReview(data, pageType) {
  const courses = new Map();
  const events = data.map((item, index) => {
    const courseCode = String(item.courseCode ?? "");
    const prefix = courseCode.split("-")[0].trim() || "Untitled course";

    if (!courses.has(prefix)) {
      courses.set(prefix, {
        id: `course-${courses.size}`,
        code: prefix,
        expanded: false,
      });
    }

    const parts = String(
      pageType === CLASS_PAGE ? (item.componentTime ?? "") : (item.schedule ?? ""),
    ).split(/\s*[-\u2013]\s*/);

    // Explicitly read public properties: Exam stores its values behind getters.
    return {
      id: `event-${index}`,
      courseId: courses.get(prefix).id,
      courseCode,
      courseName: String(item.courseName ?? ""),
      component: String(item.component ?? ""),
      componentDay: DAYS.includes(item.componentDay) ? item.componentDay : "",
      room: String(item.room ?? ""),
      instructor: String(item.instructor ?? ""),
      description: String(item.description ?? ""),
      examType: String(item.examType ?? ""),
      startDate: dateToInput(item.startDate),
      endDate: dateToInput(item.endDate),
      examDate: dateToInput(item.examDate),
      startTime: parts.length === 2 ? timeToInput(parts[0]) : "",
      endTime: parts.length === 2 ? timeToInput(parts[1]) : "",
      expanded: true,
    };
  });

  return { courses: [...courses.values()], events };
}

export function reviewReducer(state, action) {
  switch (action.type) {
    case "reset":
      return action.review;

    case "edit":
      return {
        ...state,
        events: state.events.map((item) =>
          item.id === action.id ? { ...item, [action.field]: action.value } : item,
        ),
      };

    case "toggle-course":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.id ? { ...course, expanded: !course.expanded } : course,
        ),
      };

    case "toggle-event":
      return {
        ...state,
        events: state.events.map((item) =>
          item.id === action.id ? { ...item, expanded: !item.expanded } : item,
        ),
      };

    case "remove": {
      const events = state.events.filter((item) => !action.ids.includes(item.id));

      return {
        events,
        courses: state.courses.filter((course) =>
          events.some((item) => item.courseId === course.id),
        ),
      };
    }

    case "reveal": {
      const event = state.events.find((item) => item.id === action.id);

      return {
        events: state.events.map((item) =>
          item.id === action.id ? { ...item, expanded: true } : item,
        ),
        courses: state.courses.map((course) =>
          course.id === event?.courseId ? { ...course, expanded: true } : course,
        ),
      };
    }

    default:
      return state;
  }
}

export function validateReview(review, pageType) {
  return review.events.flatMap((item) =>
    validateEvent(item, pageType === CLASS_PAGE ? "class" : "exam"));
}

export function toExportData(review, pageType) {
  return review.events.map((item) => {
    const common = { courseCode: item.courseCode, room: item.room };
    const time = `${item.startTime} - ${item.endTime}`;

    return pageType === CLASS_PAGE
      ? {
          ...common,
          courseName: item.courseName,
          component: item.component,
          componentDay: item.componentDay,
          componentTime: time,
          instructor: item.instructor,
          startDate: dateFromInput(item.startDate),
          endDate: dateFromInput(item.endDate),
        }
      : {
          ...common,
          description: item.description,
          examType: item.examType,
          examDate: dateFromInput(item.examDate),
          schedule: time,
        };
  });
}
