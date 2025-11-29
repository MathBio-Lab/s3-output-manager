import "dotenv/config";

function requiredEnv(name: string): string {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return val;
}

function optionalEnv(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

export const config = {
    aws: {
        region: requiredEnv('NEXT_PUBLIC_AWS_REGION'),
        bucketName: requiredEnv('NEXT_PUBLIC_AWS_BUCKET_NAME'),
        accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
    },
    database: {
        url: requiredEnv('DATABASE_URL'),
    },
    auth: {
        adminPassword: requiredEnv('ADMIN_PASSWORD'),
        jwtSecret: requiredEnv('JWT_SECRET'),
    },
    app: {
        nodeEnv: optionalEnv('NODE_ENV', 'development'),
        isProduction: process.env.NODE_ENV === 'production',
    },
};
