import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_FIELDS = ['id', 'title', 'deadlineMonth', 'deadlineDay', 'deadlineDate', 'link'];
const OPTIONAL_FIELDS = ['level', 'applicationMode', 'awardFor', 'type', 'internalDeadline',
                         'requirements', 'previousAwardees', 'dateAdded', 'status', 'isRecurring'];

console.log('🔍 Validating awards.json...\n');

try {
  // Read awards.json
  const dataPath = path.join(__dirname, '..', 'docs', 'data', 'awards.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: awards.json not found at', dataPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');

  // Check if valid JSON
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Invalid JSON format:', error.message);
    saveValidationResults({
      valid: false,
      errors: ['Invalid JSON format: ' + error.message]
    });
    process.exit(1);
  }

  // Validate structure
  if (!data.awards || !Array.isArray(data.awards)) {
    console.error('❌ Missing or invalid "awards" array');
    saveValidationResults({
      valid: false,
      errors: ['Missing or invalid "awards" array']
    });
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  console.log(`Found ${data.awards.length} awards\n`);

  // Validate each award
  data.awards.forEach((award, index) => {
    const awardNum = index + 1;

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!award[field]) {
        errors.push(`Award #${awardNum} (${award.title || 'Unknown'}): Missing required field "${field}"`);
      }
    });

    // Validate title
    if (award.title && award.title.length < 3) {
      warnings.push(`Award #${awardNum}: Title is too short (${award.title})`);
    }

    // Validate URL format
    if (award.link) {
      try {
        new URL(award.link);
      } catch {
        errors.push(`Award #${awardNum} (${award.title}): Invalid URL format for link`);
      }
    }

    // Validate deadline date format (YYYY-MM-DD)
    if (award.deadlineDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(award.deadlineDate)) {
        errors.push(`Award #${awardNum} (${award.title}): Invalid date format for deadlineDate (expected YYYY-MM-DD)`);
      } else {
        // Check if it's a valid date
        const date = new Date(award.deadlineDate);
        if (isNaN(date.getTime())) {
          errors.push(`Award #${awardNum} (${award.title}): Invalid deadline date`);
        }
      }
    }

    // Validate deadline day (1-31)
    if (award.deadlineDay && (award.deadlineDay < 1 || award.deadlineDay > 31)) {
      errors.push(`Award #${awardNum} (${award.title}): Invalid deadline day (must be 1-31)`);
    }

    // Check for duplicate IDs
    const duplicateId = data.awards.filter(a => a.id === award.id).length > 1;
    if (duplicateId) {
      errors.push(`Award #${awardNum} (${award.title}): Duplicate ID found`);
    }
  });

  // Check for duplicate titles
  const titles = data.awards.map(a => a.title.toLowerCase());
  const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
  if (duplicateTitles.length > 0) {
    duplicateTitles.forEach(title => {
      warnings.push(`Potential duplicate title: "${title}"`);
    });
  }

  // Report results
  console.log('📊 Validation Results:');
  console.log('─────────────────────');
  console.log(`Total Awards: ${data.awards.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(error => console.log(`  • ${error}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
    console.log();
  }

  // Save validation results for GitHub Actions
  const results = {
    valid: errors.length === 0,
    totalAwards: data.awards.length,
    errors: errors,
    warnings: warnings
  };

  saveValidationResults(results);

  if (errors.length > 0) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED');
    process.exit(0);
  }

} catch (error) {
  console.error('❌ Unexpected error:', error);
  saveValidationResults({
    valid: false,
    errors: ['Unexpected error: ' + error.message]
  });
  process.exit(1);
}

function saveValidationResults(results) {
  const resultsPath = path.join(__dirname, 'validation-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}
