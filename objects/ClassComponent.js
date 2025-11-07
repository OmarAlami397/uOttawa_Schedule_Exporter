export class ClassComponent {
  constructor(
    courseCode,
    courseName,
    component,
    componentDay,
    componentTime,
    room,
    instructor,
    startDate,
    endDate
  ) {
    this.courseCode = courseCode;
    this.courseName = courseName;
    this.component = component;
    this.componentDay = componentDay;
    this.componentTime = componentTime;
    this.room = room;
    this.instructor = instructor;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  // Getters
  getCourseCode() {
    return this.courseCode;
  }
  getCourseName() {
    return this.courseName;
  }
  getComponent() {
    return this.component;
  }
  getComponentDay() {
    return this.componentDay;
  }
  getComponentTime() {
    return this.componentTime;
  }
  getRoom() {
    return this.room;
  }
  getInstructor() {
    return this.instructor;
  }
  getStartDate() {
    return this.startDate;
  }
  getEndDate() {
    return this.endDate;
  }

  // Setters
  setCourseCode(courseCode) {
    this.courseCode = courseCode;
  }
  setCourseName(courseName) {
    this.courseName = courseName;
  }
  setComponent(component) {
    this.component = component;
  }
  setComponentDay(componentDay) {
    this.componentDay = componentDay;
  }
  setComponentTime(componentTime) {
    this.componentTime = componentTime;
  }
  setRoom(room) {
    this.room = room;
  }
  setInstructor(instructor) {
    this.instructor = instructor;
  }
  setStartDate(startDate) {
    this.startDate = startDate;
  }
  setEndDate(endDate) {
    this.endDate = endDate;
  }

  // Helpers
  toString() {
    return (
      `${this.courseCode} — ${this.courseName}\n` +
      `${this.component} on ${this.componentDay} (${this.componentTime}) at ${this.room}\n` +
      `from ${this.startDate} to ${this.endDate} with ${this.instructor}`
    );
  }
}
