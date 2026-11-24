import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CLASS_PAGE, eventsWithCourseNames, validateReview } from "../state/review-state.js";
import { addDays, buildWeekPreview, clampPreviewWeek, initialPreviewWeek, preparePreview } from "../services/schedule-preview.js";
import WeeklyPreview from "./WeeklyPreview.jsx";
import BrandHeading from "./BrandHeading.jsx";
import CourseCard from "./CourseCard.jsx";
import { componentLabel } from "../services/event-summary.js";

const UNDO_TIMEOUT_MS = 10_000;

export default function ExportReview({ review, pageType, dispatch, onConfirm, onCancel, lastRemoval, onUndoRemoval }) {
  const isClass = pageType === CLASS_PAGE;
  const [attempted, setAttempted] = useState(false);
  const [exportError, setExportError] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const events = useMemo(() => eventsWithCourseNames(review), [review]);
  const prepared = useMemo(() => preparePreview(events, isClass ? "class" : "exam"), [events, isClass]);
  const errors = attempted ? prepared.issues : [];
  const [selectedWeek, setSelectedWeek] = useState(() => initialPreviewWeek(prepared.bounds));
  const weekStart = clampPreviewWeek(selectedWeek, prepared.bounds);
  const preview = useMemo(() => buildWeekPreview(prepared, weekStart), [prepared, weekStart]);
  const warnings = useMemo(() => review.events.map((event) => ({
    event, issues: prepared.issues.filter((issue) => issue.id === event.id),
  })).filter((warning) => warning.issues.length), [review.events, prepared]);
  const listRef = useRef(null);
  const headingRef = useRef(null);
  const cancelRef = useRef(null);
  const removalNoticeRef = useRef(null);
  const undoRef = useRef(null);
  const pendingFocus = useRef(null);
  const tabRefs = useRef({});
  const allExpanded = review.courses.length > 0 && review.courses.every((course) => course.expanded) && review.events.every((event) => event.expanded);

  useEffect(() => { setSelectedWeek(weekStart); }, [weekStart]);

  const dismissRemoval = useCallback(() => {
    if (removalNoticeRef.current?.contains(document.activeElement)) {
      cancelRef.current?.focus({ preventScroll: true });
    }
    dispatch({ type: "dismiss-removal", removal: lastRemoval });
  }, [dispatch, lastRemoval]);

  useEffect(() => {
    if (!lastRemoval) return;
    const timeout = setTimeout(dismissRemoval, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [lastRemoval, dismissRemoval]);

  useLayoutEffect(() => {
    headingRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.kind === "event") {
      const input = document.getElementById(`${target.id}-${target.field}`);
      input?.scrollIntoView({ block: "nearest", inline: "nearest" });
      input?.focus({ preventScroll: true });
    } else if (target.kind === "removed") {
      if (listRef.current) listRef.current.scrollTop = target.scrollTop;
      (undoRef.current || cancelRef.current)?.focus({ preventScroll: true });
    } else if (target.kind === "restored") {
      const event = review.events.find((item) => item.id === target.id);
      const course = review.courses.find((item) => item.id === event?.courseId);
      const heading = document.getElementById(`${course?.expanded ? event?.id : course?.id}-title`);
      heading?.scrollIntoView({ block: "nearest", inline: "nearest" });
      (heading?.querySelector("button") || cancelRef.current)?.focus({ preventScroll: true });
    }
  }, [review, activeTab, lastRemoval]);

  function revealEvent(id, field = "startTime") {
    pendingFocus.current = { kind: "event", id, field };
    setActiveTab("edit");
    if (prepared.issues.some((issue) => issue.id === id && issue.field === field)) setAttempted(true);
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
    setExportError("");
    dispatch({ type: "edit", id, field, value });
  }

  function editCourse(id, field, value) {
    setExportError("");
    dispatch({ type: "edit-course", id, field, value });
  }

  function remove(ids) {
    pendingFocus.current = { kind: "removed", scrollTop: listRef.current?.scrollTop || 0 };
    setExportError("");
    dispatch({ type: "remove", ids });
  }

  function undoRemoval() {
    pendingFocus.current = { kind: "restored", id: lastRemoval.events[0].item.id };
    setActiveTab("edit");
    setExportError("");
    onUndoRemoval();
  }

  function confirm(event) {
    event.preventDefault();
    if (!review.events.length) return;
    setAttempted(true);
    const validation = validateReview(review, pageType);
    if (validation.length) {
      revealEvent(validation[0].id, validation[0].field);
      return;
    }
    try { onConfirm(); }
    catch (error) { setExportError(error.message || "The calendar file could not be created. Please try again."); }
  }

  return (
    <form id="exporting-view" onSubmit={confirm} noValidate>
      <header className="review-heading">
        <BrandHeading as="h2" id="export-title" ref={headingRef} tabIndex={-1}>Review {isClass ? "class" : "exam"} schedule</BrandHeading>
        <p id="export-count" role="status" aria-live="polite">
          {review.courses.length} {review.courses.length === 1 ? "course" : "courses"} · {review.events.length} {isClass ? "recurring" : "exam"} {review.events.length === 1 ? "event" : "events"}
        </p>
      </header>
      <div className="review-tabs" role="tablist" aria-label="Schedule review">
        {[["edit", "Edit events"], ["preview", "Weekly preview"]].map(([tab, label]) => (
          <button key={tab} id={`review-tab-${tab}`} type="button" role="tab"
            aria-selected={activeTab === tab} aria-controls={`review-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1} ref={(element) => { tabRefs.current[tab] = element; }}
            onClick={() => setActiveTab(tab)} onKeyDown={navigateTabs}>{label}</button>
        ))}
      </div>
      <div id="review-panel-edit" className="review-panel" role="tabpanel" aria-labelledby="review-tab-edit" hidden={activeTab !== "edit"}>
        <div className="popup-review-tools">
          <p>Expand a course or event to edit its details.</p>
          {review.events.length > 0 && <button type="button" className="popup-text-action"
            onClick={() => dispatch({ type: "expand-all", expanded: !allExpanded })}>{allExpanded ? "Collapse all" : "Expand all"}</button>}
        </div>
        <div id="export-list" ref={listRef}>
          {errors.length > 0 && <section className="popup-error-summary" aria-labelledby="popup-errors-title">
            <h3 id="popup-errors-title">A few details need attention</h3>
            <p>Fix these fields before creating your calendar file.</p>
            <ul>{errors.map((error) => {
              const event = review.events.find((item) => item.id === error.id);
              return <li key={`${error.id}-${error.field}`}><button type="button" className="popup-error-link" onClick={() => revealEvent(error.id, error.field)}>
                {event?.courseCode || "Untitled course"} · {componentLabel(event || {}, isClass)}: {error.message}
              </button></li>;
            })}</ul>
          </section>}
          <p className="sr-only" role="status" aria-live="polite">{attempted ? `${errors.length} ${errors.length === 1 ? "field needs" : "fields need"} attention.` : ""}</p>
          {review.courses.map((course) => <CourseCard key={course.id} course={course}
            events={events.filter((event) => event.courseId === course.id)} isClass={isClass}
            errors={errors} dispatch={dispatch} onEdit={edit} onCourseEdit={editCourse} onRemove={remove} onReveal={revealEvent} />)}
          {!review.events.length && <div className="export-empty"><strong>No events to export</strong><p>{lastRemoval ? "Undo the last removal to bring events back, or go back to start again." : "Go back to review your schedule again."}</p></div>}
        </div>
      </div>
      <div id="review-panel-preview" className="review-panel preview-panel" role="tabpanel" aria-labelledby="review-tab-preview" hidden={activeTab !== "preview"}>
        <WeeklyPreview {...preview} weekStart={weekStart} bounds={prepared.bounds}
          startMinutes={prepared.startMinutes} endMinutes={prepared.endMinutes}
          warnings={warnings} hasEvents={review.events.length > 0} isActive={activeTab === "preview"}
          onNavigate={(offset) => setSelectedWeek(addDays(weekStart, offset))} onSelectEvent={revealEvent} />
      </div>
      {lastRemoval && (
        <div className="popup-removal-notice" ref={removalNoticeRef}>
          <span role="status">{lastRemoval.label}</span>
          <div className="popup-removal-actions">
            <button ref={undoRef} type="button" className="popup-text-action" onClick={undoRemoval}>Undo</button>
            <button type="button" className="popup-text-action popup-dismiss-removal"
              aria-label="Dismiss Undo notice" onClick={dismissRemoval}>×</button>
          </div>
        </div>
      )}
      {exportError && <p className="export-error" role="alert">{exportError}</p>}
      <div className="button-container export-controls">
        <button id="exportConfirmButton" type="submit" className="primary" disabled={!review.events.length}>Create .ICS file</button>
        <button id="exportCancelButton" type="button" className="secondary" ref={cancelRef} onClick={onCancel}>Back</button>
      </div>
    </form>
  );
}
