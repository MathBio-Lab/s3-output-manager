import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            type: 'admin',
            prefix: null,
        },
    });

    console.log('✅ Admin user created:', { id: admin.id, username: admin.username });

    // Create a sample client user
    const clientPassword = await bcrypt.hash('client123', 10);
    const client = await prisma.user.upsert({
        where: { username: 'client1' },
        update: {},
        create: {
            username: 'client1',
            password: clientPassword,
            type: 'client',
            prefix: 'karen',
        },
    });

    console.log('✅ Client user created:', { id: client.id, username: client.username, prefix: client.prefix });

    // Create a sample team user
    const teamPassword = await bcrypt.hash('team123', 10);
    const team = await prisma.user.upsert({
        where: { username: 'team1' },
        update: {},
        create: {
            username: 'team1',
            password: teamPassword,
            type: 'team',
            prefix: null,
        },
    });

    console.log('✅ Team user created:', { id: team.id, username: team.username });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
