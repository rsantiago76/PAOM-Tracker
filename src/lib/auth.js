import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { client } from '@/api/amplifyClient';

export { signOut };

export async function getCurrentUserProfile() {
    try {
        // Check for Demo Mode
        const isDemoMode = localStorage.getItem('poam_demo_mode') === 'true';
        if (isDemoMode) {
            return {
                id: 'demo-user-id',
                email: 'demo@example.com',
                full_name: 'Demo Admin',
                role: 'ADMIN',
                compliance_lead: true
            };
        }

        const authUser = await getCurrentUser();

        let email = authUser.signInDetails?.loginId;

        // Fallback: Fetch attributes if email is missing from signInDetails
        if (!email) {
            try {
                const attributes = await fetchUserAttributes();
                email = attributes.email;
            } catch (attrErr) {
                console.debug('Could not fetch user attributes', attrErr);
            }
        }

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
            role: dbUser?.role || 'ADMIN', // Default to ADMIN for dev/testing
            compliance_lead: dbUser?.compliance_lead,
            ...dbUser // include other DB fields
        };
    } catch (error) {
        console.debug('No authenticated user', error);
        return null;
    }
}
