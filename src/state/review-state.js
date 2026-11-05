export const CLASS_PAGE = "My Class Schedule";
export const EXAM_PAGE = "My Exam Schedule";
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return (
    year > 0 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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

export const emptyReview = { courses: [], meetings: [] };

export function createReview(data, pageType) {
  const courses = new Map();
  const meetings = data.map((item, index) => {
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
      id: `meeting-${index}`,
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

  return { courses: [...courses.values()], meetings };
}

export function reviewReducer(state, action) {
  switch (action.type) {
    case "reset":
      return action.review;

    case "edit":
      return {
        ...state,
        meetings: state.meetings.map((item) =>
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

    case "toggle-meeting":
      return {
        ...state,
        meetings: state.meetings.map((item) =>
          item.id === action.id ? { ...item, expanded: !item.expanded } : item,
        ),
      };

    case "remove": {
      const meetings = state.meetings.filter((item) => !action.ids.includes(item.id));

      return {
        meetings,
        courses: state.courses.filter((course) =>
          meetings.some((item) => item.courseId === course.id),
        ),
      };
    }

    case "reveal": {
      const meeting = state.meetings.find((item) => item.id === action.id);

      return {
        meetings: state.meetings.map((item) =>
          item.id === action.id ? { ...item, expanded: true } : item,
        ),
        courses: state.courses.map((course) =>
          course.id === meeting?.courseId ? { ...course, expanded: true } : course,
        ),
      };
    }

    default:
      return state;
  }
}

export function validateReview(review, pageType) {
  const errors = [];

  for (const item of review.meetings) {
    const add = (field, message) => errors.push({ id: item.id, field, message });

    if (pageType === CLASS_PAGE && !DAYS.includes(item.componentDay))
      add("componentDay", "Choose a day.");

    const dates = pageType === CLASS_PAGE ? ["startDate", "endDate"] : ["examDate"];
    for (const field of dates) {
      if (!isIsoDate(item[field])) add(field, "Enter a valid date.");
    }
    if (
      pageType === CLASS_PAGE &&
      item.startDate &&
      item.endDate &&
      item.endDate < item.startDate
    ) {
      add("endDate", "End date must be on or after the start date.");
    }

    for (const field of ["startTime", "endTime"]) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item[field])) add(field, "Enter a valid time.");
    }
    if (item.startTime && item.endTime && item.endTime <= item.startTime) {
      add("endTime", "End time must be after the start time.");
    }

    if (pageType === CLASS_PAGE && !errors.some((error) => error.id === item.id)) {
      const first = new Date(`${item.startDate}T00:00:00`);
      const dayOffset = (((DAYS.indexOf(item.componentDay) + 1) % 7) - first.getDay() + 7) % 7;
      first.setDate(first.getDate() + dayOffset);
      if (first > new Date(`${item.endDate}T00:00:00`)) {
        add("endDate", "This date range does not include the selected weekday.");
      }
    }
  }

  return errors;
}

export function toExportData(review, pageType) {
  return review.meetings.map((item) => {
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
