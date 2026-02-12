import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Month name to number mapping
const monthMap = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12,
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
  'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Sept': 9,
  'Oct': 10, 'Nov': 11, 'Dec': 12
};

// Number to month name mapping
const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

// Helper function to convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel date starts from 1900-01-01, but has a bug counting 1900 as leap year
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

console.log('Starting Excel to JSON conversion...\n');

// Read Excel file
const excelPath = path.join(__dirname, '..', 'recognition', 'awards.xlsx');
console.log(`Reading Excel file from: ${excelPath}`);

if (!fs.existsSync(excelPath)) {
  console.error('❌ Error: awards.xlsx not found at', excelPath);
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
console.log(`Found sheet: ${sheetName}`);

const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const rawData = XLSX.utils.sheet_to_json(sheet);
console.log(`Found ${rawData.length} rows of data\n`);

// Transform to awards structure
const awards = rawData.map((row, index) => {
  try {
    // Calculate deadline date for current year
    const currentYear = new Date().getFullYear();
    const monthData = row['Final Due Date - Month'];
    let month, monthName;

    // Handle month as either string name or number
    if (typeof monthData === 'string') {
      monthName = monthData.trim();
      month = monthMap[monthName] || 1;
    } else if (typeof monthData === 'number') {
      month = Math.floor(monthData);
      monthName = monthNames[month] || 'January';
    } else {
      month = 1;
      monthName = 'January';
    }

    const day = parseInt(row['Final Due Date - Day']) || 1;

    // Create deadline date
    let deadlineDate = new Date(currentYear, month - 1, day);

    // If deadline has passed, set it for next year
    if (deadlineDate < new Date()) {
      deadlineDate = new Date(currentYear + 1, month - 1, day);
    }

    // Handle internal deadline - could be Excel serial date or string
    let internalDeadline = '';
    const internalData = row['Internal Due Date'];
    if (typeof internalData === 'number') {
      const date = excelDateToJSDate(internalData);
      internalDeadline = date ? date.toISOString().split('T')[0] : '';
    } else {
      internalDeadline = (internalData || '').toString().trim();
    }

    const award = {
      id: uuidv4(),
      title: (row['Title of Award'] || '').toString().trim(),
      deadlineMonth: monthName,
      deadlineDay: day,
      deadlineDate: deadlineDate.toISOString().split('T')[0],
      level: (row['Level'] || '').toString().trim(),
      applicationMode: (row['Mode of Application'] || '').toString().trim(),
      awardFor: (row['Award for'] || '').toString().trim(),
      type: (row['Type of Award'] || '').toString().trim(),
      internalDeadline: internalDeadline,
      requirements: (row['Requirements'] || '').toString().trim(),
      previousAwardees: (row['Previous Awardees'] || '').toString().trim(),
      link: (row['Link to Award'] || '').toString().trim(),
      dateAdded: new Date().toISOString(),
      status: 'active',
      isRecurring: true
    };

    console.log(`✓ Processed: ${award.title}`);
    return award;
  } catch (error) {
    console.error(`❌ Error processing row ${index + 1}:`, error.message);
    return null;
  }
}).filter(award => award !== null && award.title); // Remove failed conversions and empty titles

// Create final structure
const awardsData = {
  awards: awards,
  lastUpdated: new Date().toISOString(),
  version: '1.0'
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'docs', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('\n✓ Created data directory');
}

// Write to file
const outputPath = path.join(dataDir, 'awards.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(awardsData, null, 2),
  'utf8'
);

console.log(`\n✅ SUCCESS!`);
console.log(`   Converted ${awards.length} awards from Excel to JSON`);
console.log(`   Output file: ${outputPath}`);
console.log(`\n📊 Summary:`);
console.log(`   - Total awards: ${awards.length}`);
console.log(`   - Unique levels: ${[...new Set(awards.map(a => a.level))].length}`);
console.log(`   - Unique types: ${[...new Set(awards.map(a => a.type))].length}`);
console.log(`\nNext steps:`);
console.log(`   1. Review the generated awards.json file`);
console.log(`   2. The file is already in docs/data/ and ready to serve`);
console.log(`   3. The original Excel file can be archived`);
