import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

export interface AuthUser {
    id: number;
    username: string;
    type: 'admin' | 'client' | 'team';
    prefix: string | null;
}

export async function getAuthUser(request?: NextRequest): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return null;
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);

        // Fetch fresh user data from database to ensure prefix is up to date
        const result = await query(
            'SELECT id, username, type, prefix, "deletedAt" FROM "User" WHERE id = $1',
            [payload.id]
        );
        const user = result.rows[0];

        if (!user || user.deletedAt) {
            return null;
        }

        return {
            id: user.id,
            username: user.username,
            type: user.type,
            prefix: user.prefix,
        };
    } catch (error) {
        return null;
    }
}

// Helper to get user prefix with trailing slash
export function getUserPrefix(user: AuthUser): string {
    if (!user.prefix) {
        return ''; // Admin users with no prefix can access everything
    }
    return user.prefix.endsWith('/') ? user.prefix : `${user.prefix}/`;
}
