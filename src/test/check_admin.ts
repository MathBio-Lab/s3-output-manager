import 'dotenv/config';
import { query } from '../lib/db';

async function checkAdmin() {
    try {
        const result = await query('SELECT * FROM "User" WHERE username = $1', ['admin']);
        console.log('Admin user:', result.rows[0]);
    } catch (error) {
        console.error('Error checking admin:', error);
    }
}

checkAdmin();
