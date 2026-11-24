import { CLASS_PAGE, EXAM_PAGE } from "../state/review-state.js";

// Chrome serializes this function before injecting it into each frame.
export function checkForSchedulePage() {
  const title = document.getElementById("app_label")?.innerText.trim();
  return title === "My Class Schedule" || title === "My Exam Schedule" ? title : false;
}

export async function findSchedulePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !new URL(tab.url).hostname.endsWith(".uottawa.ca")) return null;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: checkForSchedulePage,
  });
  const pageType = results.find(({ result }) => result === CLASS_PAGE || result === EXAM_PAGE)?.result;
  return pageType ? { tabId: tab.id, pageType } : null;
}
