# EEd Recognition Portal

A fully automated GitHub Pages website for managing and displaying academic awards and recognitions for the Department of Engineering Education. Features include powerful filtering, calendar reminders, and automated submission workflow via Google Forms.

🌐 **Live Website:** `https://kapooramanpreet.github.io/eed-recognitions`

## Features

- ✨ **Modern, Responsive Interface** - Beautiful UI that works on all devices
- 🔍 **Powerful Filtering** - Filter by level, category, type, deadline range, and keyword search
- 📅 **Calendar Integration** - Download .ics files to add award deadlines to any calendar app
- 🤖 **Automated Workflow** - Google Form submissions automatically create pull requests
- ✅ **Easy Approval Process** - Review and approve submissions via GitHub pull requests
- 🚀 **Auto-Deployment** - Changes go live within 2 minutes of approval
- 📊 **Data-Driven** - All awards stored in structured JSON format

## Quick Start

### Prerequisites

- GitHub account
- Google account (for Forms & Sheets)
- Google Cloud account (free tier)
- Node.js 20+ (for local development)

### 1. Initial Setup (One-Time)

#### A. Clone and Install

```bash
git clone https://github.com/<your-username>/claude-test.git
cd claude-test
cd scripts
npm install
```

#### B. Convert Award Data (Optional)

```bash
npm run convert
```

This converts `data/eed-awards.csv` to `data/awards.json`. The system comes with pre-populated award data. Only run this if you have a new CSV export to convert. Review the generated JSON file before proceeding.

### 2. GitHub Setup

#### A. Create Repository

```bash
git init
git add .
git commit -m "Initial commit: Awards Management System"
git remote add origin https://github.com/<your-username>/claude-test.git
git push -u origin main
```

#### B. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main`, **Folder:** `/docs`
4. Click **Save**

Your website will be live at `https://<your-username>.github.io/claude-test/` in a few minutes!

### 3. Google Cloud Setup

#### A. Create Project & Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Awards Management"
3. Navigate to **APIs & Services** → **Library**
4. Search and enable **Google Sheets API**

#### B. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: `github-actions-sheets-reader`
4. Click **Create and Continue**
5. Role: **Editor** (or custom role with Sheets read/write)
6. Click **Done**

#### C. Generate Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON** format
5. Download the file (keep it secure!)
6. Copy the entire JSON content
7. **Important:** Copy the service account email (format: `xxx@xxx.iam.gserviceaccount.com`)

### 4. Google Form & Sheets Setup

#### A. Create Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create new form: "Submit Award Nomination"
3. Add fields (in this order):

   | Field Name | Type | Settings |
   |------------|------|----------|
   | Official Title of the Award | Short answer | Required |
   | Award Level | Checkboxes | Required, Options: University (internal to UF), College (internal to UF), Department (internal to UF), National/External |
   | Eligible Applicant Group(s) | Checkboxes | Required, Options: Faculty, Staff, Graduate Students, Undergraduate Students, Courses/Programs |
   | Application Mode | Multiple choice | Required, Options: Internal Review Required (Committee/Departmental Review), Apply Independently (No Internal Review Required) |
   | Type of Award | Checkboxes | Optional, Options: Cash/Monetary Prize, Research Grant/Funding, Plaque/Certificate, Scholarship, Trophy, Other |
   | Key Requirements and Eligibility Criteria | Long answer | Required |
   | Link to the Official Award Application/Information Page | Short answer | Required, URL validation |
   | Final Submission Due Date | Date | Required |
   | Internal Due Date for Review/Approval (If applicable) | Date | Optional |
   | List of Previous Awardees from the Department (If known) | Long answer | Optional |
   | Any other comments | Long answer | Optional, Add note: "This won't be posted publicly" |

#### B. Link to Google Sheets

1. In your form, click **Responses** tab
2. Click the Google Sheets icon
3. Choose **Create a new spreadsheet**
4. Name: "Awards Submissions"
5. The sheet will open automatically

#### C. Share Sheet with Service Account

1. In the spreadsheet, click **Share** button
2. Paste the service account email you copied earlier
3. Set permission to **Editor**
4. **Uncheck** "Notify people"
5. Click **Share**

#### D. Add Processing Column

1. In the spreadsheet, add header **"Processed"** in column M
2. This column will be automatically populated by the automation

#### E. Get Spreadsheet ID

1. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
2. Save this ID for the next step

### 5. Configure GitHub Secrets

1. Go to your GitHub repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

   **Secret 1: GOOGLE_SERVICE_ACCOUNT**
   - Name: `GOOGLE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON content from the service account key file

   **Secret 2: SPREADSHEET_ID**
   - Name: `SPREADSHEET_ID`
   - Value: The spreadsheet ID from the Google Sheets URL

### 6. Enable GitHub Actions

1. Go to repository **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select "Allow all actions and reusable workflows"
3. Under **Workflow permissions**, select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click **Save**

### 7. Update Form Link

1. Get your Google Form's public URL
2. Edit `docs/index.html`
3. Find the line with `id="submit-form-link"`
4. Replace `href="#"` with your form URL: `href="YOUR_FORM_URL"`
5. Commit and push:
   ```bash
   git add docs/index.html
   git commit -m "Add Google Form link"
   git push
   ```

## Usage

### For End Users

#### Browsing Awards

1. Visit the website: `https://<your-username>.github.io/claude-test/`
2. Use filters to find relevant awards:
   - **Search** - Enter keywords to search across titles, requirements, etc.
   - **Level** - Filter by department, college, or university level
   - **Award For** - Filter by recipient category (Faculty, Staff, Students)
   - **Type** - Filter by award type
   - **Deadline** - Filter by upcoming deadlines (30, 60, 90, 180 days)
3. Click **View Details** to open the official award page
4. Click the calendar icon to download a deadline reminder

#### Submitting New Awards

1. Click **"Submit an Award via Google Form"** in the footer
2. Fill out all required fields
3. Submit the form
4. Your submission will be reviewed within 24 hours

### For Repository Owner (You)

#### Reviewing Submissions

**When you receive a PR notification:**

1. Click the link in your email or go to the **Pull requests** tab
2. Review the award details in the PR description
3. Click **"Files changed"** to see the exact JSON changes
4. **To Approve:**
   - Click **"Merge pull request"**
   - Confirm the merge
   - Website updates automatically in ~2 minutes
5. **To Edit Before Approval:**
   - Click **"Files changed"** → Click on `data/awards.json`
   - Click "..." → **"Edit file"**
   - Make your changes
   - Click **"Commit changes"**
   - Then merge the PR
6. **To Reject:**
   - Click **"Close pull request"**
   - Add a comment explaining why (optional)

#### Manual Submission (Bypass Form)

To add an award directly:

1. Edit `data/awards.json`
2. Add your award object to the `awards` array
3. Ensure all required fields are present
4. Run `node scripts/validate-award.js` to check for errors
5. Commit and push to main branch

## How It Works

### Architecture Overview

```
User → Google Form → Google Sheets →
GitHub Actions (every 15 min) → Create PR →
You Review & Merge → Auto-Deploy → Live Website
```

### Automated Workflow

1. **Submission**: User fills Google Form
2. **Storage**: Response saved to Google Sheets
3. **Detection**: GitHub Actions runs every 15 minutes, checks for new rows
4. **Validation**: Validates required fields and checks for duplicates
5. **PR Creation**: Creates pull request with formatted award details
6. **Review**: You receive notification to review
7. **Approval**: You merge the PR
8. **Deployment**: GitHub Pages automatically deploys updated site
9. **Live**: Award appears on website within 2 minutes

### File Structure

```
claude-test/
├── .github/
│   ├── workflows/
│   │   ├── check-form-submissions.yml  # Polls Google Forms
│   │   ├── deploy.yml                  # Deploys to GitHub Pages
│   │   └── validate-pr.yml             # Validates award data
│   └── PULL_REQUEST_TEMPLATE.md        # PR template
├── data/
│   ├── awards.json                     # Main awards database
│   └── eed-awards.csv                  # Source CSV export
├── docs/                               # GitHub Pages site
│   ├── index.html                      # Main page
│   ├── assets/
│   │   ├── css/styles.css              # Custom styles (UF branding)
│   │   └── js/
│   │       ├── app.js                  # Main application
│   │       └── libs/ics.min.js         # Calendar generation
│   └── data/awards.json                # Copy of awards data
├── scripts/
│   ├── csv-to-json.js                  # CSV to JSON conversion
│   ├── excel-to-json.js                # Legacy Excel conversion
│   ├── create-pr-from-sheets.js        # PR automation
│   ├── validate-award.js               # Data validation
│   └── package.json                    # Dependencies
├── .gitignore
└── README.md
```

## Maintenance

### Daily/Weekly Tasks

- Check GitHub notifications for new PRs
- Review and approve/reject submissions
- Verify Google Form is accessible

### Monthly Tasks

- Review GitHub Actions usage (free tier: 2000 min/month)
- Check for any failed workflow runs
- Update award deadlines if needed

### Yearly Tasks

- Update recurring award deadlines for next year
- Archive old/expired awards (set `status: "archived"`)
- Review and update form fields if needed

## Troubleshooting

### Issue: GitHub Action Fails

**Solution:**
1. Check **Actions** tab in GitHub
2. Click on failed workflow
3. View logs for error messages
4. Common fixes:
   - Verify secrets are configured correctly
   - Check Google Sheet is shared with service account
   - Ensure spreadsheet ID is correct

### Issue: Website Doesn't Update After Merge

**Solution:**
1. Check **Actions** tab → Verify deploy workflow succeeded
2. Wait up to 5 minutes for GitHub Pages cache
3. Try hard refresh in browser (Ctrl+Shift+R)
4. Check GitHub Pages settings are correct

### Issue: No PRs Created from Form Submissions

**Solution:**
1. Verify form responses are going to Google Sheets
2. Check service account has Editor access to sheet
3. Verify `SPREADSHEET_ID` secret is correct
4. Check column M ("Processed") exists in sheet
5. Manually trigger workflow: **Actions** → **check-form-submissions** → **Run workflow**

### Issue: Calendar Download Doesn't Work

**Solution:**
- Ensure JavaScript is enabled in browser
- Try different browser
- Check browser console for errors (F12 → Console)

## Development

### Local Testing

```bash
# Test the website locally
cd docs
python -m http.server 8000

# Or use Node.js
npx http-server docs -p 8000
```

Visit `http://localhost:8000` in your browser.

### Running Scripts Manually

```bash
cd scripts

# Convert CSV to JSON (from data/eed-awards.csv)
npm run convert

# Convert Excel to JSON (legacy, if you have .xlsx files)
npm run convert-excel

# Validate awards data
npm run validate

# Test PR creation (requires env variables)
npm run create-pr
```

### Adding New Features

1. Create feature branch
2. Make changes to `docs/` files
3. Test locally
4. Commit and push
5. Create pull request
6. Merge to main → Auto-deploys

## Security

- ✅ All sensitive data stored in GitHub Secrets (encrypted)
- ✅ Service account has minimal required permissions
- ✅ Form submissions reviewed before going live
- ✅ Input sanitization to prevent XSS attacks
- ✅ HTTPS enforced on GitHub Pages

**Important:**
- Never commit service account JSON file to repository
- Never share your `GITHUB_TOKEN` or secrets
- Regularly review service account permissions

## Cost

**Total Cost: $0** (Using free tiers)

- GitHub Pages: Free for public repositories
- GitHub Actions: 2000 minutes/month free
- Google Cloud: Free tier includes Sheets API
- Google Forms: Free

## Future Enhancements

Potential features to add:

- Email notifications for upcoming deadlines
- Export filtered results as CSV
- Analytics tracking (Google Analytics)
- Multi-language support
- User accounts to track applications
- Bulk import via CSV upload
- Advanced search with filters
- Award categories and tags

## Support

### Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/<your-username>/claude-test/issues)

### Documentation

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [GitHub Actions](https://docs.github.com/en/actions)

## License

MIT License - Feel free to use and modify for your needs.

## Credits

Built with:
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [ics.js](https://github.com/nwcell/ics.js) - Calendar generation
- GitHub Pages - Hosting
- Google Forms & Sheets - Data collection

---

Made with ❤️ by EEd Recognition Committee
