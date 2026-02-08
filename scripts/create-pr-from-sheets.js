import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GOOGLE_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT;

// Initialize clients
const octokit = new Octokit({ auth: GITHUB_TOKEN });
const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] || '';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';

// Month mapping
const monthMap = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
};

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

async function main() {
  console.log('🔍 Checking for new award submissions...\n');

  if (!GITHUB_TOKEN || !SPREADSHEET_ID || !GOOGLE_CREDENTIALS) {
    console.error('❌ Missing required environment variables');
    console.error('Required: GITHUB_TOKEN, SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT');
    process.exit(1);
  }

  try {
    // Initialize Google Sheets API
    const credentials = JSON.parse(GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get the last processed row number from a file or variable
    const lastProcessedRow = await getLastProcessedRow();
    console.log(`Last processed row: ${lastProcessedRow}`);

    // Fetch new submissions
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Form Responses 1!A${lastProcessedRow + 1}:M1000`,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.log('✅ No new submissions found');
      return;
    }

    console.log(`Found ${rows.length} new submission(s)\n`);

    // Process each new submission
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = lastProcessedRow + i + 1;

      try {
        await processSubmission(row, rowNumber, sheets);
      } catch (error) {
        console.error(`❌ Failed to process row ${rowNumber}:`, error.message);
        continue;
      }
    }

    // Update last processed row
    await setLastProcessedRow(lastProcessedRow + rows.length);
    console.log(`\n✅ Processing complete. Updated last processed row to ${lastProcessedRow + rows.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

async function processSubmission(row, rowNumber, sheets) {
  console.log(`Processing submission from row ${rowNumber}...`);

  // Map form data to award structure
  // Assuming form columns match: Timestamp, Title, Month, Day, Level, Mode, AwardFor, Type, Internal, Reqs, Previous, Link
  const monthData = row[2];
  let month, monthName;

  if (typeof monthData === 'string') {
    monthName = monthData.trim();
    month = monthMap[monthName] || 1;
  } else if (typeof monthData === 'number') {
    month = Math.floor(monthData);
    monthName = monthNames[month] || 'January';
  } else {
    monthName = 'January';
    month = 1;
  }

  const currentYear = new Date().getFullYear();
  const day = parseInt(row[3]) || 1;
  let deadlineDate = new Date(currentYear, month - 1, day);

  if (deadlineDate < new Date()) {
    deadlineDate = new Date(currentYear + 1, month - 1, day);
  }

  const award = {
    id: uuidv4(),
    title: (row[1] || '').toString().trim(),
    deadlineMonth: monthName,
    deadlineDay: day,
    deadlineDate: deadlineDate.toISOString().split('T')[0],
    level: (row[4] || '').toString().trim(),
    applicationMode: (row[5] || '').toString().trim(),
    awardFor: (row[6] || '').toString().trim(),
    type: (row[7] || '').toString().trim(),
    internalDeadline: (row[8] || '').toString().trim(),
    requirements: (row[9] || '').toString().trim(),
    previousAwardees: (row[10] || '').toString().trim(),
    link: (row[11] || '').toString().trim(),
    dateAdded: new Date().toISOString(),
    status: 'active',
    isRecurring: true
  };

  // Validate award
  if (!award.title || !award.link) {
    throw new Error('Missing required fields: title or link');
  }

  console.log(`  Award: "${award.title}"`);

  // Read current awards.json
  const dataPath = path.join(__dirname, '..', 'data', 'awards.json');
  const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Check for duplicates
  const isDuplicate = currentData.awards.some(a =>
    a.title.toLowerCase() === award.title.toLowerCase() &&
    a.link === award.link
  );

  if (isDuplicate) {
    console.log(`  ⚠️  Duplicate award detected, skipping`);
    // Mark as processed in sheet
    await markAsProcessed(sheets, rowNumber, 'Duplicate');
    return;
  }

  // Add new award
  currentData.awards.push(award);
  currentData.lastUpdated = new Date().toISOString();

  // Create branch name
  const branchName = `submissions/award-${award.id.slice(0, 8)}`;

  // Get main branch ref
  const mainBranch = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  });

  // Create new branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: mainBranch.data.object.sha,
  });

  console.log(`  ✓ Created branch: ${branchName}`);

  // Get current file content
  const fileContent = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: 'data/awards.json',
    ref: 'main',
  });

  // Update file
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'data/awards.json',
    message: `Add award: ${award.title}`,
    content: Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64'),
    sha: fileContent.data.sha,
    branch: branchName,
  });

  console.log(`  ✓ Committed changes`);

  // Create pull request
  const prBody = createPRBody(award);

  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `New Award: ${award.title}`,
    head: branchName,
    base: 'main',
    body: prBody,
  });

  // Add labels
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.data.number,
    labels: ['new-award', 'needs-review'],
  });

  console.log(`  ✓ Created PR #${pr.data.number}`);
  console.log(`  📝 ${pr.data.html_url}\n`);

  // Mark as processed in sheet
  await markAsProcessed(sheets, rowNumber, `PR #${pr.data.number}`);
}

function createPRBody(award) {
  return `## New Award Submission

**Title:** ${award.title}
**Level:** ${award.level}
**Final Deadline:** ${award.deadlineMonth} ${award.deadlineDay}
${award.internalDeadline ? `**Internal Deadline:** ${award.internalDeadline}` : ''}

### Details
- **Application Mode:** ${award.applicationMode}
- **Award For:** ${award.awardFor}
- **Type:** ${award.type}
- **Link:** [View Award](${award.link})

### Requirements
${award.requirements || 'N/A'}

### Previous Awardees
${award.previousAwardees || 'N/A'}

---

### Review Checklist
- [ ] Award information is accurate
- [ ] No duplicate entries
- [ ] Deadlines are correct
- [ ] Link is valid and accessible
- [ ] Requirements are complete

### Actions
- **Approve & Merge:** Award will appear on website within 2 minutes
- **Request Changes:** Edit the JSON in the "Files Changed" tab
- **Close PR:** Reject this submission

---
*Automated submission from Google Form*
*Award ID: ${award.id}*`;
}

async function markAsProcessed(sheets, rowNumber, status) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Form Responses 1!M${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[`${status} - ${new Date().toISOString()}`]],
      },
    });
  } catch (error) {
    console.error(`  ⚠️  Failed to mark row ${rowNumber} as processed:`, error.message);
  }
}

async function getLastProcessedRow() {
  const statePath = path.join(__dirname, '..', '.github', 'state.json');

  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return state.lastProcessedRow || 1;
  }

  return 1; // Start from row 2 (row 1 is headers)
}

async function setLastProcessedRow(row) {
  const stateDir = path.join(__dirname, '..', '.github');
  const statePath = path.join(stateDir, 'state.json');

  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  fs.writeFileSync(statePath, JSON.stringify({ lastProcessedRow: row }, null, 2));
}

// Run
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
