import { useLayoutEffect, useRef } from "react";
import { CLASS_PAGE } from "../state/review-state.js";
import BrandHeading from "./BrandHeading.jsx";

function detectionCopy(phase, pageType) {
  switch (phase) {
    case "checking":
      return { heading: "Checking the schedule page…", detail: "Looking for a class or exam schedule in your current tab." };
    case "reading":
      return { heading: "Reading your schedule…", detail: "Gathering the events for your review." };
    case "check-error":
      return { heading: "Couldn’t check this page", detail: "Open your schedule in uoZone and try again." };
    case "unsupported":
      return { heading: "Open a supported schedule page", detail: "In uoZone, open My Class Schedule or My Exam Schedule, then check again." };
    case "empty":
      return { heading: "No events found", detail: "Check that your schedule has loaded and contains classes or exams, then try again." };
    case "error":
      return { heading: "Couldn’t read this schedule", detail: "Your schedule could not be loaded. Try reading it again." };
    default:
      return {
        heading: pageType === CLASS_PAGE ? "Class schedule detected" : "Exam schedule detected",
        detail: "Review the details before creating your calendar file.",
      };
  }
}

export default function MainView({
  extension,
  phase = "ready",
  onStart,
  onRetry,
  exportResult,
  onResumeReview,
}) {
  const { user, pageType, busy, status, signIn, signOut } = extension;
  const waiting = phase === "checking" || phase === "reading";
  const ready = phase === "ready" && Boolean(pageType);
  const needsRetry = ["unsupported", "check-error", "error", "empty"].includes(phase);
  const copy = detectionCopy(phase, pageType);
  const isClassExport = exportResult?.pageType === CLASS_PAGE;
  const accountActionRef = useRef(null);
  const resultHeadingRef = useRef(null);
  const accountFocusRequested = useRef(false);

  useLayoutEffect(() => {
    if (exportResult) resultHeadingRef.current?.focus();
  }, [exportResult]);

  useLayoutEffect(() => {
    if (!accountFocusRequested.current) return;
    accountActionRef.current?.focus();
    accountFocusRequested.current = false;
  }, [user]);

  function changeAccount(action) {
    accountFocusRequested.current = true;
    action();
  }

  return (
    <div id="main-view">
      <BrandHeading>Schedule Exporter</BrandHeading>

      {exportResult ? (
        <section className="popup-export-result" aria-labelledby="popup-export-result-heading">
          <div role="status" aria-live="polite" aria-atomic="true">
            <h2 id="popup-export-result-heading" tabIndex={-1} ref={resultHeadingRef}>Calendar file created</h2>
            <p className="popup-export-filename">{exportResult.filename}</p>
            <p>
              Download requested for {exportResult.eventCount}{" "}
              {isClassExport
                ? exportResult.eventCount === 1 ? "recurring class event" : "recurring class events"
                : exportResult.eventCount === 1 ? "exam" : "exams"}.
            </p>
          </div>
          <details className="popup-import-help">
            <summary>How do I add this to my calendar?</summary>
            <p>Open your calendar’s import option and select the downloaded .ICS file. Choose the calendar you want to add it to, then confirm the import.</p>
          </details>
          <button type="button" className="primary popup-resume-review" onClick={onResumeReview}>
            Back to review
          </button>
        </section>
      ) : (
        <>
          <div id="status" className={`popup-detection popup-detection-${phase}`} role="status" aria-live="polite" aria-atomic="true">
            <strong>{copy.heading}</strong>
            <p>{copy.detail}</p>
          </div>

          {!waiting && (
            <div className="button-container">
              {ready ? (
                <>
                  <button id="exportAsICSButton" type="button" className="primary" disabled={busy} onClick={onStart}>
                    Review schedule
                  </button>
                  <p className="popup-no-signin">No sign-in required · Export a calendar file</p>
                </>
              ) : needsRetry ? (
                <button type="button" className="primary popup-retry" disabled={busy} onClick={onRetry}>
                  {phase === "unsupported" ? "Check again" : "Try again"}
                </button>
              ) : null}
            </div>
          )}
        </>
      )}

      {!waiting && status && <p className="popup-session-status" role="status">{status}</p>}

      {!waiting && (
        <section className="popup-account" aria-labelledby="popup-account-heading">
          <div className="popup-account-heading">
            <h2 id="popup-account-heading">Google account</h2>
            <span className="popup-account-badge">{user ? "Connected" : "Optional"}</span>
          </div>
          <div className="popup-account-content">
            {user ? (
              <>
                <p id="userInfo">Signed in as {user.email}</p>
                <button id="exportToGoogleButton" type="button" disabled aria-describedby="google-export-note">
                  Export to Google Calendar
                </button>
                <button id="signOutButton" ref={accountActionRef} type="button" className="secondary" disabled={busy} onClick={() => changeAccount(signOut)}>
                  Sign out
                </button>
              </>
            ) : (
              <button id="signInButton" ref={accountActionRef} type="button" className="secondary" disabled={busy}
                aria-describedby="google-export-note" onClick={() => changeAccount(signIn)}>
                Sign in with Google
              </button>
            )}
            <p id="google-export-note" className="export-description">
              Direct Google Calendar export is currently unavailable.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
