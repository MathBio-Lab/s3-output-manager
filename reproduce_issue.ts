
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Starting reproduction script...');

    // 1. Create a test user directly in DB (to ensure we have a known state)
    const username = 'test_user_' + Date.now();
    const originalPassword = 'password123';
    const newPassword = 'newpassword456';

    const hashedPassword = await bcrypt.hash(originalPassword, 10);

    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            type: 'client',
            prefix: 'test-prefix',
        },
    });

    console.log(`Created user ${user.username} (ID: ${user.id}) with password "${originalPassword}"`);

    // 2. Verify login with original password (simulated)
    const isMatchOriginal = await bcrypt.compare(originalPassword, user.password);
    console.log(`Login with original password: ${isMatchOriginal ? 'SUCCESS' : 'FAILED'}`);

    if (!isMatchOriginal) {
        console.error('Initial password setup failed!');
        return;
    }

    // 3. Update password via API logic (simulating the PUT request handler logic)
    // We can't easily call the Next.js API route function directly without mocking Request/Response,
    // so we will replicate the logic inside the route handler here to test the core logic.

    console.log(`Updating password to "${newPassword}"...`);

    const updateData: any = {};
    // This is the exact line from the route handler:
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
    });

    console.log('User updated.');
    console.log('Old Hash:', user.password);
    console.log('New Hash:', updatedUser.password);

    // 4. Verify login with new password
    const isMatchNew = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Comparing '${newPassword}' against new hash: ${isMatchNew}`);
    console.log(`Login with NEW password: ${isMatchNew ? 'SUCCESS' : 'FAILED'}`);

    // 5. Verify login with OLD password (should fail)
    const isMatchOld = await bcrypt.compare(originalPassword, updatedUser.password);
    console.log(`Comparing '${originalPassword}' against new hash: ${isMatchOld}`);
    console.log(`Login with OLD password: ${isMatchOld ? 'FAILED (Expected)' : 'SUCCESS (Unexpected!)'}`);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user deleted.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
