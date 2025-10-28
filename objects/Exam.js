class Exam {
  constructor(course_code, description, exam_type, exam_date, schedule, room) {
    this._course_code = course_code; // String e.g., "CSI 2110-A00"
    this._description = description; // String
    this._exam_type = exam_type; // String
    this._exam_date = exam_date; // String or Date
    this._schedule = schedule; // String e.g., "2:00PM - 5:00PM"
    this._room = room; // String e.g., "801 King Edward (MNO) 2"
  }

  // Getters
  get courseCode() {
    return this._course_code;
  }
  get description() {
    return this._description;
  }
  get examType() {
    return this._exam_type;
  }
  get examDate() {
    return this._exam_date;
  }
  get schedule() {
    return this._schedule;
  }
  get room() {
    return this._room;
  }

  //Setters
  set courseCode(value) {
    this._course_code = value;
  }
  set description(value) {
    this._description = value;
  }
  set examType(value) {
    this._exam_type = value;
  }
  set examDate(value) {
    this._exam_date = value;
  }
  set schedule(value) {
    this._schedule = value;
  }
  set room(value) {
    this._room = value;
  }

  toString() {
    return (
      `${this._course_code} — ${this._description}\n` +
      `${this._exam_type} on ${this._exam_date} (${this._schedule}) at ${this._room}`
    );
  }

  processExams(exams) {
    for (const exam of exams) {
      exam.courseCode = exam.courseCode.split("\n")[0];
      
    }
  }
}
