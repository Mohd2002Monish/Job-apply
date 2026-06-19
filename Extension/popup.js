document.getElementById('extractBtn').addEventListener('click', async () => {
  const urlInput = document.getElementById('urlInput');
  const extractBtn = document.getElementById('extractBtn');
  const statusDiv = document.getElementById('status');
  const url = urlInput.value.trim();

  if (!url) {
    statusDiv.textContent = 'Please enter a valid URL.';
    statusDiv.className = 'error';
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    statusDiv.textContent = 'Invalid URL format.';
    statusDiv.className = 'error';
    return;
  }

  // Update UI
  extractBtn.disabled = true;
  extractBtn.textContent = 'Extracting Details...';
  statusDiv.textContent = 'Scraping and analyzing job posting...';
  statusDiv.className = '';

  try {
    // Send the URL to the backend
    const response = await fetch('http://localhost:3000/jobs/extract-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract job details.');
    }

    statusDiv.textContent = 'Job successfully extracted and saved to your dashboard!';
    statusDiv.className = 'success';
    urlInput.value = '';
  } catch (error) {
    statusDiv.textContent = error.message;
    statusDiv.className = 'error';
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = 'Extract & Save Job';
  }
});

// Auto-fill the input with the current tab's URL
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
    document.getElementById('urlInput').value = tabs[0].url;
  }
});
