import { defineAuth } from '@aws-amplify/backend';

/**
 * Define Authentication with Email login.
 * This sets up Cognito User Pool and Identity Pool.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    multifactor: {
        mode: 'OFF',
    },
});

// Trigger redeploy: 2026-02-02T01:04:32
