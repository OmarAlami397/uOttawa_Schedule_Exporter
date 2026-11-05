import { useLayoutEffect, useRef } from "react";
import { DAYS } from "../state/review-state.js";

export default function EditableField({ meeting, field, label, type = "text", error, onEdit }) {
  const inputRef = useRef(null);
  const id = `${meeting.id}-${field}`;
  const required = ["date", "time", "select"].includes(type);

  useLayoutEffect(() => {
    inputRef.current.setCustomValidity(error || "");
  }, [error]);

  const props = {
    id,
    ref: inputRef,
    value: meeting[field],
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    onChange: (event) => onEdit(meeting.id, field, event.target.value),
  };

  return (
    <div className="export-field">
      <label htmlFor={id}>{label}</label>

      {type === "select" ? (
        <select {...props}>
          <option value="">Choose a day</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      ) : (
        <input {...props} type={type} />
      )}

      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
