import "dotenv/config";

export const config = {
    aws: {
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
        bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        databaseUrl: process.env.DATABASE_URL || '',
    },
    auth: {
        adminPassword: process.env.ADMIN_PASSWORD || '',
    },
};
