const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

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
