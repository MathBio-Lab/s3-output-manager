import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

// Simple in-memory rate limiting
// Note: This will reset if the server restarts and may not work as expected in serverless environments without external storage (e.g., Redis)
const rateLimitMap = new Map<string, { count: number; blockedUntil?: number }>();
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        if (record) {
            if (record.blockedUntil && now < record.blockedUntil) {
                const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
                return NextResponse.json(
                    { error: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.` },
                    { status: 429 }
                );
            }
            // Reset if block expired
            if (record.blockedUntil && now >= record.blockedUntil) {
                rateLimitMap.delete(ip);
            }
        }

        const { password } = await request.json();

        if (password === config.auth.adminPassword) {
            // Reset failures on successful login
            rateLimitMap.delete(ip);

            const cookieStore = await cookies();
            cookieStore.set('auth_token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return NextResponse.json({ success: true });
        } else {
            // Handle failed attempt
            const currentRecord = rateLimitMap.get(ip) || { count: 0 };
            currentRecord.count += 1;

            if (currentRecord.count >= MAX_ATTEMPTS) {
                currentRecord.blockedUntil = now + BLOCK_DURATION;
                rateLimitMap.set(ip, currentRecord);
                return NextResponse.json(
                    { error: 'Too many failed attempts. You are blocked for 15 minutes.' },
                    { status: 429 }
                );
            } else {
                rateLimitMap.set(ip, currentRecord);
                const remaining = MAX_ATTEMPTS - currentRecord.count;
                return NextResponse.json(
                    { error: `Invalid password. ${remaining} attempts remaining.` },
                    { status: 401 }
                );
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
