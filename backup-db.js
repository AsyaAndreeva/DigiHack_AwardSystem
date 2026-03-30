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

async function backupDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found in .env.local');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);
    const backupFile = path.join(__dirname, 'backup_award_system.json');

    try {
        console.log('🔄 Starting full database backup...');
        
        const backupData = {
            timestamp: new Date().toISOString(),
            teams: await sql`SELECT * FROM teams`,
            jury_members: await sql`SELECT * FROM jury_members`,
            evaluations: await sql`SELECT * FROM evaluations`,
            rubric_criteria: await sql`SELECT * FROM rubric_criteria`,
            settings: await sql`SELECT * FROM settings`
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        console.log('✅ Backup successful!');
        console.log(`📂 Saved to: ${backupFile}`);
        console.log(`📊 Summary: 
          - Teams: ${backupData.teams.length}
          - Jury: ${backupData.jury_members.length}
          - Evaluations: ${backupData.evaluations.length}
          - Criteria: ${backupData.rubric_criteria.length}
        `);
    } catch (err) {
        console.error('❌ Backup Error:', err.message);
        process.exit(1);
    }
}

backupDatabase();
