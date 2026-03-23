const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const originalContent = content;

// 1. Insert adminHeaders helper after showFeedback function
const showFeedbackFn = `    const showFeedback = (msg: string, ok: boolean) => {
        setFeedback({ msg, ok });
        setTimeout(() => setFeedback(null), 3000);
    };`;
const adminHeadersHelper = `
    const adminHeaders = () => ({
        'Content-Type': 'application/json',
        'x-admin-code': code,
    });
`;
content = content.replace(showFeedbackFn, showFeedbackFn + adminHeadersHelper);

// 2. Replace Content-Type only headers in admin calls
const replacements = [
    // addTeam
    ['"/api/admin/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTeamName }) }',
     '"/api/admin/teams", { method: "POST", headers: adminHeaders(), body: JSON.stringify({ name: newTeamName }) }'],
    // deleteTeam
    ['"/api/admin/teams", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }',
     '"/api/admin/teams", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) }'],
    // addJury
    ['"/api/admin/jury", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newJuryName }) }',
     '"/api/admin/jury", { method: "POST", headers: adminHeaders(), body: JSON.stringify({ name: newJuryName }) }'],
    // deleteJury
    ['"/api/admin/jury", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }',
     '"/api/admin/jury", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) }'],
    // clearEvaluations
    ['"/api/admin/evaluations", { method: "DELETE" }',
     '"/api/admin/evaluations", { method: "DELETE", headers: adminHeaders() }'],
    // addCriterion / addInlineCriterion
    ['"/api/admin/rubric", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }',
     '"/api/admin/rubric", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }'],
    // saveEdit
    ['"/api/admin/rubric", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }',
     '"/api/admin/rubric", { method: "PUT", headers: adminHeaders(), body: JSON.stringify(payload) }'],
    // deleteCriterion
    ['"/api/admin/rubric", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }',
     '"/api/admin/rubric", { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ id }) }'],
];

let patchCount = 0;
for (const [from, to] of replacements) {
    if (content.includes(from)) {
        content = content.replaceAll(from, to);
        patchCount++;
        console.log(`✅ Patched: ${from.substring(0, 60)}...`);
    } else {
        console.warn(`⚠️  Not found: ${from.substring(0, 60)}...`);
    }
}

// Also patch updatePasscode (which does PATCH for teams and jury)
const updatePasscodeOld = `const res = await fetch(\`/api/admin/\${type}\`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, passcode: passcode ?? "" }),
        });`;
const updatePasscodeNew = `const res = await fetch(\`/api/admin/\${type}\`, {
            method: "PATCH",
            headers: adminHeaders(),
            body: JSON.stringify({ id, passcode: passcode ?? "" }),
        });`;

if (content.includes(updatePasscodeOld)) {
    content = content.replace(updatePasscodeOld, updatePasscodeNew);
    patchCount++;
    console.log('✅ Patched: updatePasscode');
} else {
    console.warn('⚠️  Not found: updatePasscode');
}

// Also patch saveSettings if it exists
const saveSettingsOld = `"/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },`;
const saveSettingsNew = `"/api/admin/settings", {
            method: "POST",
            headers: adminHeaders(),`;
if (content.includes(saveSettingsOld)) {
    content = content.replace(saveSettingsOld, saveSettingsNew);
    patchCount++;
    console.log('✅ Patched: saveSettings');
} else {
    console.warn('⚠️  saveSettings not found with that exact pattern, trying alternate...');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Done! ${patchCount} replacements applied.`);
