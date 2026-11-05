import { useLayoutEffect, useRef, useState } from "react";
import { CLASS_PAGE, validateReview } from "../state/review-state.js";
import CourseCard from "./CourseCard.jsx";

export default function ExportReview({ review, pageType, dispatch, onConfirm, onCancel }) {
  const isClass = pageType === CLASS_PAGE;
  const [errors, setErrors] = useState([]);
  const [exportError, setExportError] = useState("");

  const listRef = useRef(null);
  const cancelRef = useRef(null);
  const pendingFocus = useRef(null);

  const visibleRemoveButtons = () =>
    Array.from(listRef.current.querySelectorAll(".remove-event")).filter(
      (button) => !button.closest("[hidden]"),
    );

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;

    pendingFocus.current = null;
    if (target.kind === "invalid") {
      const input = document.getElementById(`${target.id}-${target.field}`);
      input?.focus();
      input?.reportValidity();
    } else {
      listRef.current.scrollTop = target.scrollTop;
      const buttons = visibleRemoveButtons();
      (buttons[Math.min(target.index, buttons.length - 1)] || cancelRef.current).focus({
        preventScroll: true,
      });
    }
  }, [review, errors]);

  function edit(id, field, value) {
    setErrors([]);
    setExportError("");
    dispatch({ type: "edit", id, field, value });
  }

  function remove(ids, button) {
    pendingFocus.current = {
      kind: "remove",
      index: visibleRemoveButtons().indexOf(button),
      scrollTop: listRef.current.scrollTop,
    };

    setErrors([]);
    setExportError("");
    dispatch({ type: "remove", ids });
  }

  function confirm(event) {
    event.preventDefault();
    if (!review.meetings.length) return;

    const validation = validateReview(review, pageType);
    setErrors(validation);
    if (validation.length) {
      pendingFocus.current = { kind: "invalid", ...validation[0] };
      dispatch({ type: "reveal", id: validation[0].id });
      return;
    }

    try {
      onConfirm();
    } catch (error) {
      console.error("Export failed:", error);
      setExportError(error.message || "Export failed. Please try again.");
    }
  }

  return (
    <form id="exporting-view" onSubmit={confirm} noValidate>
      <h2 id="export-title">{isClass ? "Review Class Schedule" : "Review Exam Schedule"}</h2>
      <p className="export-description">
        Adjust dates and times for each meeting. Remove a meeting or an entire class before
        exporting.
      </p>
      <p id="export-count" role="status" aria-live="polite">
        {review.meetings.length} {review.meetings.length === 1 ? "event" : "events"} to export
      </p>

      <div id="export-list" ref={listRef}>
        {review.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            meetings={review.meetings.filter((meeting) => meeting.courseId === course.id)}
            isClass={isClass}
            errors={errors}
            dispatch={dispatch}
            onEdit={edit}
            onRemove={remove}
          />
        ))}

        {!review.meetings.length && (
          <p className="export-empty">No events left to export. Cancel to start again.</p>
        )}
      </div>

      {exportError && (
        <p className="export-error" role="alert">
          {exportError}
        </p>
      )}

      <div className="button-container export-controls">
        <button
          id="exportConfirmButton"
          type="submit"
          className="primary"
          disabled={!review.meetings.length}
        >
          Create .ICS File
        </button>

        <button
          id="exportCancelButton"
          type="button"
          className="secondary"
          ref={cancelRef}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
