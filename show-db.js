const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
    });
}

const { neon } = require('@neondatabase/serverless');

async function showDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found in .env.local');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log('\n========== TEAMS ==========');
        const teams = await sql`SELECT id, name, passcode FROM teams ORDER BY name`;
        console.table(teams.map(t => ({ id: t.id, name: t.name, passcode: t.passcode })));

        console.log('\n========== JURY MEMBERS ==========');
        const jury = await sql`SELECT id, name, passcode FROM jury_members ORDER BY name`;
        console.table(jury.map(j => ({ id: j.id, name: j.name, passcode: j.passcode })));

        console.log('\n========== EVALUATIONS ==========');
        const evals = await sql`
            SELECT jury_name, team_name, total_score, 
                   COALESCE(comments, '') AS comments,
                   array_length(ARRAY(SELECT jsonb_object_keys(scores)), 1) AS criteria_filled
            FROM evaluations ORDER BY team_name, jury_name
        `;
        console.table(evals);

        console.log('\n========== RUBRIC CRITERIA ==========');
        const rubric = await sql`SELECT id, category, criterion, max_score FROM rubric_criteria ORDER BY order_idx`;
        console.table(rubric);

        console.log('\n========== SETTINGS ==========');
        const settings = await sql`SELECT key, value FROM settings ORDER BY key`;
        console.table(settings);

        console.log('\n========== SUMMARY ==========');
        const [tc] = await sql`SELECT COUNT(*) AS count FROM teams`;
        const [jc] = await sql`SELECT COUNT(*) AS count FROM jury_members`;
        const [ec] = await sql`SELECT COUNT(*) AS count FROM evaluations`;
        const [rc] = await sql`SELECT COUNT(*) AS count FROM rubric_criteria`;
        console.log(`  Teams:       ${tc.count}`);
        console.log(`  Jury:        ${jc.count}`);
        console.log(`  Evaluations: ${ec.count}`);
        console.log(`  Criteria:    ${rc.count}`);
        console.log('');
    } catch (err) {
        console.error('DB Error:', err.message);
    }
}

showDatabase();
