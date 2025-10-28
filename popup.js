import { parseExamTable } from "./exam-handler.js";
import { parseClassTable } from "./class-handler.js";
import { getAuthToken, getUserInfo, revokeAuthToken } from "./google-auth.js";

function checkForSchedulePage() {
  const titleElement = document.getElementById(
    "DERIVED_REGFRM1_SS_TRANSACT_TITLE"
  );
  if (titleElement) {
    const titleText = titleElement.innerText.trim();

    return titleText === "My Class Schedule" ||
      titleText === "My Exam Schedule"
      ? titleText
      : false;
  }
  return false;
}

// Main script
document.addEventListener("DOMContentLoaded", function () {
  const exportButton = document.getElementById("exportButton");
  const signOutButton = document.getElementById("signOutButton");
  const statusMessage = document.getElementById("status");
  const userInfo = document.getElementById("userInfo");

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
              try {
                statusMessage.textContent = "Signing in...";
                const token = await getAuthToken();

                statusMessage.textContent = "Getting user info...";
                const user = await getUserInfo(token);
                userInfo.textContent = `Signed in as: ${user.email}`;
                userInfo.style.display = "block";

                exportButton.style.display = "none";
                signOutButton.style.display = "block";

                statusMessage.textContent = "Parsing schedule...";
                const exams = await parseExamTable();
                console.log("Got exams in popup:", exams);

                statusMessage.textContent = `Exporting ${exams.length} exams...`;
                // NEXT: Add Google Calendar creation logic here
                //
                statusMessage.textContent = "Export complete!";
                
              } catch (error) {
                console.error("Authentication failed:", error);
                statusMessage.textContent = "Sign-in failed. Please try again.";
              }
            });
          } else if (pageType === "My Class Schedule") {
            exportButton.disabled = false;
            statusMessage.textContent = "Ready to export class schedule!";

            exportButton.addEventListener("click", function () {
              // Add auth flow here too
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

  signOutButton.addEventListener("click", async function () {
    try {
      await revokeAuthToken();
      statusMessage.textContent = "Signed out successfully.";
      userInfo.style.display = "none";
      userInfo.textContent = "";
      signOutButton.style.display = "none";
      exportButton.style.display = "block";
      exportButton.disabled = false; // Or re-run the page check
    } catch (error) {
      console.error("Sign out failed:", error);
      statusMessage.textContent = "Sign-out failed.";
    }
  });
});

