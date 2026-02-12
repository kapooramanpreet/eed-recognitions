import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Converting EEd Awards CSV to JSON...\n');

try {
  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'data', 'eed-awards.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  // Parse CSV using csv-parse library
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const awards = [];

  // Process each record
  for (const record of records) {
    // Extract fields using column names
    const title = record['Official Title of the Award'];
    const awardLevel = record['Award Level'];
    const eligibleApplicants = record['Eligible Applicant Group(s)'];
    const applicationMode = record['Application Mode'];
    const typeOfAward = record['Type of Award'];
    const requirements = record['Key Requirements and Eligibility Criteria'];
    const link = record['Link to the Official Award Application/Information Page'];
    const finalDeadline = record['Final Submission Due Date'];
    const internalDeadline = record['Internal Due Date for Review/Approval (If applicable)'] || '';
    const previousAwardees = record['List of Previous Awardees from the Department (If known)'] || '';

    if (!title || !link || !finalDeadline) continue; // Skip if missing required fields

    // Parse deadline (format: M/D/YYYY)
    const deadlineDate = parseDeadline(finalDeadline);

    // Clean up level (remove parenthetical explanations and split by semicolon)
    const levelCleaned = awardLevel
      .split(';')
      .map(l => l.replace(/\s*\(.*?\)\s*/g, '').trim())
      .filter(l => l)
      .join(', ');

    // Parse applicant groups (split by semicolon)
    const awardFor = eligibleApplicants
      .split(';')
      .map(a => a.trim())
      .filter(a => a)
      .join(', ');

    // Parse type of award (split by semicolon)
    const type = typeOfAward
      .split(';')
      .map(t => t.trim())
      .filter(t => t)
      .join(', ');

    // Parse internal deadline if exists
    let internalDeadlineFormatted = '';
    if (internalDeadline) {
      const internalDate = parseDeadline(internalDeadline);
      if (internalDate) {
        internalDeadlineFormatted = internalDate.date;
      }
    }

    // Create award object
    const award = {
      id: uuidv4(),
      title: title.trim(),
      deadlineMonth: deadlineDate.month,
      deadlineDay: deadlineDate.day,
      deadlineDate: deadlineDate.date,
      level: levelCleaned,
      applicationMode: applicationMode.trim(),
      awardFor: awardFor,
      type: type,
      internalDeadline: internalDeadlineFormatted,
      requirements: requirements.trim(),
      previousAwardees: previousAwardees.trim(),
      link: link.trim(),
      dateAdded: new Date().toISOString(),
      status: 'active',
      isRecurring: true
    };

    awards.push(award);
    console.log(`✓ Processed: ${award.title}`);
  }

  // Create JSON structure
  const jsonData = {
    awards: awards,
    lastUpdated: new Date().toISOString(),
    version: '2.0'
  };

  // Write to awards.json
  const outputPath = path.join(__dirname, '..', 'docs', 'data', 'awards.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ Successfully converted ${awards.length} awards to JSON`);
  console.log(`📁 Output: ${outputPath}\n`);

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

// Parse deadline from M/D/YYYY format
function parseDeadline(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;

  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0]);
  const day = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const monthName = monthNames[month] || 'January';

  // Create date in YYYY-MM-DD format
  const dateObj = new Date(year, month - 1, day);
  const isoDate = dateObj.toISOString().split('T')[0];

  return {
    month: monthName,
    day: day,
    date: isoDate
  };
}
