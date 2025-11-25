import { query } from '../lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
    const password = await bcrypt.hash('password', 10);

    const users = [
        {
            username: 'admin',
            password,
            type: 'admin',
            prefix: null,
        },
        {
            username: 'client',
            password,
            type: 'client',
            prefix: 'client-folder/',
        },
        {
            username: 'team',
            password,
            type: 'team',
            prefix: null,
        },
    ];

    try {
        for (const user of users) {
            await query(
                `INSERT INTO "User" (username, password, type, prefix, "updatedAt")
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (username) DO NOTHING`,
                [user.username, user.password, user.type, user.prefix]
            );
        }
        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
