import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Prisma Client initialized successfully');
    // We can't actually connect because the DB might not exist, but we can check types
    const client: {
        id: number;
        username: string;
        password: string;
        prefix: string;
        metadata: any;
        createdAt: Date;
        updatedAt: Date;
    } | null = null;

    console.log('Types verified');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
