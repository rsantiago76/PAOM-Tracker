import { a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  System: a
    .model({
      name: a.string().required(),
      owner: a.string(),
      environment: a.string(),
      description: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Finding: a
    .model({
      systemId: a.string().required(),
      
      // fields your UI expects
      findingNumber: a.string(),
      systemName: a.string(),
      dueDate: a.datetime(),
      assignedToName: a.string(),

      title: a.string().required(),
      description: a.string(),
      severity: a.string(),
      status: a.string(),
      controlId: a.string(),
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
      estimatedHours: a.integer(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  TeamMember: a
    .model({
      name: a.string().required(),
      role: a.string(),
      availability: a.integer(),
      currentWorkload: a.integer(),
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


