import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'poamDrive',
    access: (allow) => ({
        'evidence/*': [
            allow.guest.to(['read']),
            allow.authenticated.to(['read', 'write', 'delete']),
        ],
    })
});
