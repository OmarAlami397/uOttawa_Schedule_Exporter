export default function MainView({ extension, parsing, onStart }) {
  const { user, pageType, busy, status, signIn, signOut } = extension;
  const disabled = busy || parsing || !pageType;

  return (
    <div id="main-view">
      <h1>Schedule Exporter</h1>

      <div className="button-container">
        {!user && (
          <button id="signInButton" disabled={disabled} onClick={signIn}>
            Sign In with Google
          </button>
        )}

        {user && (
          <button id="exportToGoogleButton" disabled aria-describedby="google-export-note">
            Export to Google Calendar
          </button>
        )}

        <button id="exportAsICSButton" className="secondary" disabled={disabled} onClick={onStart}>
          Export as .ICS File
        </button>

        {user && (
          <button
            id="signOutButton"
            className="secondary"
            disabled={busy || parsing}
            onClick={signOut}
          >
            Sign Out
          </button>
        )}
      </div>

      {user && (
        <p id="google-export-note" className="export-description">
          Google Calendar export is not available yet. You can export an .ICS file.
        </p>
      )}

      <p id="status" role="status">
        {status}
      </p>

      {user && <p id="userInfo">Signed in as: {user.email}</p>}
    </div>
  );
}
