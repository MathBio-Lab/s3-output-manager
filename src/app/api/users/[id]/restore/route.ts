import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        // Get the user to be restored
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.deletedAt) {
            return NextResponse.json({ error: 'User is not deleted' }, { status: 400 });
        }

        // Restore user by setting deletedAt to null
        const restoredUser = await prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'User restored successfully',
            user: restoredUser
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
