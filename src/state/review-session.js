import { reviewReducer } from "./review-state.js";

export function createReviewSession(review) {
  return { review, lastRemoval: null };
}

function indexed(items, predicate) {
  return items.flatMap((item, index) => predicate(item) ? [{ item, index }] : []);
}

function restore(items, removed) {
  const result = [...items];
  for (const { item, index } of removed) {
    if (!result.some((current) => current.id === item.id)) result.splice(index, 0, item);
  }
  return result;
}

export function reviewSessionReducer(state, action) {
  if (action.type === "reset") return createReviewSession(action.review);
  if (action.type === "expand-all") {
    return {
      ...state,
      review: {
        courses: state.review.courses.map((course) => ({ ...course, expanded: action.expanded })),
        events: state.review.events.map((event) => ({ ...event, expanded: action.expanded })),
      },
    };
  }
  if (action.type === "remove") {
    const review = reviewReducer(state.review, action);
    const events = indexed(state.review.events, (event) => action.ids.includes(event.id));
    if (!events.length) return state;
    const courses = indexed(state.review.courses, (course) => !review.courses.some((current) => current.id === course.id));
    const label = courses.length === 1
      ? `${courses[0].item.code} and ${events.length} ${events.length === 1 ? "event" : "events"} removed.`
      : `${events.length} ${events.length === 1 ? "event" : "events"} removed.`;
    return { review, lastRemoval: { courses, events, label } };
  }
  if (action.type === "undo-remove") {
    if (!state.lastRemoval) return state;
    return {
      review: {
        courses: restore(state.review.courses, state.lastRemoval.courses),
        events: restore(state.review.events, state.lastRemoval.events),
      },
      lastRemoval: null,
    };
  }
  if (action.type === "dismiss-removal") {
    // A timeout from an earlier removal must leave a newer Undo notice intact.
    if (!state.lastRemoval || (action.removal && action.removal !== state.lastRemoval)) return state;
    return { ...state, lastRemoval: null };
  }
  return { ...state, review: reviewReducer(state.review, action) };
}
