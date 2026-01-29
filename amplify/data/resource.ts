import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      fullName: a.string(),
      role: a.enum(['ADMIN', 'COMPLIANCE', 'OWNER', 'ENGINEER', 'AUDITOR']),
      status: a.string(),
      team: a.string(),
      lastLogin: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  System: a
    .model({
      name: a.string().required(),
      acronym: a.string(),
      description: a.string(),
      environment: a.enum(['DEV', 'TEST', 'STAGE', 'PROD']),
      ownerUserId: a.string(),
      ownerName: a.string(), // De-normalization for easy display
      boundary: a.string(),
      activeStatus: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Finding: a
    .model({
      systemId: a.string().required(),
      systemName: a.string(), // De-normalization

      // POAM Fields
      findingNumber: a.string(),
      title: a.string().required(),
      description: a.string(),

      controlFamily: a.enum(['AC', 'AU', 'CM', 'IA', 'IR', 'MA', 'MP', 'PE', 'PL', 'PS', 'RA', 'SA', 'SC', 'SI']),
      controlId: a.string(), // e.g. "AC-2"

      source: a.enum(['SCAN', 'ASSESSMENT', 'AUDIT', 'PEN_TEST', 'MANUAL_REVIEW', 'OTHER']),

      // Risk scoring
      severity: a.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
      likelihood: a.enum(['LOW', 'MEDIUM', 'HIGH']),
      impact: a.enum(['LOW', 'MEDIUM', 'HIGH']),
      riskScore: a.integer(), // Calculated 1-9

      status: a.enum(['OPEN', 'IN_PROGRESS', 'MITIGATED', 'ACCEPTED_RISK', 'FALSE_POSITIVE']),
      riskAcceptanceRationale: a.string(), // Required if ACCEPTED_RISK

      ownerUserId: a.string(),
      ownerName: a.string(), // De-normalization (e.g. "John Doe")

      dueDate: a.datetime(),
      actualClosureDate: a.datetime(),

      tags: a.string().array(),
      notes: a.string(),

      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Milestone: a
    .model({
      findingId: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      targetDate: a.datetime(), // Mapped from "target_date"
      status: a.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']),

      ownerUserId: a.string(),

      completedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Evidence: a
    .model({
      findingId: a.string().required(),
      type: a.enum(['SCREENSHOT', 'POLICY_DOC', 'SCAN_REPORT', 'CONFIG_EXPORT', 'OTHER']),
      title: a.string(), // Optional title/desc
      description: a.string(),

      fileName: a.string(),
      fileUrl: a.string(),

      uploadedByUserId: a.string(),

      createdAt: a.datetime(), // uploadedAt
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Comment: a
    .model({
      findingId: a.string().required(),
      userId: a.string().required(),
      commentBody: a.string().required(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Keep these for potential legacy or future use if needed, or remove if fully replaced.
  // For now, retaining Boundary and others to avoid breaking existing code too hard, 
  // though user didn't explicitly ask for them in the "Entities" list, they previously existed.
  Boundary: a
    .model({
      name: a.string().required(),
      description: a.string(),
      boundaryCategory: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  ApprovalRequest: a
    .model({
      type: a.string().required(),
      requestedByUserId: a.string(),
      requestedByName: a.string(),
      systemId: a.string(),
      status: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  BoundaryChangeLog: a
    .model({
      systemId: a.string(),
      changedByUserId: a.string(),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Task: a
    .model({
      title: a.string().required(),
      description: a.string(),
      status: a.string(),
      priority: a.string(),
      assignedTo: a.string(),
      dueDate: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  // Keeping TeamMember as it might be used by existing code, 
  // though "User" is the new primary for roles.
  TeamMember: a
    .model({
      name: a.string().required(),
      role: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});


export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

export type Schema = ClientSchema<typeof schema>;



