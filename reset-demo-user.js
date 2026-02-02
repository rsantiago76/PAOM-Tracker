
import {
    CognitoIdentityProviderClient,
    AdminDeleteUserCommand,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

async function resetUser() {
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

        console.log(`Resetting user ${email} in User Pool ${userPoolId}...`);

        // 1. Delete User
        try {
            const deleteCommand = new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            await client.send(deleteCommand);
            console.log('User deleted (clearing stuck state).');
        } catch (err) {
            console.log(`Delete failed (maybe didn't exist): ${err.message}`);
        }

        // 2. Create User (Verified)
        try {
            await new Promise(r => setTimeout(r, 1000)); // Wait a sec
            const createCommand = new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' }
                ],
                MessageAction: 'SUPPRESS'
            });

            await client.send(createCommand);
            console.log('User re-created successfully.');
        } catch (err) {
            console.error('Creation failed:', err);
            return;
        }

        // 3. Set Password
        try {
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: email,
                Password: password,
                Permanent: true
            });
            await client.send(setPasswordCommand);
            console.log('Password set to Password123!');
        } catch (err) {
            console.log(`Password set failed: ${err.message}`);
        }

        console.log('\nUser Reset Complete.');

    } catch (error) {
        console.error('Error resetting user:', error);
    }
}

resetUser();
