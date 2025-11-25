import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(
            'SELECT * FROM "User" WHERE "deletedAt" IS NOT NULL ORDER BY "deletedAt" DESC'
        );
        const deletedUsers = result.rows;
        return NextResponse.json(deletedUsers);
    } catch (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message || 'Failed to fetch deleted users' }, { status: 500 });
    }
}
