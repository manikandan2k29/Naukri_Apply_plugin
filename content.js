// Helper to wait a random amount of time to mimic human behavior
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min) + min)));

// Check if bot is enabled
chrome.storage.local.get(['isRunning'], async (result) => {
  if (!result.isRunning) {
    console.log("Naukri Auto Apply is stopped.");
    return;
  }

  console.log("Naukri Auto Apply is RUNNING.");

  // Detect which page we are on
  const url = window.location.href;
  
  // Job detail pages usually have the job title and ID, like /job-listings-job-title-company-name-...
  // Or simply if there's an apply button present after page load.
  // We'll use a DOM check combined with URL structure.
  
  if (url.includes('/job-listings/') || url.includes('job-listings-') || document.querySelector('#apply-button')) {
    // We are on a job description page OR there is an apply button
    await handleJobPage();
  } else {
    // We are likely on a search results page
    await handleSearchPage();
  }
});

async function handleSearchPage() {
  console.log("Detected Search Page. Looking for jobs...");
  
  // Wait a bit for the page to fully load
  await randomDelay(3000, 5000);

  // Look for job cards
  let jobPosts = document.querySelectorAll('.cust-job-tuple');
  if (jobPosts.length === 0) {
    jobPosts = document.querySelectorAll('.jobTuple');
  }
  if (jobPosts.length === 0) {
    jobPosts = document.querySelectorAll('.srp-jobtuple-wrapper');
  }

  if (jobPosts.length === 0) {
    console.log("No job posts found on this page.");
    return;
  }

  console.log(`Found ${jobPosts.length} job posts.`);

  for (let i = 0; i < jobPosts.length; i++) {
    // Check if we were stopped while running
    const state = await chrome.storage.local.get('isRunning');
    if (!state.isRunning) {
      console.log("Bot stopped by user.");
      break;
    }

    const jobPost = jobPosts[i];
    const titleObj = jobPost.querySelector('.title') || jobPost;
    const jobTitle = titleObj.getAttribute('title') || titleObj.textContent?.trim();

    console.log(`Preparing to open job #${i + 1}: ${jobTitle}`);

    // Smoothly scroll the job post into view (human-like)
    jobPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a random time while 'reading' the job title
    await randomDelay(2000, 4000);

    // Simulate a full human click (mousedown -> mouseup -> click) to ensure React registers it
    const clickTarget = titleObj || jobPost;
    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
      clickTarget.dispatchEvent(new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      }));
    });

    // Wait a significant amount of time before opening the next job
    // This allows the new tab to open, load, apply, and close without overwhelming the browser
    console.log("Waiting before clicking the next job...");
    await randomDelay(12000, 18000);
  }

  console.log("Finished all jobs on this page.");
  // FUTURE ENHANCEMENT: Auto-click next page pagination here
}

async function handleJobPage() {
  console.log("Detected Job Description Page. Starting application process...");

  // Wait to simulate human reading the job description
  await randomDelay(4000, 7000);

  // Check if we were stopped
  const state = await chrome.storage.local.get('isRunning');
  if (!state.isRunning) return;

  // Check for "Apply on Company Site" button which we want to avoid
  const companySiteBtn = Array.from(document.querySelectorAll('button, a')).find(el => 
    el.textContent && el.textContent.toLowerCase().includes('apply on company site')
  );

  if (companySiteBtn) {
    console.log("This job requires applying on the company site. Skipping.");
    await randomDelay(1000, 2000);
    chrome.runtime.sendMessage({ action: "closeTab" });
    return;
  }

  // Look for standard Apply button
  const applyButton = document.querySelector('#apply-button');
  
  if (applyButton) {
    console.log("Apply button found!");
    
    // Smooth scroll to the button
    applyButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a little before clicking
    await randomDelay(1500, 3000);
    
    console.log("Clicking apply button...");
    applyButton.click();

    // Notify background to increment the counter
    chrome.runtime.sendMessage({ action: "incrementApplyCount" });

    // Wait to ensure application goes through (Naukri usually shows a success modal or navigates)
    await randomDelay(4000, 6000);

    console.log("Application presumably successful. Closing tab...");
    chrome.runtime.sendMessage({ action: "closeTab" });

  } else {
    // Maybe we already applied to this job?
    const alreadyAppliedBtn = Array.from(document.querySelectorAll('button, div')).find(el => 
      el.textContent && (el.textContent.toLowerCase().includes('already applied') || el.textContent.toLowerCase() === 'applied')
    );

    if (alreadyAppliedBtn) {
      console.log("Already applied to this job. Closing tab...");
    } else {
      console.log("Apply button not found on this page.");
    }
    
    // Close tab anyway since we can't apply
    await randomDelay(2000, 3000);
    chrome.runtime.sendMessage({ action: "closeTab" });
  }
}
