chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    try {
      const data = scrapeJobPage();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});

function scrapeJobPage() {
  const url = window.location.href;
  let jobTitle = "";
  let companyName = "";
  let location = "";
  let description = "";
  let hrName = "";
  let email = "";

  if (url.includes("linkedin.com")) {
    // LinkedIn Job Title
    const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title, .top-card-layout__title, h1.t-24, h1");
    if (titleEl) jobTitle = titleEl.innerText.trim();

    // LinkedIn Company Name
    const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .topcard__org-name-link, .top-card-layout__company-name, .jobs-unified-top-card__company-name");
    if (companyEl) companyName = companyEl.innerText.trim();

    // LinkedIn Location
    const locationEl = document.querySelector(".job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet, .top-card-layout__first-subheading");
    if (locationEl) location = locationEl.innerText.trim().replace(/\n/g, "").replace(/\s+/g, " ");

    // LinkedIn Description
    const descEl = document.querySelector(".jobs-description__content, .jobs-box__html-content, .show-more-less-html__markup, #job-details");
    if (descEl) description = descEl.innerText.trim();

    // LinkedIn Hirer / Recruiter Name
    const hirerEl = document.querySelector(".jobs-poster__name, .hirer-card__name, .jobs-unified-top-card__posted-by-name");
    if (hirerEl) hrName = hirerEl.innerText.trim();

  } else if (url.includes("indeed.com")) {
    // Indeed Job Title
    const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title, h1, h2");
    if (titleEl) jobTitle = titleEl.innerText.trim();

    // Indeed Company Name
    const companyEl = document.querySelector(".jobsearch-CompanyReview--heading, [data-company-name='true'], .jobsearch-InlineCompanyRating div a, .jobsearch-CompanyInfoContainer a");
    if (companyEl) companyName = companyEl.innerText.trim();

    // Indeed Location
    const locationEl = document.querySelector("#jobLocationSection, .jobsearch-JobInfoHeader-subtitle div:last-child, .jobsearch-JobInfoHeader-subtitle");
    if (locationEl) location = locationEl.innerText.trim();

    // Indeed Description
    const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");
    if (descEl) description = descEl.innerText.trim();
  } else {
    // Fallback search
    const titleEl = document.querySelector("h1");
    if (titleEl) jobTitle = titleEl.innerText.trim();
  }

  return {
    jobTitle,
    companyName,
    location,
    description,
    hrName,
    email
  };
}
