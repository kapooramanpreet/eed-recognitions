# EEd Recognitions Navigator

A fully automated GitHub Pages website for managing and displaying academic awards and recognitions for the Department of Engineering Education. Features include powerful filtering, calendar reminders, and automated submission workflow via Google Forms.

🌐 **Live Website:** https://kapooramanpreet.github.io/eed-recognitions

## Features

- ✨ **Modern, Responsive Interface** - Beautiful UI that works on all devices
- 🔍 **Powerful Filtering** - Filter by level, category, type, deadline range, and keyword search
- 📅 **Calendar Integration** - Download .ics files to add award deadlines to any calendar app
- ⭐ **KPI Awards** - Prestigious national/international faculty awards (external to UF) that count toward department rankings carry a "KPI Award" badge. Each award has a `kpi` flag in `awards.json`; new submissions get it suggested automatically, and the committee confirms it during PR review
- ✨ **AI Packet Drafter** - Upload a CV/supporting docs and draft an editable Word (.docx) application packet from the award's data and award page. Runs entirely in the browser with your own API key from UF NaviGator, OpenAI (ChatGPT), or Anthropic (Claude); nothing is stored
- 🤖 **Automated Workflow** - Google Form submissions automatically create pull requests
- ✅ **Easy Approval Process** - Review and approve submissions via GitHub pull requests
- 🚀 **Auto-Deployment** - Changes go live within 2 minutes of approval
- 📊 **Data-Driven** - All awards stored in structured JSON format

Made with ❤️ by EEd Recognition Committee.
