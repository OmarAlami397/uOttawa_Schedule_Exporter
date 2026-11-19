import CardToggle from "./CardToggle.jsx";
import EventCard from "./EventCard.jsx";

export default function CourseCard({
  course,
  events,
  isClass,
  errors,
  dispatch,
  onEdit,
  onRemove,
}) {
  const headingId = `${course.id}-title`;
  const contentId = `${course.id}-content`;
  const name = events[0].courseName || events[0].description;

  return (
    <section className="course-card" aria-labelledby={headingId}>
      <div className="export-item-header">
        <h3 id={headingId}>
          <CardToggle
            title={course.code}
            contentId={contentId}
            expanded={course.expanded}
            onToggle={() => dispatch({ type: "toggle-course", id: course.id })}
          />
        </h3>

        <button
          type="button"
          className="remove-event"
          aria-label={`Remove all events for ${course.code}`}
          onClick={(clickEvent) =>
            onRemove(
              events.map((event) => event.id),
              clickEvent.currentTarget,
            )
          }
        >
          Remove class
        </button>
      </div>

      {name && <p className="course-name">{name}</p>}

      <div id={contentId} className="card-content course-content" hidden={!course.expanded}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isClass={isClass}
            errors={errors}
            dispatch={dispatch}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
