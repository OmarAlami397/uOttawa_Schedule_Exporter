import CardToggle from "./CardToggle.jsx";
import MeetingCard from "./MeetingCard.jsx";

export default function CourseCard({
  course,
  meetings,
  isClass,
  errors,
  dispatch,
  onEdit,
  onRemove,
}) {
  const headingId = `${course.id}-title`;
  const contentId = `${course.id}-content`;
  const name = meetings[0].courseName || meetings[0].description;

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
          onClick={(event) =>
            onRemove(
              meetings.map((meeting) => meeting.id),
              event.currentTarget,
            )
          }
        >
          Remove class
        </button>
      </div>

      {name && <p className="course-name">{name}</p>}

      <div id={contentId} className="card-content course-content" hidden={!course.expanded}>
        {meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
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
