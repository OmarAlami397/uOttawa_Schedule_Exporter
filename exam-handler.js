import { Exam } from "/objects/Exam.js";

function extractDataFromExamTable() {
  const table = document.querySelector("table.PSLEVEL1GRID");
  if (!table) {
    console.log("Wrong Frame");
    return [];
  }

  const rows = table.querySelectorAll('tr');
  console.log("Found rows:", rows.length);

  const exams = [];

  for (const row of rows) {
    const cells = row.querySelectorAll("td");

    if (cells.length < 6) continue;

    const courseCode = cells[0]?.innerText.trim() || "";
    const description = cells[1]?.innerText.trim() || "";
    const examType = cells[2]?.innerText.trim() || "";
    const examDate = cells[3]?.innerText.trim() || "";
    const schedule = cells[4]?.innerText.trim() || "";
    const room = cells[5]?.innerText.trim() || "";

    exams.push({ courseCode, description, examType, examDate, schedule, room });
  }

  console.log("Extracted exams:", exams);
  return exams;
}

export async function parseExamTable() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });


  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: extractDataFromExamTable,
  });

  console.log("📄 Results from all frames:", results);
  const frameResult = results.find(
    (r) => Array.isArray(r.result) && r.result.length > 0
  );
  const plainExams = frameResult ? frameResult.result : [];

  const exams = plainExams.map((examData) => {
    return new Exam(
      examData.courseCode,
      examData.description,
      examData.examType,
      examData.examDate,
      examData.schedule,
      examData.room
    );
  });

  console.log("✅ Extracted exams:", exams);
  return exams;
}
