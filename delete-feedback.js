const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

// Load .env.local manually
const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envLocal.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/)?.[1] || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
    try {
        const deleted = await sql`
            DELETE FROM mentor_feedback 
            WHERE comment = 'Тест' OR comment = 'Тест коментар'
            RETURNING *
        `;
        console.log('Deleted rows:', deleted);
    } catch (e) {
        console.error(e);
    }
}

run();
