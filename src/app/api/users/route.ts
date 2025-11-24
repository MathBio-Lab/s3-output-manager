import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '@/lib/config';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

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

        // Ensure prefix ends with / if it exists
        const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : prefix;

        // If client, ensure prefix exists in S3
        if (type === 'client' && normalizedPrefix) {
            try {
                console.log(`Checking if prefix exists: ${normalizedPrefix}`);
                await s3Client.send(new HeadObjectCommand({
                    Bucket: config.aws.bucketName,
                    Key: normalizedPrefix,
                }));
                console.log(`Prefix ${normalizedPrefix} exists`);
            } catch (error: any) {
                if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                    console.log(`Prefix ${normalizedPrefix} not found, creating...`);
                    try {
                        await s3Client.send(new PutObjectCommand({
                            Bucket: config.aws.bucketName,
                            Key: normalizedPrefix,
                            Body: '',
                        }));
                        console.log(`Prefix ${normalizedPrefix} created`);
                    } catch (createError) {
                        console.error('Failed to create prefix:', createError);
                        return NextResponse.json({ error: 'Failed to create S3 folder for user' }, { status: 500 });
                    }
                } else {
                    console.error('Error checking prefix:', error);
                    // Don't block user creation if just checking failed, but maybe warn?
                    // For now, let's assume if we can't check, we proceed or fail?
                    // Let's fail to be safe.
                    return NextResponse.json({ error: 'Failed to validate S3 prefix' }, { status: 500 });
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                prefix: normalizedPrefix,
                type,
                metadata: metadata || {},
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
