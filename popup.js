import { parseExamTable } from "./exam-handler.js";
import { parseClassTable } from "./class-handler.js";
import { getAuthToken } from "./google-auth.js";

function checkForSchedulePage() {
  const titleElement = document.getElementById(
    "DERIVED_REGFRM1_SS_TRANSACT_TITLE"
  );
  if (titleElement) {
    const titleText = titleElement.innerText.trim();

    return titleText === "My Class Schedule" || titleText === "My Exam Schedule"
      ? titleText
      : false;
  }
  return false;
}

// Main script
document.addEventListener("DOMContentLoaded", function () {
  const exportButton = document.getElementById("exportButton");
  const statusMessage = document.getElementById("status");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];

    if (activeTab.url && activeTab.url.includes("uocampus.uottawa.ca")) {
      chrome.scripting.executeScript(
        {
          target: {
            tabId: activeTab.id,
            allFrames: true,
          },
          func: checkForSchedulePage,
        },
        (results) => {
          const pageType = results.find((r) => r.result)?.result;

          if (pageType === "My Exam Schedule") {
            exportButton.disabled = false;
            statusMessage.textContent = "Ready to export exam schedule!";
            exportButton.addEventListener("click", async function () {
              statusMessage.textContent = "Logging in to Google...";
              exportButton.disabled = true;

              try {
                // Get the auth token 
                const token = await getAuthToken();
                console.log("SUCCESS! Got auth token:", token);
                statusMessage.textContent = "Login successful! Parsing...";

                // If login is successful, THEN parse the table
                const exams = await parseExamTable();
                console.log("Got exams in popup:", exams);
                statusMessage.textContent = `Found ${exams.length} exams.`;

                // Loop through exams and export to Google

              } catch (error) {
                console.error("Authentication failed:", error);
                statusMessage.textContent = "Login failed. Please try again.";
              }

              exportButton.disabled = false;
            });
          } else if (pageType === "My Class Schedule") {
            exportButton.disabled = false;
            statusMessage.textContent = "Ready to export class schedule!";

            exportButton.addEventListener("click", function () {
              console.log("Button clicked on the correct schedule page!");
              parseClassTable();
            });
          } else {
            statusMessage.textContent =
              "Please navigate to your Class or Exam Schedule page.";
          }
        }
      );
    } else {
      statusMessage.textContent = "Please open your uoZone schedule page.";
    }
  });
});
