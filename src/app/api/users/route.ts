import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null, // Only return non-deleted users
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(users);
    } catch (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, prefix, type, metadata } = body;

        if (!username || !password || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                prefix,
                type,
                metadata: metadata || {},
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
