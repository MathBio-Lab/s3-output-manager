import fs from 'fs';
import path from 'path';
import { query } from '../lib/db';

async function init() {
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    try {
        await query(schemaSql);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

init();
