import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
    try {
        // @ts-ignore
        const userDelegate = prisma.user;
        console.log('prisma.user:', userDelegate ? 'Exists' : 'Undefined');

        if (userDelegate) {
            const count = await userDelegate.count();
            console.log('User count:', count);
        }
    } catch (e) {
        console.error('Error accessing prisma.user:', e);
    }
}

main();
