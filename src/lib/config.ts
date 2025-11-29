import "dotenv/config";

function requiredEnv(name: string) {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return val;
}

export const config = {
    aws: {
        region: requiredEnv('NEXT_PUBLIC_AWS_REGION'),
        bucketName: requiredEnv('NEXT_PUBLIC_AWS_BUCKET_NAME'),
        accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
        databaseUrl: requiredEnv('DATABASE_URL'),
    },
    auth: {
        adminPassword: requiredEnv('ADMIN_PASSWORD'),
    },
};
