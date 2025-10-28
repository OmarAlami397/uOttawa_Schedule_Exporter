document.addEventListener('DOMContentLoaded', function() {
  
  const exportButton = document.getElementById('exportButton');
  const statusMessage = document.getElementById('status');

  
  // helper methods
  function checkForSchedulePage() {
    const titleElement = document.getElementById('DERIVED_REGFRM1_SS_TRANSACT_TITLE');
    if (titleElement) {

      const titleText = titleElement.innerText.trim();
      
      return (titleText === 'My Class Schedule' || titleText === 'My Exam Schedule') ? titleText : false;
;
    }

    return false;
  }

  function extractDataFromExamTable() {
    // Target the correct nested table (the one that actually holds data)
    const table = document.querySelector('table.PSLEVEL1GRID');
    if (!table) {
      console.log("Wrong Frame");
      return [];
    }

    const rows = table.querySelectorAll('tr[id^="trSS_EXAMSCH1_VW"]');
    console.log("Found rows:", rows.length);

    const exams = [];

    for (const row of rows) {
      const cells = row.querySelectorAll('td');

      // Defensive: make sure we have enough columns
      if (cells.length < 6) continue;

      const courseCode = cells[0]?.innerText.trim() || '';
      const description = cells[1]?.innerText.trim() || '';
      const examType = cells[2]?.innerText.trim() || '';
      const examDate = cells[3]?.innerText.trim() || '';
      const schedule = cells[4]?.innerText.trim() || '';
      const room = cells[5]?.innerText.trim() || '';

      exams.push(new Exam(course_code, description, exam_type, exam_date, schedule, room));
  }

  console.log("Extracted exams:", exams);
  return exams;
}


 function parseExamTable() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];


    chrome.scripting.executeScript({
      target: { tabId: activeTab.id, allFrames: true },
      files: ['exam.js']
    }, () => {
    chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id, allFrames: true },
          func: extractDataFromExamTable
        },
        (results) => {
          console.log("📄 Results from all frames:", results);

          const frameResult = results.find(r => Array.isArray(r.result) && r.result.length > 0);
          const exams = frameResult ? frameResult.result : [];

          console.log("✅ Extracted exams:", exams);
          return exams;
        });
      });
    });
  }

  function parseClassTable() {
    
  }


  // main script
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];

    if (activeTab.url && activeTab.url.includes("uocampus.uottawa.ca")) {
      
      chrome.scripting.executeScript(
        {
          target: { 
            tabId: activeTab.id,
            allFrames: true
          },
          func: checkForSchedulePage
        },
        (results) => {
          const pageType = results.find(r => r.result)?.result;
          
          if (pageType === 'My Exam Schedule' ) {

            exportButton.disabled = false;
            statusMessage.textContent = 'Ready to export exam schedule!';

            exportButton.addEventListener('click', function() {
              console.log("Button clicked on the correct schedule page!");
              exams = parseExamTable()


            });

          } else if (pageType === 'My Class Schedule' ) {

            exportButton.disabled = false;
            statusMessage.textContent = 'Ready to export class schedule!';

            exportButton.addEventListener('click', function() {
              console.log("Button clicked on the correct schedule page!");
              // Next step: Trigger the parsing


            });

          } else {
            statusMessage.textContent = 'Please navigate to your Class or Exam Schedule page.';
          }
        }
      );

    } else {
      statusMessage.textContent = 'Please open your uoZone schedule page.';
    }
  });
});

