document.addEventListener('DOMContentLoaded', async () => {
  const domainBadge  = document.getElementById('domainBadge');
  const alertSuccess = document.getElementById('alertSuccess');
  const alertError   = document.getElementById('alertError');
  const errorMessage = document.getElementById('errorMessage');
  const importForm   = document.getElementById('importForm');
  const btnRescrape  = document.getElementById('btnRescrape');
  const btnSubmit    = document.getElementById('btnSubmit');
  const btnSpinner   = document.getElementById('btnSpinner');
  const btnText      = document.getElementById('btnText');

  let activeTab = null;

  function showError(msg) {
    errorMessage.textContent = msg;
    alertError.style.display = 'flex';
    alertSuccess.style.display = 'none';
  }
  function showSuccess() {
    alertSuccess.style.display = 'flex';
    alertError.style.display = 'none';
  }
  function clearAlerts() {
    alertSuccess.style.display = 'none';
    alertError.style.display = 'none';
  }

  function fillFields(data) {
    if (!data) return;
    if (data.jobTitle)    document.getElementById('jobTitle').value    = data.jobTitle;
    if (data.companyName) document.getElementById('companyName').value = data.companyName;
    if (data.location)    document.getElementById('location').value    = data.location;
    if (data.hrName)      document.getElementById('hrName').value      = data.hrName;
    if (data.description) document.getElementById('description').value = data.description;
    if (data.email)       document.getElementById('email').value       = data.email;
  }

  // ─── Scraper function injected directly into the page via scripting API ────
  function injectedScraper() {
    function queryAny(...selectors) {
      for (const sel of selectors) {
        try { const el = document.querySelector(sel); if (el) return el; } catch (_) {}
      }
      return null;
    }
    function textOf(el) { return el ? el.innerText.trim() : ''; }

    const url = window.location.href;
    let jobTitle = '', companyName = '', location = '', description = '', hrName = '', email = '';

    if (url.includes('linkedin.com')) {
      jobTitle = textOf(queryAny(
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title h1',
        '.jobs-unified-top-card__job-title',
        'h1.jobs-unified-top-card__job-title',
        'h1.t-24.t-bold',
        'h1.topcard__title',
        '.top-card-layout__title',
        '[data-test-job-title]',
        'h1'
      ));
      companyName = textOf(queryAny(
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        '.top-card-layout__company-name',
        '[data-test-company-name]'
      ));
      const locationEl = queryAny(
        '.job-details-jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__workplace-type',
        '.jobs-unified-top-card__bullet',
        '.topcard__flavor--bullet',
        '.top-card-layout__first-subheading'
      );
      location = textOf(locationEl).replace(/\n/g,' ').replace(/\s+/g,' ');
      description = textOf(queryAny(
        '#job-details',
        '.jobs-description__content .jobs-box__html-content',
        '.jobs-description__content',
        '.jobs-box__html-content',
        '.show-more-less-html__markup',
        '.jobs-description-content__text',
        '.description__text'
      ));
      hrName = textOf(queryAny(
        '.hirer-card__hirer-information .app-aware-link',
        '.hirer-card__hirer-information strong',
        '.jobs-poster__name',
        '.hirer-card__name',
        '.jobs-unified-top-card__posted-by a',
        '.jobs-unified-top-card__posted-by'
      ));
      const emailMatch = document.body.innerText.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
      if (emailMatch) email = emailMatch[0];

    } else if (url.includes('indeed.com')) {
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
        '.jobsearch-InlineCompanyRating div a'
      ));
      location = textOf(queryAny(
        '[data-testid="job-location"]',
        '#jobLocationSection'
      ));
      description = textOf(queryAny(
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-testid="jobDescriptionText"]'
      ));
      hrName = textOf(queryAny(
        '.jobsearch-HiringInsights-entry--name'
      ));
    } else {
      jobTitle = textOf(document.querySelector('h1'));
    }

    return { jobTitle, companyName, location, description, hrName, email };
  }

  // ─── Main scrape function ──────────────────────────────────────────────────
  async function triggerScrape() {
    clearAlerts();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) { showError('No active tab found.'); return; }
      activeTab = tab;

      const url = tab.url || '';
      if (url.includes('linkedin.com'))       domainBadge.textContent = 'LinkedIn Job';
      else if (url.includes('indeed.com'))    domainBadge.textContent = 'Indeed Job';
      else                                    domainBadge.textContent = 'Generic Page';

      // Strategy 1: try content script message
      let filled = false;
      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'scrape' }, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not ready on this page — will try programmatic injection
            console.warn('Content script not ready:', chrome.runtime.lastError.message);
            resolve();
            return;
          }
          if (response && response.success && response.data) {
            fillFields(response.data);
            filled = true;
          }
          resolve();
        });
      });

      // Strategy 2: programmatic injection via scripting API (handles SPA navigation)
      if (!filled) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: injectedScraper,
          });
          if (results && results[0] && results[0].result) {
            fillFields(results[0].result);
          }
        } catch (injectErr) {
          console.warn('Programmatic injection failed:', injectErr.message);
          showError('Could not read job data from this page. Make sure you are on a job detail page.');
        }
      }

    } catch (err) {
      console.error('Scrape trigger error:', err);
      showError('Failed to initialize scraping: ' + err.message);
    }
  }

  // 1. Auto-scrape on popup open
  await triggerScrape();

  // 2. Re-scrape button
  btnRescrape.addEventListener('click', async () => {
    await triggerScrape();
  });

  // 3. Submit form
  importForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();

    btnSpinner.style.display = 'inline-block';
    btnSubmit.disabled = true;
    btnText.textContent = 'Importing...';

    const payload = {
      jobTitle:    document.getElementById('jobTitle').value.trim(),
      companyName: document.getElementById('companyName').value.trim(),
      location:    document.getElementById('location').value.trim(),
      hrName:      document.getElementById('hrName').value.trim(),
      email:       document.getElementById('email').value.trim(),
      description: document.getElementById('description').value.trim(),
    };

    try {
      const response = await fetch('http://localhost:3000/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const resData = await response.json();

      if (response.ok) {
        showSuccess();
        // Clear fields after success
        setTimeout(() => {
          document.getElementById('jobTitle').value = '';
          document.getElementById('companyName').value = '';
          document.getElementById('location').value = '';
          document.getElementById('hrName').value = '';
          document.getElementById('email').value = '';
          document.getElementById('description').value = '';
          clearAlerts();
        }, 3000);
      } else {
        showError(resData.error || 'Server rejected the request.');
      }
    } catch (err) {
      console.error('Network error:', err);
      showError('Network error connecting to dashboard. Is the backend server running on port 3000?');
    } finally {
      btnSpinner.style.display = 'none';
      btnSubmit.disabled = false;
      btnText.textContent = 'Import Job';
    }
  });
});
