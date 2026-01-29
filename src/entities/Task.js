// src/entities/Task.js
// Offline entity stub. Matches the API your pages expect.

const today = () => new Date().toISOString().slice(0, 10);

// In-memory data so filter/update work in demo mode
let TASKS = [
  {
    id: "task_1",
    title: "Draft remediation plan for POA&M items",
    description: "Create a remediation plan for open findings with owners and dates.",
    status: "Backlog",
    priority: "High",
    required_skills: ["compliance", "writing"],
    estimated_hours: 6,
    due_date: today(),
    assigned_to: null,
  },
];

export const Task = {
  async list() {
    return [...TASKS];
  },

  async filter(where = {}) {
    // AIAllocation calls: Task.filter({ status: "Backlog" })
    const entries = [...TASKS];
    return entries.filter((t) => {
      return Object.entries(where).every(([k, v]) => t?.[k] === v);
    });
  },

  async update(id, patch = {}) {
    const idx = TASKS.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) return null;
    TASKS[idx] = {
      ...TASKS[idx],
      ...patch,
      id: TASKS[idx].id,
      updated_date: today(),
    };
    return TASKS[idx];
  },

  async create(payload = {}) {
    const item = {
      id: payload.id || `task_${Date.now()}`,
      title: payload.title || "New Task",
      description: payload.description || "",
      status: payload.status || "Backlog",
      priority: payload.priority || "Medium",
      required_skills: payload.required_skills || [],
      estimated_hours: payload.estimated_hours || null,
      due_date: payload.due_date || null,
      assigned_to: payload.assigned_to || null,
      created_date: today(),
      updated_date: today(),
    };
    TASKS = [item, ...TASKS];
    return item;
  },
};

export default Task;
