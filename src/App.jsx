import { useReducer, useState } from "react";
import { parseClassTable } from "./parsers/class-parser.js";
import { parseExamTable } from "./parsers/exam-parser.js";
import { exportToIcs } from "./services/ics-export.js";
import ExportReview from "./components/ExportReview.jsx";
import MainView from "./components/MainView.jsx";
import Toast from "./components/Toast.jsx";
import {
  CLASS_PAGE,
  createReview,
  emptyReview,
  reviewReducer,
  toExportData,
} from "./state/review-state.js";
import { useExtension } from "./hooks/useExtension.js";

export default function App() {
  const extension = useExtension();
  const [review, dispatch] = useReducer(reviewReducer, emptyReview);
  const [view, setView] = useState("main");
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState(null);

  async function startExport() {
    if (extension.busy || parsing || !extension.pageType) return;

    setParsing(true);
    extension.setStatus("Parsing schedule...");

    try {
      const data =
        extension.pageType === CLASS_PAGE ? await parseClassTable() : await parseExamTable();

      if (!extension.mounted.current) return;

      if (!data.length) {
        extension.setStatus("Could not find any schedule data.");
        return;
      }

      dispatch({
        type: "reset",
        review: createReview(data, extension.pageType),
      });
      setView("exporting");
    } catch (error) {
      console.error("Parsing failed:", error);
      if (extension.mounted.current)
        extension.setStatus("Failed to parse schedule. Please try again.");
    } finally {
      if (extension.mounted.current) setParsing(false);
    }
  }

  function confirmExport() {
    const count = exportToIcs(toExportData(review, extension.pageType), extension.pageType);

    if (!count) throw new Error("No valid events to export. Check the event dates and times.");

    setView("main");
    setToast({ message: "Export successful!" });
    extension.setStatus(`Successfully exported ${count} ${count === 1 ? "item" : "items"}.`);
  }

  function cancelExport() {
    setView("main");
    extension.setStatus(`Export cancelled. Ready to export ${extension.pageType}!`);
  }

  return (
    <>
      {view === "main" ? (
        <MainView extension={extension} parsing={parsing} onStart={startExport} />
      ) : (
        <ExportReview
          review={review}
          pageType={extension.pageType}
          dispatch={dispatch}
          onConfirm={confirmExport}
          onCancel={cancelExport}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
