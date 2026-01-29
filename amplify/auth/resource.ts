import { defineAuth } from '@aws-amplify/backend';

/**
 * Define Authentication with Email login.
 * This sets up Cognito User Pool and Identity Pool.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
});
