
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import fs from 'fs';

async function createDemoUser() {
    try {
        const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
        const userPoolId = outputs.auth.user_pool_id;
        const region = outputs.auth.aws_region;

        if (!userPoolId) {
            console.error('Error: Could not find user_pool_id in amplify_outputs.json');
            process.exit(1);
        }

        const client = new CognitoIdentityProviderClient({ region });
        const email = 'demo@poam-tracker.com';
        const password = 'Password123!';

        console.log(`Creating user ${email} in User Pool ${userPoolId}...`);

        try {
            const createCommand = new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' }
                ],
                MessageAction: 'SUPPRESS' // Don't send email
            });

            await client.send(createCommand);
            console.log('User created successfully.');
        } catch (err) {
            if (err.name === 'UsernameExistsException') {
                console.log('User already exists. Proceeding to set password...');
            } else {
                throw err;
            }
        }

        console.log('Setting password...');
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: email,
            Password: password,
            Permanent: true
        });

        await client.send(setPasswordCommand);
        console.log(`Success! Demo user ready.\nEmail: ${email}\nPassword: ${password}`);

    } catch (error) {
        console.error('Error creating demo user:', error);
    }
}

createDemoUser();
