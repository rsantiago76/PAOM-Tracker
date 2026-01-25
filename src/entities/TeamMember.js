// src/entities/TeamMember.js
// Minimal stub so Vite/Amplify builds succeed.
// Replace with real Base44 SDK entity when backend is connected.

import { base44 } from "@/api/base44Client";

export const TeamMember = {
  list: (params) => base44.entities.TeamMember.list(params),
  getById: (id) => base44.entities.TeamMember.getById(id),
  create: (payload) => base44.entities.TeamMember.create(payload),
  update: (id, patch) => base44.entities.TeamMember.update(id, patch),
  remove: (id) => base44.entities.TeamMember.remove(id),
};

export default TeamMember;
