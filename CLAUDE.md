# Project overview

Schedule Exporter for uOttawa is a Chrome Manifest V3 extension. It reads the
university's **My Class Schedule** and **My Exam Schedule** pages, lets users edit
and preview events in a React popup, and downloads an ICS calendar file.

Google sign-in/sign-out is implemented. Direct Google Calendar export is disabled;
keep it disabled unless the requested work explicitly includes implementing it.
Reviews currently live in memory; closing the popup loses edits.

## Setup and commands

- Use Node.js **22.12.0 or newer** and npm. Dependencies are locked in
  `package-lock.json`; use `npm ci` for a clean install.
- `npm run build` creates the unpacked extension in `dist/`.
- `npm run dev` runs `vite build --watch`. It rebuilds extension files on changes;
  it does not start a development web server or provide browser hot reload.
- In Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.
- Load `dist/` with **Load unpacked** in Chrome's `chrome://extensions` developer
  mode. Reload the extension after rebuilding, then reopen its popup.
- There are currently no test, lint, or type-check scripts. Do not assume
  `npm test` or `npm run lint` exists.

## Code map

- `popup.html` and `src/main.jsx`: popup entry point; React runs in Strict Mode.
- `src/App.jsx`: main/review navigation, parsing, export, and success feedback.
- `src/hooks/useExtension.js`: active-tab schedule detection, initialization,
  Google authentication actions, and status messages.
- `src/parsers/class-parser.js` and `exam-parser.js`: inject DOM extraction
  functions into the active tab's frames and convert results to model instances.
- `src/models/`: `ClassComponent` exposes plain public properties; `Exam` exposes
  public getters backed by underscore-prefixed fields.
- `src/state/review-state.js`: converts parsed data into editable plain records,
  groups courses, manages edits/removals/collapse state through a reducer,
  validates reviews, and converts records back to export data.
- `src/services/schedule-preview.js`: shared calendar-date arithmetic, event
  validation, weekly occurrence generation, and overlap layout. These helpers
  are independent of Chrome APIs and DOM rendering.
- `src/services/ics-export.js`: builds recurring class or single-exam ICS events
  and triggers a file download. Returns the number of exported events, or zero.
- `src/services/google-auth.js`: Chrome identity OAuth flow, user-info lookup,
  and auth storage/revocation. Auth keys are `authToken` and `userInfo`.
- `src/components/`: main view, review editor, weekly preview, cards, and editable
  fields. `src/styles/popup.css` imports the base, menu, schedule review,
  event editor, and weekly calendar styles.
- `extension/manifest.json`: permissions, OAuth settings, popup, icons, and worker.
  `extension/background.js` is currently a placeholder service worker.
- `vite.config.js`: bundles the popup and copies the manifest, worker, and icons
  from `extension/` into `dist/`, including during watch builds.

## Implementation conventions

- For popup visual styling, use the [popup style guide](docs/popup-style-guide.md).
- Follow the existing JavaScript ES modules, React function components/hooks,
  double quotes, semicolons, and two-space indentation. Keep JSX in `.jsx` files.
- Keep review state changes in the reducer and calendar calculations in shared
  helpers. Use stable course/event IDs to link preview events to editor fields.
- Read model values through their public properties when creating review records;
  spreading an `Exam` instance does not copy its public getter values.
- Functions passed as `func` to `chrome.scripting.executeScript` must be
  self-contained: Chrome serializes them, so imported helpers and surrounding
  closures are unavailable. Return serializable records and construct models in
  the popup. Preserve frame-aware extraction for the university's nested pages.
- Source/export dates use `MM/DD/YYYY`; review dates use `YYYY-MM-DD`, and review
  times use 24-hour `HH:mm`. Keep conversions at the existing state boundaries.
- Treat schedule dates as calendar dates and times as wall-clock values. Use the
  existing local-date helpers; do not round-trip date-only values through UTC or
  add fixed millisecond durations across daylight-saving changes.
- ICS schedule timestamps currently use floating local time without `Z` or
  `TZID`; `DTSTAMP` uses UTC. Preserve this behavior unless a timezone change is
  explicitly requested. Keep preview, validation, and recurrence logic aligned.
- Preserve keyboard navigation, focus restoration, labeled fields, accessible
  tabs, and validation feedback when editing the review UI. Invalid events should
  produce useful feedback; do not report success or download an empty calendar.
- Preserve Google sign-in/sign-out and keep future draft storage separate from
  authentication keys. Never log or commit access tokens or personal schedules.
- Keep changes focused and reuse the current structure and dependencies unless
  there is a concrete need for an addition. Edit source files, not generated
  `dist/` or `node_modules/` contents.

## Verification

- Run `npm run build` (or `npm.cmd run build`) and `git diff --check` after changes.
  Check that manifest-referenced popup, worker, and icon files exist in `dist/`
  when changing packaging.
- For calendar or reducer changes, run focused in-memory checks of affected pure
  helpers. Cover relevant invalid inputs, noon/midnight, range boundaries,
  recurring weekdays, and daylight-saving transitions. Do not leave temporary
  QA scripts or browser profiles in the repository.
- For UI, parser, or Chrome integration changes, manually check the unpacked
  extension on both supported schedule pages as applicable: parsing, editing,
  removal, validation, preview navigation/overlaps, click-to-edit, and ICS download.
  Verify downloaded ICS content when export behavior changes.
- A build alone cannot validate Chrome APIs, live university DOM selectors,
  OAuth, or interactive behavior. State which browser checks could not be run.

## Local planning notes

`PLAN.md`, when present, is an ignored local roadmap. Consult it for relevant
feature work, but verify implementation in source; unchecked items are planned,
not existing features. Its next stages cover shared course dates, exclusions,
and saved drafts/reset. Keep `README.md` empty for now, as requested there.
Do not add `PLAN.md` to version control as part of routine changes.
