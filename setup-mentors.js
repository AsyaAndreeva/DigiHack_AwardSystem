const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
    });
}

async function setupMentors() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found in .env.local');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log('🔄 Initializing Mentor tables...');
        
        // Clean up any partially created tables with wrong types
        await sql`DROP TABLE IF EXISTS mentor_feedback`;
        await sql`DROP TABLE IF EXISTS mentors`;

        // 1. Create mentors table
        await sql`
            CREATE TABLE mentors (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name VARCHAR(255) NOT NULL,
                passcode VARCHAR(20) UNIQUE NOT NULL
            )
        `;
        console.log('✅ table "mentors" is ready!');

        // 2. Create mentor_feedback table (Safe - only if not exists)
        await sql`
            CREATE TABLE IF NOT EXISTS mentor_feedback (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                mentor_id VARCHAR(255) REFERENCES mentors(id),
                team_id VARCHAR(255) REFERENCES teams(id),
                comment TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(mentor_id, team_id) -- One feedback per mentor per team
            )
        `;
        console.log('✅ table "mentor_feedback" is ready!');

        // 3. Add initial mentors for testing (Safe - only if not exists)
        const initialMentors = [
            { name: 'Ментор 1', passcode: 'MNT1X' },
            { name: 'Ментор 2', passcode: 'MNT2Y' }
        ];

        for (const m of initialMentors) {
            const exists = await sql`SELECT id FROM mentors WHERE passcode = ${m.passcode}`;
            if (exists.length === 0) {
                await sql`INSERT INTO mentors (name, passcode) VALUES (${m.name}, ${m.passcode})`;
                console.log(`👤 Added mentor: ${m.name} (Passcode: ${m.passcode})`);
            }
        }
        
        console.log('\n✅ Mentor setup complete!');
    } catch (err) {
        console.error('❌ Setup Error:', err.message);
        process.exit(1);
    }
}

setupMentors();
