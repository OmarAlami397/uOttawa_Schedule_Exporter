import { useReducer, useState } from "react";
import { parseClassTable } from "./parsers/class-parser.js";
import { parseExamTable } from "./parsers/exam-parser.js";
import { exportToIcs } from "./services/ics-export.js";
import ExportReview from "./components/ExportReview.jsx";
import MainView from "./components/MainView.jsx";
import {
  CLASS_PAGE,
  createReview,
  emptyReview,
  toExportData,
} from "./state/review-state.js";
import { createReviewSession, reviewSessionReducer } from "./state/review-session.js";
import { useExtension } from "./hooks/useExtension.js";

export default function App() {
  const extension = useExtension();
  const [{ review, lastRemoval }, dispatch] = useReducer(reviewSessionReducer, emptyReview, createReviewSession);
  const [view, setView] = useState("main");
  const [readPhase, setReadPhase] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const phase = readPhase ?? extension.phase;

  async function startExport() {
    if (extension.busy || readPhase === "reading" || !extension.pageType) return;

    setReadPhase("reading");
    setExportResult(null);
    extension.setStatus("");

    try {
      const data =
        extension.pageType === CLASS_PAGE ? await parseClassTable() : await parseExamTable();

      if (!extension.mounted.current) return;

      if (!data.length) {
        setReadPhase("empty");
        return;
      }

      dispatch({
        type: "reset",
        review: createReview(data, extension.pageType),
      });
      setReadPhase(null);
      setView("exporting");
    } catch (error) {
      console.error("Parsing failed:", error);
      if (extension.mounted.current) setReadPhase("error");
    }
  }

  function confirmExport() {
    const { pageType } = extension;
    const filename = pageType === CLASS_PAGE ? "uOttawa_Class_Schedule.ics" : "uOttawa_Exam_Schedule.ics";
    const eventCount = exportToIcs(toExportData(review, pageType), pageType, { filename });

    if (!eventCount) throw new Error("No valid events to export. Check the event dates and times.");

    setExportResult({ filename, eventCount, pageType });
    dispatch({ type: "dismiss-removal" });
    setView("main");
  }

  function cancelExport() {
    dispatch({ type: "dismiss-removal" });
    setView("main");
    setExportResult(null);
    extension.setStatus("");
  }

  return view === "main" ? (
    <MainView
      extension={extension}
      phase={phase}
      onStart={startExport}
      onRetry={readPhase ? startExport : extension.checkAgain}
      exportResult={exportResult}
      onResumeReview={() => setView("exporting")}
    />
  ) : (
    <ExportReview
      review={review}
      pageType={extension.pageType}
      dispatch={dispatch}
      lastRemoval={lastRemoval}
      onUndoRemoval={() => dispatch({ type: "undo-remove" })}
      onConfirm={confirmExport}
      onCancel={cancelExport}
    />
  );
}
