/**
 * content.js — Job Apply Importer
 * Scrapes job details from LinkedIn and Indeed.
 * Handles LinkedIn's SPA sidebar layout and Indeed's standard pages.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      const data = scrapeJobPage();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // keep channel open for async
});

// ─── Helper: get first element matching any of the selectors ─────────────────
function queryAny(...selectors) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch (_) {}
  }
  return null;
}

function textOf(el) {
  return el ? el.innerText.trim() : '';
}

// ─── Main scraper ─────────────────────────────────────────────────────────────
function scrapeJobPage() {
  const url = window.location.href;
  let jobTitle = '';
  let companyName = '';
  let location = '';
  let description = '';
  let hrName = '';
  let email = '';

  if (url.includes('linkedin.com')) {
    scrapeLinkedIn();
  } else if (url.includes('indeed.com')) {
    scrapeIndeed();
  } else {
    // Generic fallback
    jobTitle = textOf(queryAny('h1'));
  }

  return { jobTitle, companyName, location, description, hrName, email };

  // ── LinkedIn ────────────────────────────────────────────────────────────────
  function scrapeLinkedIn() {
    // Job Title — multiple selector variants covering sidebar + full-page views
    jobTitle = textOf(queryAny(
      // Sidebar card (jobs/collections page)
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title',
      // Full-page job view
      'h1.jobs-unified-top-card__job-title',
      'h1.t-24.t-bold',
      'h1.topcard__title',
      '.top-card-layout__title',
      // Last resort
      '[data-test-job-title]',
      'h1'
    ));

    // Company Name
    companyName = textOf(queryAny(
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '.top-card-layout__company-name',
      '.jobs-details-top-card__company-url',
      '[data-test-company-name]'
    ));

    // Location
    const locationEl = queryAny(
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__workplace-type',
      '.jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
      '.top-card-layout__first-subheading'
    );
    location = textOf(locationEl).replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // Description — the main job details content
    description = textOf(queryAny(
      '#job-details',
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.show-more-less-html__markup',
      '.jobs-description-content__text',
      '.description__text'
    ));

    // HR / Recruiter Name (from "Meet the hiring team" section or poster info)
    hrName = textOf(queryAny(
      // "Meet the hiring team" card
      '.hirer-card__hirer-information .app-aware-link',
      '.hirer-card__hirer-information strong',
      '.jobs-poster__name',
      '.hirer-card__name',
      '.message-the-recruiter__poster-name',
      // Posted by section
      '.jobs-unified-top-card__posted-by a',
      '.jobs-unified-top-card__posted-by'
    ));

    // Recruiter email — rarely exposed on LinkedIn, but try
    email = '';
    const bodyText = document.body.innerText;
    const emailMatch = bodyText.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) email = emailMatch[0];
  }

  // ── Indeed ──────────────────────────────────────────────────────────────────
  function scrapeIndeed() {
    jobTitle = textOf(queryAny(
      'h1.jobsearch-JobInfoHeader-title',
      '.jobsearch-JobInfoHeader-title',
      'h1[data-testid="jobTitle"]',
      'h1'
    ));

    companyName = textOf(queryAny(
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-CompanyReview--heading',
      '.jobsearch-InlineCompanyRating div a',
      '.jobsearch-CompanyInfoContainer a'
    ));

    location = textOf(queryAny(
      '[data-testid="job-location"]',
      '#jobLocationSection',
      '.jobsearch-JobInfoHeader-subtitle div:last-child'
    ));

    description = textOf(queryAny(
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '[data-testid="jobDescriptionText"]'
    ));

    // Indeed sometimes shows recruiter name
    hrName = textOf(queryAny(
      '.jobsearch-HiringInsights-container .jobsearch-HiringInsights-entry--name'
    ));
  }
}
