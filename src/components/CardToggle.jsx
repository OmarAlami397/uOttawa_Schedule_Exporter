export default function CardToggle({ title, contentId, expanded, onToggle }) {
  return (
    <button
      type="button"
      className="card-toggle"
      aria-controls={contentId}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      {title}
    </button>
  );
}
