import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { client } from '@/api/amplifyClient';

export { signOut };

export async function getCurrentUserProfile() {
    try {
        const authUser = await getCurrentUser();
        const email = authUser.signInDetails?.loginId;

        // Try to find user in DB to get role and full name
        // Note: This relies on the User model being populated.
        // If not found, we fallback to email/username.
        let dbUser = null;
        if (email) {
            const { data: users } = await client.models.User.list({
                filter: { email: { eq: email } }
            });
            if (users.length > 0) {
                dbUser = users[0];
            }
        }

        return {
            id: authUser.userId,
            email: email,
            // Map DB fields to what UI expects (full_name, role)
            full_name: dbUser?.fullName || email || authUser.username,
            role: dbUser?.role || 'user',
            ...dbUser // include other DB fields
        };
    } catch (error) {
        console.debug('No authenticated user', error);
        return null;
    }
}
