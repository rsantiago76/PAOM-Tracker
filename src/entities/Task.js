// src/entities/Task.js
// Minimal stub so Base44 pages that import { Task } don’t crash.
// You can expand this later to match your real Task schema.

export class Task {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static from(data = {}) {
    return new Task(data);
  }
}

export default Task;
