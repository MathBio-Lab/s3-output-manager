import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const deletedUsers = await prisma.user.findMany({
            where: {
                deletedAt: { not: null }, // Only return deleted users
            },
            orderBy: { deletedAt: 'desc' },
        });
        return NextResponse.json(deletedUsers);
    } catch (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message || 'Failed to fetch deleted users' }, { status: 500 });
    }
}
