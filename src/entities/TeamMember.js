// src/entities/TeamMember.js
// Offline entity stub.

let MEMBERS = [
  {
    id: "member_1",
    name: "Alex Morgan",
    role: "Content Strategist",
    current_workload: 35,
    availability: 80,
    skills: { content: 8, seo: 7, writing: 9 },
  },
  {
    id: "member_2",
    name: "Jordan Lee",
    role: "SEO Specialist",
    current_workload: 50,
    availability: 70,
    skills: { seo: 9, analytics: 8, content: 6 },
  },
];

export const TeamMember = {
  async list() {
    return [...MEMBERS];
  },

  async create(payload = {}) {
    const item = { id: payload.id || `member_${Date.now()}`, ...payload };
    MEMBERS = [item, ...MEMBERS];
    return item;
  },

  async update(id, patch = {}) {
    const idx = MEMBERS.findIndex((m) => String(m.id) === String(id));
    if (idx === -1) return null;
    MEMBERS[idx] = { ...MEMBERS[idx], ...patch, id: MEMBERS[idx].id };
    return MEMBERS[idx];
  },
};

export default TeamMember;

