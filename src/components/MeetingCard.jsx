import CardToggle from "./CardToggle.jsx";
import EditableField from "./EditableField.jsx";

export default function MeetingCard({ meeting, isClass, errors, dispatch, onEdit, onRemove }) {
  const headingId = `${meeting.id}-title`;
  const contentId = `${meeting.id}-content`;
  const title = isClass ? meeting.component || "Class meeting" : meeting.examType || "Exam";

  const field = (name, label, type) => (
    <EditableField
      meeting={meeting}
      field={name}
      label={label}
      type={type}
      error={errors.find((error) => error.id === meeting.id && error.field === name)?.message}
      onEdit={onEdit}
    />
  );

  return (
    <article className="export-item" aria-labelledby={headingId}>
      <div className="export-item-header">
        <h4 id={headingId}>
          <CardToggle
            title={title}
            contentId={contentId}
            expanded={meeting.expanded}
            onToggle={() => dispatch({ type: "toggle-meeting", id: meeting.id })}
          />
        </h4>

        <button
          type="button"
          className="remove-event"
          aria-label={`Remove ${meeting.courseCode} ${title}`}
          onClick={(event) => onRemove([meeting.id], event.currentTarget)}
        >
          Remove
        </button>
      </div>

      <div id={contentId} className="card-content" hidden={!meeting.expanded}>
        {meeting.room && <p className="export-item-context">{meeting.room}</p>}

        <div className="meeting-fields">
          <div className={`meeting-details${isClass ? "" : " meeting-details-exam"}`}>
            {field("courseCode", "Course Code")}
            {isClass ? field("component", "Component") : field("description", "Description")}
            {isClass && field("componentDay", "Day", "select")}
          </div>

          <div className={`meeting-schedule${isClass ? "" : " meeting-schedule-exam"}`}>
            {isClass ? (
              <>
                {field("startDate", "Start date", "date")}
                {field("endDate", "End date", "date")}
              </>
            ) : (
              field("examDate", "Exam date", "date")
            )}
            {field("startTime", "Start time", "time")}
            {field("endTime", "End time", "time")}
          </div>
        </div>
      </div>
    </article>
  );
}
