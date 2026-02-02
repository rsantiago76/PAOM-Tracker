
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';
import { WebSocket } from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket;

// Load configuration
try {
    const config = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));
    Amplify.configure(config);

    const client = generateClient();

    console.log("Fetching users...");
    const { data: users, errors } = await client.models.User.list();

    if (errors) {
        console.error("Error fetching users:", errors);
    } else {
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Updating user: ${user.email} (${user.id})`);
            const { data: updatedUser, errors: updateErrors } = await client.models.User.update({
                id: user.id,
                role: 'ADMIN'
            });

            if (updateErrors) {
                console.error(`Error updating user ${user.email}:`, updateErrors);
            } else {
                console.log(`Successfully updated ${updatedUser.email} to ADMIN.`);
            }
        }
    }
} catch (error) {
    console.error("Script failed:", error);
}
