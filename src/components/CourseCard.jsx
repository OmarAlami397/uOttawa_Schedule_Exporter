import CardToggle from "./CardToggle.jsx";
import EventCard from "./EventCard.jsx";
import { componentLabel, eventIssues, eventSummary } from "../services/event-summary.js";

export default function CourseCard({ course, events, isClass, errors, dispatch, onEdit, onRemove, onReveal }) {
  const headingId = `${course.id}-title`;
  const contentId = `${course.id}-content`;
  const name = events[0]?.courseName || events[0]?.description;
  const issueCount = events.filter((event) => eventIssues(event, isClass).length).length;

  return (
    <section className="course-card" aria-labelledby={headingId}>
      <div className="export-item-header">
        <h3 id={headingId}><CardToggle title={course.code} contentId={contentId} expanded={course.expanded}
          onToggle={() => dispatch({ type: "toggle-course", id: course.id })} /></h3>
        <span className="popup-event-count">{events.length} {events.length === 1 ? "event" : "events"}</span>
        {issueCount > 0 && <span className="popup-issue-badge">{issueCount} {issueCount === 1 ? "needs" : "need"} attention</span>}
        <button type="button" className="remove-event" aria-label={`Remove all events for ${course.code}`}
          onClick={() => onRemove(events.map((item) => item.id))}>
          Remove {isClass ? "class" : "course"}
        </button>
      </div>
      {name && <p className="course-name">{name}</p>}
      {!course.expanded && (
        <ul className="popup-course-summaries" aria-label={`${course.code} event summaries`}>
          {events.map((event) => <li key={event.id}>
            <button type="button" className="popup-summary-link" onClick={() => onReveal(event.id)}
              aria-label={`Edit ${event.courseCode} ${componentLabel(event, isClass)}: ${eventSummary(event, isClass)}`}>
              <span className="popup-component-label">{componentLabel(event, isClass)}</span>
              <span>{eventSummary(event, isClass)}</span>
            </button>
          </li>)}
        </ul>
      )}
      <div id={contentId} className="card-content course-content" hidden={!course.expanded}>
        {events.map((event) => <EventCard key={event.id} event={event} isClass={isClass} errors={errors}
          dispatch={dispatch} onEdit={onEdit} onRemove={onRemove} />)}
      </div>
    </section>
  );
}
