import { buildBlock, loadBlock, createOptimizedPicture, getFormattedDate , decorateBlock } from '../../scripts/aem.js';

// Constants
const ITEMS_PER_PAGE = 6;
const DEFAULT_IMAGE = "/news/2021/12/media_16a0d87cb049109d66f17dff074755a0f74c5be5b.jpeg";
const DESCRIPTION_MAX_LENGTH = 138;

/**
 * Extracts filter value from current URL
 */
function getFilterFromURL() {
  const url = new URL(window.location.href);

  const filterParam = url.searchParams.get('filterParam');
  if (filterParam) {
    const filterMap = {
      'the past 7 days': '7days',
      'the past 30 days': '30days',
      'the past 90 days': '90days',
      'all time': 'all'
    };
    return filterMap[decodeURIComponent(filterParam)] || 'all';
  }

  const pathMatch = url.pathname.match(/\/news\/(\d{4})\.html$/);
  if (pathMatch) return pathMatch[1];

  return 'all';
}

/**
 * Updates the URL based on selected filter
 */
function updateURL(filterValue) {
  const baseUrl = '/news';
  const filterTextMap = {
    '7days': 'the past 7 days',
    '30days': 'the past 30 days',
    '90days': 'the past 90 days',
    'all': 'all time'
  };

  if (Object.keys(filterTextMap).includes(filterValue)) {
    const filterText = filterTextMap[filterValue];
    const newUrl = `${baseUrl}.html?filterParam=${encodeURIComponent(filterText)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  } else {
    const newUrl = `${baseUrl}/${filterValue}.html`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
}

function getTrimmedDescription(description) {
  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    return description.substring(0, DESCRIPTION_MAX_LENGTH - 3) + '...';
  }
  return description || "";
}

// ... keep other utility functions (createFilterSection, createLoadingIndicator, etc.) ...

/**
 * Filters news items based on selected filter
 */
function filterNewsItems(items, filterValue) {
  if (!items.length) return [];

  switch (filterValue) {
    case '7days':
    case '30days':
    case '90days': {
      const days = parseInt(filterValue);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return items.filter(item => new Date(item.date) >= cutoffDate);
    }
    case 'all':
      return items;
    default:
      return items.filter(item => item.path.includes(`/news/${filterValue}`));
  }
}

/**
 * Fetches and formats news items from API
 */
async function fetchNewsItems(filterValue = 'all') {
  try {
    const response = await fetch('/query-index.json');
    const { data } = await response.json();
    const newsItems = data.filter(item => item.path.startsWith('/news'));

    return filterNewsItems(newsItems, filterValue);
  } catch (error) {
    console.error('Error fetching news items:', error);
    return [];
  }
}

/**
 * Creates the filter section with dropdown and button
 * @param {Function} onFilterChange - Callback for filter changes
 * @returns {HTMLElement} Filter container element
 */
function createFilterSection(onFilterChange) {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'news-filter-container';

  const filterElements = {
    label: createFilterLabel(),
    select: createFilterDropdown(),
    button: createFilterButton(onFilterChange)  // Pass the callback here
  };

  filterContainer.append(filterElements.label, filterElements.select, filterElements.button);
  return filterContainer;
}

/**
 * Creates the filter action button
 * @param {Function} onFilterChange - Callback when filter is applied
 * @returns {HTMLElement} Button element
 */
function createFilterButton(onFilterChange) {
  const button = document.createElement('button');
  button.className = 'news-filter-button';
  button.textContent = 'Go';
  button.type = 'button'; // Explicitly set button type
  
  // Add click event listener directly here
  button.addEventListener('click', () => {
    const select = button.parentElement.querySelector('#filterOption');
    if (select) {
      onFilterChange(select.value);
    }
  });
  
  return button;
}

/**
 * Creates no results message container
 * @returns {HTMLElement} No results container
 */
function createNoResultsMessage() {
  const noResultsContainer = document.createElement('div');
  noResultsContainer.className = 'news-no-results-container';

  const noResultsMessage = document.createElement('div');
  noResultsMessage.className = 'news-no-results-message';
  noResultsMessage.textContent = "We didn't find anything that matches your filters. Try expanding your search or browsing the whole collection.";

  noResultsContainer.appendChild(noResultsMessage);
  return noResultsContainer;
}

/**
 * Creates horizontal divider
 * @returns {HTMLElement} Divider element
 */
function createDivider() {
  const container = document.createElement('div');
  container.className = 'news-content-divider-container';

  const line = document.createElement('div');
  line.className = 'news-content-divider-line';

  container.appendChild(line);
  return container;
}

/**
 * Creates loading indicator with animation
 * @returns {HTMLElement} Loading indicator element
 */
function createLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'news-view-more';
  indicator.innerHTML = `
    <div class="sws-loader-svg-1">
      <svg width="40" height="40" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="#000">
        <g fill="none" fill-rule="evenodd" stroke-width="2">
          <circle cx="22" cy="22" r="1">
            <animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/>
          </circle>
          <circle cx="22" cy="22" r="1">
            <animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>`;
  indicator.style.display = 'none';
  return indicator;
}

/**
 * Creates the data structure for news cards
 * @param {Array} items - Array of news items
 * @returns {Array} Formatted data for buildBlock
 */
function buildData(items) {
  return [[
    {
      elems: [`<div><div>${JSON.stringify(items.map(item => {
        // Format the date if lastModified exists
        const date = item.lastModified 
          ? new Date(parseInt(item.lastModified) * 1000).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : '';

        // Format the publication date if it exists
        const pubDate = item['publication-date'] && item['publication-date'] !== '0'
          ? new Date(parseInt(item['publication-date']) * 1000).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : date; // fallback to lastModified date

        return {
          path: item.path || '#',
          //TODO: Change this
         image: item.image === '0' || item.image.startsWith('/default-meta-image.png') ? DEFAULT_IMAGE : item.image,
          title: item.title || '',
          breadcrumbTitle: item['breadcrumb-title'] || '',
          date: pubDate,
          description: getTrimmedDescription(item.description || ''),
          category: item.template || 'News category',
          fromDepartment: item['from-the-department'] !== '0',
          robots: item.robots !== '0'
        };
      }))}</div></div>`]
    }
  ]];
}

/**
 * Creates the filter dropdown with time period options
 * @returns {HTMLElement} Select element
 */
function createFilterDropdown() {
  const select = document.createElement('select');
  select.id = 'filterOption';
  select.className = 'sws-advance-search__select';
  select.setAttribute('aria-label', 'Show me news for');

  const timeOptions = [
    { value: 'all', text: 'all time' },
    { value: '7days', text: 'the past 7 days' },
    { value: '30days', text: 'the past 30 days' },
    { value: '90days', text: 'the past 90 days' }
  ];

  const yearOptions = Array.from({ length: 14 }, (_, i) => ({
    value: String(2024 - i),
    text: String(2024 - i)
  }));

  const currentFilter = getFilterFromURL();

  [...timeOptions, ...yearOptions].forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    option.selected = opt.value === currentFilter;
    select.appendChild(option);
  });

  return select;
}

/**
 * Creates the filter label element
 * @returns {HTMLElement} Label element
 */
function createFilterLabel() {
  const label = document.createElement('span');
  label.className = 'sws-advance-search__text';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = 'Show me all news from';
  return label;
}

/**
 * Creates the news count display
 * @param {number} count - Number of news items
 * @param {string} filterValue - Current filter value
 * @returns {HTMLElement} Count display element
 */
function createNewsCount(count, filterValue) {
  const countContainer = document.createElement('div');
  countContainer.className = 'news-count-container';
  
  let dateRange = '';
  
  // Determine date range based on filter
  switch(filterValue) {
    case '7days':
      dateRange = getDateRange(7);
      break;
    case '30days':
      dateRange = getDateRange(30);
      break;
    case '90days':
      dateRange = getDateRange(90);
      break;
    case 'all':
      dateRange = ''; // Remove 'all time' text for 'all' filter
      break;
    default:
      // For year filters
      if (!isNaN(filterValue)) {
        dateRange = `01/01/${filterValue} - 31/12/${filterValue}`;
      }
  }

  countContainer.innerHTML = `
  <span class="news-count-text">
    <strong>${count}</strong> news item${count !== 1 ? 's' : ''}${dateRange ? ` from <strong>${dateRange}</strong>` : ''}
  </span>
`;
  
  return countContainer;
}

/**
 * Gets formatted date range string
 * @param {number} days - Number of days to look back
 * @returns {string} Formatted date range
 */
function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Formats date to DD/MM/YYYY
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export default async function decorate(block) {
  try {
    // Create filter and content sections
    const contentSection = document.createElement('div');
    contentSection.className = 'news-cards';

    const newsContentContainer = document.createElement('div');
    // TODO: Change this
    newsContentContainer.className = 'news-cards';

    // Initialize state
    let currentPage = 1;
    let allItems = [];
    const loadingIndicator = createLoadingIndicator();
    let currentFilter = getFilterFromURL(); 

    /**
     * Updates displayed news items
     */
    const showItems = async (page) => {
      const existingButton = newsContentContainer.querySelector('.news-more-button');
      if (existingButton) existingButton.style.display = 'none';
      loadingIndicator.style.display = 'block';

      await new Promise(resolve => setTimeout(resolve, 800));
      newsContentContainer.textContent = '';

      if (allItems.length === 0) {
        newsContentContainer.appendChild(createNoResultsMessage());
        loadingIndicator.style.display = 'none';
        return;
      }

      const countDisplay = createNewsCount(allItems.length, currentFilter);
      newsContentContainer.appendChild(countDisplay);

      const visibleItems = allItems.slice(0, page * ITEMS_PER_PAGE);
      const newsCardsData = buildData(visibleItems);
      // Now newsCardsData is an array of arrays of arrays: [[[HTML string]]]
      const newsBlock = buildBlock('news-cards', newsCardsData);
      newsContentContainer.append(newsBlock, loadingIndicator);
      decorateBlock(newsBlock);
      await loadBlock(newsBlock);


      if (allItems.length > page * ITEMS_PER_PAGE) {
        const moreButton = document.createElement('button');
        moreButton.className = 'news-more-button';
        moreButton.textContent = 'More News';
        moreButton.addEventListener('click', () => {
          currentPage++;
          showItems(currentPage);
        });

        loadingIndicator.style.display = 'none';
        newsContentContainer.append(moreButton);
      } else {
        loadingIndicator.style.display = 'none';
      }
    };

    /**
     * Handles filter changes
     */
    const handleFilterChange = async (filterValue) => {
      currentPage = 1;
      currentFilter = filterValue; // Update current filter
      loadingIndicator.style.display = 'block';
      updateURL(filterValue);
      allItems = await fetchNewsItems(filterValue);
      showItems(currentPage);
    };

    // Create filter section with the callback
    const filterSection = createFilterSection(handleFilterChange);
    // Setup structure
    contentSection.append(newsContentContainer);
    block.append(filterSection, createDivider(), contentSection);
    newsContentContainer.append(loadingIndicator);

    // Initial load
    const initialFilter = getFilterFromURL();
    allItems = await fetchNewsItems(initialFilter);
    if (allItems.length) {
      showItems(currentPage);
    }

  } catch (error) {
    console.error('Error in news section decoration:', error);
  }
}