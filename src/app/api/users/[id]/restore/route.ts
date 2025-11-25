import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        // Get the user to be restored
        const result = await query(
            'SELECT * FROM "User" WHERE id = $1',
            [userId]
        );
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.deletedAt) {
            return NextResponse.json({ error: 'User is not deleted' }, { status: 400 });
        }

        // Restore user by setting deletedAt to null
        const updateResult = await query(
            'UPDATE "User" SET "deletedAt" = NULL WHERE id = $1 RETURNING *',
            [userId]
        );
        const restoredUser = updateResult.rows[0];

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
