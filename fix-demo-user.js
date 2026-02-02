
import {
    CognitoIdentityProviderClient,
    AdminConfirmSignUpCommand,
    AdminUpdateUserAttributesCommand,
    AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

async function fixDemoUser() {
    try {
        const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
        const userPoolId = outputs.auth.user_pool_id;
        const region = outputs.auth.aws_region;

        if (!userPoolId) {
            console.error('Error: Could not find user_pool_id');
            process.exit(1);
        }

        const client = new CognitoIdentityProviderClient({ region });
        const email = 'demo@poam-tracker.com';
        const password = 'Password123!';

        console.log(`Fixing user ${email} in User Pool ${userPoolId}...`);

        // 1. Force Confirm Sign Up
        try {
            const confirmCommand = new AdminConfirmSignUpCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            await client.send(confirmCommand);
            console.log('User confirmed via AdminConfirmSignUp.');
        } catch (err) {
            console.log(`Confirm failed (might be already confirmed): ${err.message}`);
        }

        // 2. Force Email Verified Attribute
        try {
            const updateCommand = new AdminUpdateUserAttributesCommand({
                UserPoolId: userPoolId,
                Username: email,
                UserAttributes: [
                    { Name: 'email_verified', Value: 'true' }
                ]
            });
            await client.send(updateCommand);
            console.log('User attributes updated (email_verified: true).');
        } catch (err) {
            console.log(`Attribute update failed: ${err.message}`);
        }

        // 3. Set Permanent Password
        try {
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: email,
                Password: password,
                Permanent: true
            });
            await client.send(setPasswordCommand);
            console.log('Password reset to Password123!');
        } catch (err) {
            console.log(`Password reset failed: ${err.message}`);
        }

        console.log('\nUser Fix Complete.');

    } catch (error) {
        console.error('Error fixing demo user:', error);
    }
}

fixDemoUser();
