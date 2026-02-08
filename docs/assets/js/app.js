// State management
let allAwards = [];
let filteredAwards = [];
let filters = {
  search: '',
  level: '',
  awardFor: '',
  type: '',
  deadline: ''
};

// Initialize app
async function init() {
  try {
    console.log('Loading awards data...');

    // Load awards data
    const response = await fetch('data/awards.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    allAwards = data.awards || [];

    console.log(`Loaded ${allAwards.length} awards`);

    // Update last updated timestamp
    const lastUpdated = new Date(data.lastUpdated);
    document.getElementById('last-updated').textContent = lastUpdated.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Hide loading, show container
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('awards-container').classList.remove('hidden');

    // Populate filter dropdowns
    populateFilters();

    // Initial render
    filteredAwards = [...allAwards];
    renderAwards();

    // Attach event listeners
    attachFilterListeners();

  } catch (error) {
    console.error('Failed to load awards:', error);
    document.getElementById('loading').classList.add('hidden');
    showError('Failed to load awards. Please refresh the page or check your connection.');
  }
}

// Populate filter dropdowns with unique values
function populateFilters() {
  // Get unique values
  const levels = [...new Set(allAwards.flatMap(a =>
    a.level.split(',').map(l => l.trim()).filter(l => l)
  ))].sort();

  const awardFors = [...new Set(allAwards.map(a => a.awardFor).filter(a => a))].sort();
  const types = [...new Set(allAwards.map(a => a.type).filter(t => t))].sort();

  // Populate level dropdown
  const levelSelect = document.getElementById('level-filter');
  levels.forEach(level => {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = level;
    levelSelect.appendChild(option);
  });

  // Populate award for dropdown
  const awardForSelect = document.getElementById('awardfor-filter');
  awardFors.forEach(awardFor => {
    const option = document.createElement('option');
    option.value = awardFor;
    option.textContent = awardFor;
    awardForSelect.appendChild(option);
  });

  // Populate type dropdown
  const typeSelect = document.getElementById('type-filter');
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });
}

// Apply filters based on current filter values
function applyFilters() {
  filters.search = document.getElementById('search-input').value.toLowerCase();
  filters.level = document.getElementById('level-filter').value;
  filters.awardFor = document.getElementById('awardfor-filter').value;
  filters.type = document.getElementById('type-filter').value;
  filters.deadline = document.getElementById('deadline-filter').value;

  filteredAwards = allAwards.filter(award => {
    // Search filter (across multiple fields)
    if (filters.search) {
      const searchable = [
        award.title,
        award.requirements,
        award.previousAwardees,
        award.awardFor,
        award.level
      ].join(' ').toLowerCase();

      if (!searchable.includes(filters.search)) return false;
    }

    // Level filter (check if any of the award's levels match)
    if (filters.level) {
      const awardLevels = award.level.split(',').map(l => l.trim());
      if (!awardLevels.includes(filters.level)) return false;
    }

    // Award For filter
    if (filters.awardFor && award.awardFor !== filters.awardFor) return false;

    // Type filter
    if (filters.type && award.type !== filters.type) return false;

    // Deadline filter
    if (filters.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(award.deadlineDate);
      const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      const maxDays = parseInt(filters.deadline);
      if (daysUntil < 0 || daysUntil > maxDays) return false;
    }

    return true;
  });

  renderAwards();
}

// Render awards as cards
function renderAwards() {
  const container = document.getElementById('awards-container');
  const resultsCount = document.getElementById('results-count');
  const noResults = document.getElementById('no-results');

  resultsCount.textContent = `Showing ${filteredAwards.length} of ${allAwards.length} awards`;

  if (filteredAwards.length === 0) {
    container.classList.add('hidden');
    noResults.classList.remove('hidden');
    return;
  }

  container.classList.remove('hidden');
  noResults.classList.add('hidden');

  container.innerHTML = filteredAwards
    .sort((a, b) => new Date(a.deadlineDate) - new Date(b.deadlineDate))
    .map(award => createAwardCard(award))
    .join('');

  // Attach calendar download listeners
  attachCalendarListeners();
}

// Create HTML for single award card
function createAwardCard(award) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(award.deadlineDate);
  const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  let urgencyClass, urgencyText;
  if (daysUntil < 0) {
    urgencyClass = 'bg-gray-100 text-gray-600';
    urgencyText = 'Passed';
  } else if (daysUntil <= 30) {
    urgencyClass = 'bg-red-100 text-red-800';
    urgencyText = `${daysUntil}d left`;
  } else if (daysUntil <= 60) {
    urgencyClass = 'bg-yellow-100 text-yellow-800';
    urgencyText = `${daysUntil}d left`;
  } else {
    urgencyClass = 'bg-green-100 text-green-800';
    urgencyText = `${daysUntil}d left`;
  }

  const deadlineFormatted = `${award.deadlineMonth} ${award.deadlineDay}`;

  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-bold text-gray-900 flex-1 pr-2">${escapeHtml(award.title)}</h3>
        <span class="px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${urgencyClass}">
          ${urgencyText}
        </span>
      </div>

      <div class="space-y-2 mb-4 text-sm flex-1">
        <div class="flex items-start">
          <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <div>
            <span class="font-medium text-gray-700">Level:</span>
            <span class="text-gray-600">${escapeHtml(award.level)}</span>
          </div>
        </div>

        ${award.awardFor ? `
        <div class="flex items-start">
          <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <div>
            <span class="font-medium text-gray-700">For:</span>
            <span class="text-gray-600">${escapeHtml(award.awardFor)}</span>
          </div>
        </div>
        ` : ''}

        ${award.type ? `
        <div class="flex items-start">
          <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          <div>
            <span class="font-medium text-gray-700">Type:</span>
            <span class="text-gray-600">${escapeHtml(award.type)}</span>
          </div>
        </div>
        ` : ''}

        <div class="flex items-start">
          <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <div>
            <span class="font-medium text-gray-700">Deadline:</span>
            <span class="text-gray-600">${escapeHtml(deadlineFormatted)}</span>
          </div>
        </div>

        ${award.applicationMode ? `
        <div class="flex items-start">
          <svg class="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <div>
            <span class="font-medium text-gray-700">Mode:</span>
            <span class="text-gray-600">${escapeHtml(award.applicationMode)}</span>
          </div>
        </div>
        ` : ''}
      </div>

      ${award.requirements ? `
        <div class="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <p class="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
          <p class="text-xs text-gray-600 line-clamp-3">${escapeHtml(award.requirements)}</p>
        </div>
      ` : ''}

      ${award.previousAwardees ? `
        <div class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p class="text-xs font-semibold text-blue-700 mb-1">Previous Awardees:</p>
          <p class="text-xs text-blue-600 line-clamp-2">${escapeHtml(award.previousAwardees)}</p>
        </div>
      ` : ''}

      <div class="flex gap-2 mt-auto pt-4 border-t">
        <a
          href="${escapeHtml(award.link)}"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
        >
          View Details
        </a>
        <button
          data-award-id="${escapeHtml(award.id)}"
          class="calendar-btn px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          title="Add deadline to calendar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// Attach event listeners to filter controls
function attachFilterListeners() {
  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('level-filter').addEventListener('change', applyFilters);
  document.getElementById('awardfor-filter').addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  document.getElementById('deadline-filter').addEventListener('change', applyFilters);

  document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('level-filter').value = '';
    document.getElementById('awardfor-filter').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('deadline-filter').value = '';
    applyFilters();
  });
}

// Attach calendar download listeners
function attachCalendarListeners() {
  document.querySelectorAll('.calendar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const button = e.currentTarget;
      const awardId = button.dataset.awardId;
      const award = allAwards.find(a => a.id === awardId);
      if (award) {
        generateCalendar(award);

        // Visual feedback
        const originalHtml = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        button.classList.add('bg-green-100', 'text-green-700');

        setTimeout(() => {
          button.innerHTML = originalHtml;
          button.classList.remove('bg-green-100', 'text-green-700');
        }, 2000);
      }
    });
  });
}

// Generate and download .ics file
function generateCalendar(award) {
  try {
    const cal = ics();

    const deadline = new Date(award.deadlineDate);
    const startDate = deadline.toISOString().split('T')[0].replace(/-/g, '');

    // Create description with details
    let description = '';
    if (award.requirements) {
      description += `Requirements: ${award.requirements}\n\n`;
    }
    if (award.level) {
      description += `Level: ${award.level}\n`;
    }
    if (award.awardFor) {
      description += `For: ${award.awardFor}\n`;
    }
    description += `\nApply here: ${award.link}`;

    cal.addEvent(
      `Award Deadline: ${award.title}`,
      description,
      '',
      startDate,
      startDate
    );

    const filename = award.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cal.download(`award-${filename}`);

  } catch (error) {
    console.error('Calendar generation failed:', error);
    alert('Failed to generate calendar file. Please try again.');
  }
}

// Show error message
function showError(message) {
  const container = document.getElementById('awards-container');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="col-span-full">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Awards</h3>
        <p class="text-red-700">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
