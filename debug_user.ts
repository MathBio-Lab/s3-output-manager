
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Debugging user "rodrigo"...');

    // 1. Find user by exact match
    const exactUser = await prisma.user.findUnique({
        where: { username: 'rodrigo' },
    });

    if (exactUser) {
        console.log('Found EXACT match for "rodrigo":');
        console.log('ID:', exactUser.id);
        console.log('Username:', `"${exactUser.username}"`); // Quote to see spaces
        console.log('Password Hash:', exactUser.password);

        // Test password "rodrigo"
        const isMatch = await bcrypt.compare('rodrigo', exactUser.password);
        console.log(`Password "rodrigo" matches: ${isMatch}`);
    } else {
        console.log('No EXACT match for "rodrigo".');
    }

    // 2. Find user by fuzzy match (contains "rodrigo")
    const fuzzyUsers = await prisma.user.findMany({
        where: {
            username: {
                contains: 'rodrigo',
                mode: 'insensitive',
            },
        },
    });

    console.log(`Found ${fuzzyUsers.length} fuzzy matches:`);
    for (const user of fuzzyUsers) {
        console.log('---');
        console.log('ID:', user.id);
        console.log('Username:', `"${user.username}"`);
        console.log('Type:', user.type);

        // Test password "rodrigo"
        const isMatch = await bcrypt.compare('rodrigo', user.password);
        console.log(`Password "rodrigo" matches: ${isMatch}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
