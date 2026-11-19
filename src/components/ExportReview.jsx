import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CLASS_PAGE, validateReview } from "../state/review-state.js";
import {
  addDays, buildWeekPreview, clampPreviewWeek, initialPreviewWeek, preparePreview,
} from "../services/schedule-preview.js";
import CourseCard from "./CourseCard.jsx";
import WeeklyPreview from "./WeeklyPreview.jsx";

export default function ExportReview({ review, pageType, dispatch, onConfirm, onCancel }) {
  const isClass = pageType === CLASS_PAGE;
  const [errors, setErrors] = useState([]);
  const [exportError, setExportError] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const prepared = useMemo(() => preparePreview(review.events, isClass ? "class" : "exam"), [review.events, isClass]);
  const [selectedWeek, setSelectedWeek] = useState(() => initialPreviewWeek(prepared.bounds));
  const weekStart = clampPreviewWeek(selectedWeek, prepared.bounds);
  const preview = useMemo(() => buildWeekPreview(prepared, weekStart), [prepared, weekStart]);
  const warnings = useMemo(() => review.events.map((event) => ({
    event, issues: prepared.issues.filter((issue) => issue.id === event.id),
  })).filter((warning) => warning.issues.length), [review.events, prepared]);

  useEffect(() => {
    setSelectedWeek(weekStart);
  }, [weekStart]);

  const listRef = useRef(null);
  const cancelRef = useRef(null);
  const pendingFocus = useRef(null);
  const tabRefs = useRef({});

  const visibleRemoveButtons = () =>
    Array.from(listRef.current.querySelectorAll(".remove-event")).filter(
      (button) => !button.closest("[hidden]"),
    );

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;

    pendingFocus.current = null;
    if (target.kind === "invalid" || target.kind === "event") {
      const input = document.getElementById(`${target.id}-${target.field}`);
      const scrollTarget = target.kind === "event" ? input?.closest(".export-item") : input;
      scrollTarget?.scrollIntoView({ block: "nearest", inline: "nearest" });
      input?.focus({ preventScroll: true });
      if (target.kind === "invalid") input?.reportValidity();
    } else {
      listRef.current.scrollTop = target.scrollTop;
      const buttons = visibleRemoveButtons();
      (buttons[Math.min(target.index, buttons.length - 1)] || cancelRef.current).focus({
        preventScroll: true,
      });
    }
  }, [review, errors, activeTab]);

  function revealEvent(id, field) {
    pendingFocus.current = { kind: "event", id, field: field || "startTime" };
    setActiveTab("edit");
    if (field) setErrors(prepared.issues);
    dispatch({ type: "reveal", id });
  }

  function navigateTabs(event) {
    let next;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") next = activeTab === "edit" ? "preview" : "edit";
    else if (event.key === "Home") next = "edit";
    else if (event.key === "End") next = "preview";
    else return;
    event.preventDefault();
    setActiveTab(next);
    tabRefs.current[next].focus();
  }

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
    if (!review.events.length) return;

    const validation = validateReview(review, pageType);
    setErrors(validation);
    if (validation.length) {
      pendingFocus.current = { kind: "invalid", ...validation[0] };
      setActiveTab("edit");
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
      <header className="review-heading">
        <h2 id="export-title">{isClass ? "Review Class Schedule" : "Review Exam Schedule"}</h2>
        <p id="export-count" role="status" aria-live="polite">
          {review.events.length} {review.events.length === 1 ? "event" : "events"} to export
        </p>
      </header>

      <div className="review-tabs" role="tablist" aria-label="Schedule review">
        {[["edit", "Edit events"], ["preview", "Weekly preview"]].map(([tab, label]) => (
          <button key={tab} id={`review-tab-${tab}`} type="button" role="tab"
            aria-selected={activeTab === tab} aria-controls={`review-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1} ref={(element) => { tabRefs.current[tab] = element; }}
            onClick={() => setActiveTab(tab)} onKeyDown={navigateTabs}>
            {label}
          </button>
        ))}
      </div>

      <div id="review-panel-edit" className="review-panel" role="tabpanel" aria-labelledby="review-tab-edit" hidden={activeTab !== "edit"}>
        <div id="export-list" ref={listRef}>
          {review.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              events={review.events.filter((event) => event.courseId === course.id)}
              isClass={isClass}
              errors={errors}
              dispatch={dispatch}
              onEdit={edit}
              onRemove={remove}
            />
          ))}

          {!review.events.length && (
            <p className="export-empty">No events left to export. Cancel to start again.</p>
          )}
        </div>
      </div>

      <div id="review-panel-preview" className="review-panel preview-panel" role="tabpanel"
        aria-labelledby="review-tab-preview" hidden={activeTab !== "preview"}>
        <WeeklyPreview {...preview} weekStart={weekStart} bounds={prepared.bounds}
          startMinutes={prepared.startMinutes} endMinutes={prepared.endMinutes}
          warnings={warnings} hasEvents={review.events.length > 0}
          isActive={activeTab === "preview"}
          onNavigate={(offset) => setSelectedWeek(addDays(weekStart, offset))}
          onSelectEvent={revealEvent} />
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
          disabled={!review.events.length}
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
