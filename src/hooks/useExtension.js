import { useEffect, useRef, useState } from "react";
import {
  getSavedUserData,
  getAuthTokenAndUserInfo,
  revokeAuthToken,
} from "../services/google-auth.js";
import { findSchedulePage } from "../services/schedule-page.js";

export function useExtension() {
  const [detection, setDetection] = useState({ phase: "checking", pageType: null });
  const [detectionAttempt, setDetectionAttempt] = useState(0);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("");
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    async function loadAccount() {
      try {
        const saved = await getSavedUserData();
        if (!cancelled) setUser(saved.authToken && saved.userInfo?.email ? saved.userInfo : null);
      } catch (error) {
        console.error("Account loading error:", error);
        if (!cancelled) setStatus("Couldn’t load your Google account.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function detectSchedule() {
      try {
        const page = await findSchedulePage();
        const detected = page?.pageType || null;

        if (!cancelled) setDetection({ phase: detected ? "ready" : "unsupported", pageType: detected });
      } catch (error) {
        console.error("Schedule detection error:", error);
        if (!cancelled) setDetection({ phase: "check-error", pageType: null });
      }
    }

    detectSchedule();
    return () => { cancelled = true; };
  }, [detectionAttempt]);

  function checkAgain() {
    setDetection({ phase: "checking", pageType: null });
    setDetectionAttempt((attempt) => attempt + 1);
  }

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
    setStatus("Signing out…");

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

  return { ...detection, user, busy, status, setStatus, signIn, signOut, checkAgain, mounted };
}
