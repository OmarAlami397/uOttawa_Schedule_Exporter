import { parseExamTable } from "./exam-handler.js";
import { parseClassTable } from "./class-handler.js";
import {
  getSavedUserData,
  getAuthTokenAndUserInfo,
  revokeAuthToken,
} from "./google-auth.js";

function checkForSchedulePage() {
  const titleElement = document.getElementById(
    "app_label"
  );
  if (titleElement) {
    const titleText = titleElement.innerText.trim();
    return titleText === "My Class Schedule" || titleText === "My Exam Schedule"
      ? titleText
      : false;
  }
  return false;
}

// --- Main Script ---

document.addEventListener("DOMContentLoaded", async () => {
  const mainView = document.getElementById("main-view");
  const exportingView = document.getElementById("exporting-view");

  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const exportToGoogleButton = document.getElementById("exportToGoogleButton");
  const exportAsICSButton = document.getElementById("exportAsICSButton");
  const statusMessage = document.getElementById("status");
  const userInfo = document.getElementById("userInfo");
  const toastMessage = document.getElementById("toast-message");

  const exportTitle = document.getElementById("export-title");
  const exportList = document.getElementById("export-list");
  const exportConfirmButton = document.getElementById("exportConfirmButton");
  const exportCancelButton = document.getElementById("exportCancelButton");

  let currentPageType = null;
  let currentExportData = [];
  let currentExportType = "";

  // --- View Management ---

  /**
   * Shows a specific view and hides all others
   * @param {'main' | 'exporting'} viewId
   */
  function showView(viewId) {
    mainView.style.display = (viewId === "main") ? "block" : "none";
    exportingView.style.display = (viewId === "exporting") ? "block" : "none";
  }

  /**
   * Shows a temporary toast message for success
   * @param {string} message
   */
  function showToast(message) {
    toastMessage.textContent = message;
    toastMessage.style.display = "block";
    toastMessage.style.opacity = 1;

    setTimeout(() => {
      toastMessage.style.opacity = 0;
      setTimeout(() => (toastMessage.style.display = "none"), 300);
    }, 2000);
  }

  /**
   * Updates the UI based on the user's sign-in state and current page.
   * This only affects the #main-view.
   */
  function updateUI(state, data) {
    if (state === "signedIn") {
      userInfo.textContent = `Signed in as: ${data.user.email}`;
      userInfo.style.display = "block";
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
      exportToGoogleButton.style.display = "block";
    } else if (state === "signedOut") {
      userInfo.textContent = "";
      userInfo.style.display = "none";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
      exportToGoogleButton.style.display = "none";
    }

    if (data.pageType) {
      statusMessage.textContent = `Ready to export ${data.pageType}!`;
      exportToGoogleButton.disabled = false;
      exportAsICSButton.disabled = false;
      signInButton.disabled = false;
    } else {
      statusMessage.textContent =
        "Please navigate to your Class or Exam Schedule page.";
      exportToGoogleButton.disabled = true;
      exportAsICSButton.disabled = true;
      signInButton.disabled = true;
    }
  }

  // --- Event Handlers ---

  async function handleSignIn() {
    try {
      statusMessage.textContent = "Signing in...";
      const { user } = await getAuthTokenAndUserInfo();
      updateUI("signedIn", { user, pageType: currentPageType });
      statusMessage.textContent = "Signed in successfully!";
    } catch (error) {
      console.error("Sign-in failed:", error);
      statusMessage.textContent = "Sign-in failed. Please try again.";
      updateUI("signedOut", { pageType: currentPageType });
    }
  }

  async function handleSignOut() {
    try {
      await revokeAuthToken();
      updateUI("signedOut", { pageType: currentPageType });
      statusMessage.textContent = "Signed out successfully.";
    } catch (error) {
      console.error("Sign out failed:", error);
      statusMessage.textContent = "Sign-out failed.";
    }
  }

  /**
   * Populates the "Exporting" view with editable fields
   * @param {Array<object>} data - The array of class or exam objects
   */
  function populateExportView(data) {
    exportList.innerHTML = ""; // Clear old list
    if (currentPageType === "My Class Schedule") {
      exportTitle.textContent = "Review Class Schedule";
      data.forEach((item, index) => {
        exportList.innerHTML += `
          <div class="export-item">
            <label>Course Code</label>
            <input type="text" data-index="${index}" data-field="courseCode" value="${item.courseCode}" />
            <label>Component</label>
            <input type="text" data-index="${index}" data-field="component" value="${item.component}" />
            <label>Time</label>
            <input type="text" data-index="${index}" data-field="componentTime" value="${item.componentTime}" />
          </div>
        `;
      });
    } else if (currentPageType === "My Exam Schedule") {
      exportTitle.textContent = "Review Exam Schedule";
      data.forEach((item, index) => {
        exportList.innerHTML += `
          <div class="export-item">
            <label>Course Code</label>
            <input type="text" data-index="${index}" data-field="courseCode" value="${item.courseCode}" />
            <label>Description</label>
            <input type="text" data-index="${index}" data-field="description" value="${item.description}" />
            <label>Date & Time</label>
            <input type="text" data-index="${index}" data-field="schedule" value="${item.schedule}" />
          </div>
        `;
      });
    }
  }

  /**
   * Main function to start the export process (parsing, showing view)
   */
  async function startExportProcess(exportType) {
    try {
      showView("main"); // Show main view in case it's hidden
      statusMessage.textContent = "Parsing schedule...";
      currentExportType = exportType; // Save which button was clicked

      let data;
      if (currentPageType === "My Class Schedule") {
        data = await parseClassTable();
      } else if (currentPageType === "My Exam Schedule") {
        data = await parseExamTable();
      }

      if (!data || data.length === 0) {
        statusMessage.textContent = "Could not find any schedule data.";
        return;
      }

      currentExportData = data; // Save data for confirmation
      populateExportView(data); // Build the editable list
      showView("exporting"); // Show the "Exporting" view
    } catch (error) {
      console.error("Parsing failed:", error);
      statusMessage.textContent = "Failed to parse schedule.";
    }
  }

  function handleExportConfirm() {
    // Read the *edited* data from the input fields
    const inputs = exportList.querySelectorAll("input[data-index]");
    inputs.forEach((input) => {
      const index = input.dataset.index;
      const field = input.dataset.field;
      currentExportData[index][field] = input.value;
    });

    console.log("Final data to be exported:", currentExportData);

    //  Decide which export to run
    if (currentExportType === "google") {
      console.log("TODO: Implement Google Export logic here");
    } else if (currentExportType === "ics") {
      console.log("TODO: Implement .ICS Export logic here");
    }

    // Show success and return to main view
    showView("main");
    showToast("Export successful!");
    statusMessage.textContent = `Successfully exported ${currentExportData.length} items.`;
  }

  function handleExportCancel() {
    showView("main");
    statusMessage.textContent = `Export cancelled. Ready to export ${currentPageType}!`;
  }

  // --- Add Event Listeners ---
  signInButton.addEventListener("click", handleSignIn);
  signOutButton.addEventListener("click", handleSignOut);
  exportToGoogleButton.addEventListener("click", () =>
    startExportProcess("google")
  );
  exportAsICSButton.addEventListener("click", () => startExportProcess("ics"));
  exportConfirmButton.addEventListener("click", handleExportConfirm);
  exportCancelButton.addEventListener("click", handleExportCancel);

  // --- Check Page and Auth State on Load ---
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) return;

    let pageType = null;
    if (tab.url && tab.url.includes("uocampus.uottawa.ca")) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: checkForSchedulePage,
      });
      pageType = results.find((r) => r.result)?.result || null;
    }
    currentPageType = pageType;

    const { authToken, userInfo: user } = await getSavedUserData();
    if (authToken && user?.email) {
      updateUI("signedIn", { user, pageType });
    } else {
      updateUI("signedOut", { pageType });
    }
  } catch (error) {
    console.error("Initialization error:", error);
    statusMessage.textContent = "Error loading. Please try again.";
  }
});
