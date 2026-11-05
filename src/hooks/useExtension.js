import { useEffect, useRef, useState } from "react";
import {
  getSavedUserData,
  getAuthTokenAndUserInfo,
  revokeAuthToken,
} from "../services/google-auth.js";
import { CLASS_PAGE, EXAM_PAGE } from "../state/review-state.js";

// Chrome serializes this function before injecting it into each frame.
export function checkForSchedulePage() {
  const title = document.getElementById("app_label")?.innerText.trim();
  return title === "My Class Schedule" || title === "My Exam Schedule" ? title : false;
}

export function useExtension() {
  const [pageType, setPageType] = useState(null);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("Loading...");
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    async function initialize() {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        let detected = null;
        if (tab?.url && new URL(tab.url).hostname.endsWith(".uottawa.ca")) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: checkForSchedulePage,
          });
          detected =
            results.find(({ result }) => result === CLASS_PAGE || result === EXAM_PAGE)?.result ||
            null;
        }

        const saved = await getSavedUserData();
        if (cancelled) return;

        setPageType(detected);
        setUser(saved.authToken && saved.userInfo?.email ? saved.userInfo : null);
        setStatus(
          detected
            ? `Ready to export ${detected}!`
            : "Please navigate to your Class or Exam Schedule page.",
        );
      } catch (error) {
        console.error("Initialization error:", error);
        if (!cancelled) setStatus("Error loading. Please reopen the extension and try again.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  async function signIn() {
    setBusy(true);
    setStatus("Signing in...");

    try {
      const { user: signedInUser } = await getAuthTokenAndUserInfo();
      if (mounted.current) {
        setUser(signedInUser);
        setStatus("Signed in successfully!");
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
      if (mounted.current) setStatus("Sign-in failed. Please try again.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);

    try {
      await revokeAuthToken();
      if (mounted.current) {
        setUser(null);
        setStatus("Signed out successfully.");
      }
    } catch (error) {
      console.error("Sign-out failed:", error);
      if (mounted.current) setStatus("Sign-out failed. Please try again.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return { pageType, user, busy, status, setStatus, signIn, signOut, mounted };
}
