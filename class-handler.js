import { ClassComponent } from "/objects/ClassComponent.js";

function extractDataFromClassTable() {
  function dayFormatter(day) {
    if (day === "Mo") return "Monday";
    if (day === "Tu") return "Tuesday";
    if (day === "We") return "Wednesday";
    if (day === "Th") return "Thursday";
    if (day === "Fr") return "Friday";
    if (day === "Sa") return "Saturday";
    if (day === "Su") return "Sunday";
    return day;
  }

  const allClassData = [];
  const allTitleCells = document.querySelectorAll("td.PAGROUPDIVIDER");

  if (!allTitleCells || allTitleCells.length === 0) {
    return [];
  }

  allTitleCells.forEach((titleCell, i) => {
    const tableWrapper = titleCell.closest("table.PSGROUPBOXWBO");
    if (!tableWrapper) {
      return;
    }

    const table = tableWrapper.querySelector(`#win0divCLASS_MTG_VW\\$${i}`);
    console.log(table);
    if (!table) {
      return;
    }

    const titleCellText = titleCell.innerText.trim() || "";
    const titleParts = titleCellText.split("-");
    const courseCodePrefix = titleParts[0] ? titleParts[0].trim() : "";
    const courseName = titleParts[1] ? titleParts[1].trim() : "";

    const rows = table.querySelectorAll("tr");

    let lastSection = "";
    let lastComponent = "";

    for (let j = 1; j < rows.length; j++) {
      const row = rows[j];
      const cells = row.querySelectorAll("td");

      if (cells.length < 7) {
        continue;
      }

      let section = cells[1]?.innerText.trim() || "";
      let component = cells[2]?.innerText.trim() || "";
      const daysAndTimes = cells[3]?.innerText.trim() || "";
      const room = cells[4]?.innerText.trim() || "";
      const instructor = cells[5]?.innerText.trim() || "";
      const dateCellText = cells[6]?.innerText.trim() || "";

      if (section) {
        lastSection = section;
      } else {
        section = lastSection;
      }

      if (component) {
        lastComponent = component;
      } else {
        component = lastComponent;
      }

      let componentDay = "N/A";
      let componentTime = "N/A";

      if (daysAndTimes && daysAndTimes !== "N/A") {
        componentDay = dayFormatter(daysAndTimes.slice(0, 2).trim());
        componentTime = daysAndTimes.slice(2).trim();
      }

      const dateParts = dateCellText.split("-");
      const startDate = dateParts[0] ? dateParts[0].trim() : "";
      const endDate = dateParts[1] ? dateParts[1].trim() : "";

      allClassData.push({
        courseCode: `${courseCodePrefix}-${section}`,
        courseName: courseName,
        component: component,
        componentDay: componentDay,
        componentTime: componentTime,
        room: room,
        instructor: instructor,
        startDate: startDate,
        endDate: endDate,
      });
    }
  });

  console.log("Extracted class data:", allClassData);
  return allClassData;
}

export async function parseClassTable() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: extractDataFromClassTable,
  });

  const frameResult = results.find(
    (r) => Array.isArray(r.result) && r.result.length > 0
  );

  const plainClasses = frameResult ? frameResult.result : [];

  const classes = plainClasses.map(
    (c) =>
      new ClassComponent(
        c.courseCode,
        c.courseName,
        c.component,
        c.componentDay,
        c.componentTime,
        c.room,
        c.instructor,
        c.startDate,
        c.endDate
      )
  );

  console.log("✅ Extracted classes from content script:", classes);
  return classes;
}
