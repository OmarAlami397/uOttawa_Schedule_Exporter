import CardToggle from "./CardToggle.jsx";
import EditableField from "./EditableField.jsx";
import { componentLabel, eventIssues, eventSummary } from "../services/event-summary.js";

export default function EventCard({ event, isClass, errors, dispatch, onEdit, onRemove }) {
  const headingId = `${event.id}-title`;
  const contentId = `${event.id}-content`;
  const title = componentLabel(event, isClass);
  const issues = eventIssues(event, isClass);
  const field = (name, label, type) => (
    <EditableField record={event} field={name} label={label} type={type}
      error={errors.find((error) => error.id === event.id && error.field === name)?.message}
      onEdit={onEdit} />
  );

  return (
    <article className="export-item" aria-labelledby={headingId} data-event-id={event.id}>
      <div className="export-item-header">
        <h4 id={headingId}><CardToggle title={title} contentId={contentId} expanded={event.expanded}
          onToggle={() => dispatch({ type: "toggle-event", id: event.id })} /></h4>
        {issues.length > 0 && <span className="popup-issue-badge">Needs attention</span>}
        <button type="button" className="remove-event" aria-label={`Remove ${event.courseCode} ${title}`}
          onClick={() => onRemove([event.id])}>Remove</button>
      </div>
      {!event.expanded && <p className="popup-event-summary">{eventSummary(event, isClass)}</p>}
      <div id={contentId} className="card-content" hidden={!event.expanded}>
        <div className="event-fields">
          <div className={`event-details${isClass ? "" : " event-details-exam"}`}>
            {field("courseCode", "Course code")}
            {isClass ? field("component", "Component") : field("description", "Description")}
            {isClass && field("componentDay", "Day", "select")}
            {field("room", "Location")}
          </div>
          <div className={`event-schedule${isClass ? "" : " event-schedule-exam"}`}>
            {isClass ? <>
              {field("startDate", "Start date", "date")}
              {field("endDate", "End date", "date")}
            </> : field("examDate", "Exam date", "date")}
            {field("startTime", "Start time", "time")}
            {field("endTime", "End time", "time")}
          </div>
        </div>
      </div>
    </article>
  );
}
