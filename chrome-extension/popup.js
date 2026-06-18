document.addEventListener('DOMContentLoaded', async () => {
  const domainBadge = document.getElementById('domainBadge');
  const alertSuccess = document.getElementById('alertSuccess');
  const alertError = document.getElementById('alertError');
  const errorMessage = document.getElementById('errorMessage');
  const importForm = document.getElementById('importForm');
  const btnRescrape = document.getElementById('btnRescrape');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');

  let activeTabId = null;

  // Function to show error
  function showError(msg) {
    errorMessage.textContent = msg;
    alertError.style.display = 'flex';
    alertSuccess.style.display = 'none';
  }

  // Function to show success
  function showSuccess() {
    alertSuccess.style.display = 'flex';
    alertError.style.display = 'none';
  }

  // Function to clear alerts
  function clearAlerts() {
    alertSuccess.style.display = 'none';
    alertError.style.display = 'none';
  }

  // Function to scrape from active tab
  async function triggerScrape() {
    clearAlerts();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showError('No active tab found.');
        return;
      }

      activeTabId = tab.id;
      const url = tab.url || '';

      if (url.includes('linkedin.com')) {
        domainBadge.textContent = 'LinkedIn Job';
      } else if (url.includes('indeed.com')) {
        domainBadge.textContent = 'Indeed Job';
      } else {
        domainBadge.textContent = 'Generic Webpage';
      }

      // Send scrape request to content script
      chrome.tabs.sendMessage(activeTabId, { action: 'scrape' }, (response) => {
        // Handle runtime.lastError if content script isn't running on the page
        if (chrome.runtime.lastError) {
          console.warn('Scraping channel failed (content script not ready):', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success && response.data) {
          const data = response.data;
          if (data.jobTitle) document.getElementById('jobTitle').value = data.jobTitle;
          if (data.companyName) document.getElementById('companyName').value = data.companyName;
          if (data.location) document.getElementById('location').value = data.location;
          if (data.hrName) document.getElementById('hrName').value = data.hrName;
          if (data.description) document.getElementById('description').value = data.description;
          if (data.email) document.getElementById('email').value = data.email;
        }
      });
    } catch (err) {
      console.error('Scrape trigger error:', err);
      showError('Failed to initialize scraping: ' + err.message);
    }
  }

  // 1. Initial trigger
  await triggerScrape();

  // 2. Re-scrape button
  btnRescrape.addEventListener('click', async () => {
    await triggerScrape();
  });

  // 3. Submit form
  importForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();

    // Show loading
    btnSpinner.style.display = 'inline-block';
    btnSubmit.disabled = true;
    btnText.textContent = 'Importing...';

    const payload = {
      jobTitle: document.getElementById('jobTitle').value,
      companyName: document.getElementById('companyName').value,
      location: document.getElementById('location').value,
      hrName: document.getElementById('hrName').value,
      email: document.getElementById('email').value,
      description: document.getElementById('description').value,
    };

    try {
      const response = await fetch('http://localhost:3000/jobs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const resData = await response.json();

      if (response.ok) {
        showSuccess();
      } else {
        const errorMsg = resData.error || 'Server rejected the request.';
        showError(errorMsg);
      }
    } catch (err) {
      console.error('Network error:', err);
      showError('Network error connecting to dashboard. Is the server running?');
    } finally {
      btnSpinner.style.display = 'none';
      btnSubmit.disabled = false;
      btnText.textContent = 'Import Job';
    }
  });
});
