import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await query(
            'SELECT * FROM "User" WHERE id = $1',
            [parseInt(id)]
        );
        const user = result.rows[0];

        if (!user || user.deletedAt) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message || 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { username, password, prefix, type, metadata } = body;

        // Validate prefix based on user type
        if (type === 'client' && !prefix) {
            return NextResponse.json({ error: 'Prefix is required for client users' }, { status: 400 });
        }

        if (type === 'team' && !prefix) {
            return NextResponse.json({ error: 'Prefix is required for team users' }, { status: 400 });
        }

        if (type === 'admin' && prefix) {
            return NextResponse.json({ error: 'Admin users should not have a prefix (they have access to the entire bucket)' }, { status: 400 });
        }

        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (username) {
            fields.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push(`password = $${paramIndex++}`);
            values.push(hashedPassword);
        }
        if (prefix !== undefined) {
            fields.push(`prefix = $${paramIndex++}`);
            values.push(prefix || null);
        }
        if (type) {
            fields.push(`type = $${paramIndex++}`);
            values.push(type);
        }
        if (metadata !== undefined) {
            fields.push(`metadata = $${paramIndex++}`);
            values.push(metadata);
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        fields.push(`"updatedAt" = NOW()`);

        values.push(parseInt(id));
        const result = await query(
            `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        const user = result.rows[0];

        return NextResponse.json(user);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        // Get the user to be deleted
        const result = await query(
            'SELECT * FROM "User" WHERE id = $1',
            [userId]
        );
        const userToDelete = result.rows[0];

        if (!userToDelete) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If user is already deleted (soft deleted), return error
        if (userToDelete.deletedAt) {
            return NextResponse.json({ error: 'User is already deleted' }, { status: 400 });
        }

        // If trying to delete an admin, check if it's the last one
        if (userToDelete.type === 'admin') {
            const countResult = await query(
                'SELECT COUNT(*) FROM "User" WHERE type = $1 AND "deletedAt" IS NULL',
                ['admin']
            );
            const activeAdminCount = parseInt(countResult.rows[0].count);

            if (activeAdminCount <= 1) {
                return NextResponse.json({
                    error: 'Cannot delete the last admin user. At least one admin must exist in the system.'
                }, { status: 400 });
            }
        }

        // Soft delete: set deletedAt timestamp
        await query(
            'UPDATE "User" SET "deletedAt" = NOW() WHERE id = $1',
            [userId]
        );

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
