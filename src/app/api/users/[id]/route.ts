import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserType, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

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

        const updateData: {
            username?: string;
            password?: string;
            prefix?: string | null;
            type?: UserType;
            metadata?: Prisma.InputJsonValue;
        } = {};

        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (prefix !== undefined) updateData.prefix = prefix || null;
        if (type) updateData.type = type;
        if (metadata !== undefined) updateData.metadata = metadata;

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

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
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToDelete) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If user is already deleted (soft deleted), return error
        if (userToDelete.deletedAt) {
            return NextResponse.json({ error: 'User is already deleted' }, { status: 400 });
        }

        // If trying to delete an admin, check if it's the last one
        if (userToDelete.type === 'admin') {
            const activeAdminCount = await prisma.user.count({
                where: {
                    type: 'admin',
                    deletedAt: null, // Only count non-deleted admins
                },
            });

            if (activeAdminCount <= 1) {
                return NextResponse.json({
                    error: 'Cannot delete the last admin user. At least one admin must exist in the system.'
                }, { status: 400 });
            }
        }

        // Soft delete: set deletedAt timestamp
        await prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
