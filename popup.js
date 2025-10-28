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
    const examTable = document.querySelector('table.PSLEVEL1GRID');

    const rows = examTable.querySelectorAll('tr');
    const exams = [];

    for (let i = 1; i < rows.length; i++) { // start at 1 to skip the header row
      const cells = rows[i].querySelectorAll('td');

      const courseCode = cells[0]?.innerText.trim() || '';
      const description = cells[1]?.innerText.trim() || '';
      const examType = cells[2]?.innerText.trim() || '';
      const examDate = cells[3]?.innerText.trim() || '';
      const schedule = cells[4]?.innerText.trim() || '';
      const room = cells[5]?.innerText.trim() || '';

      const exam = new Exam(courseCode, description, examType, examDate, schedule, room);
      exams.push(exam);
    }

    console.log(exams);


  }

  function parseExamTable() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        func: extractDataFromExamTable
      },
      (results) => {
        const exams = results?.[0]?.result || [];
        console.log('Extracted exams:', exams);
      }
    );
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
              parseExamTable()


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

