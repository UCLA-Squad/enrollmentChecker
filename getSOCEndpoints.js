import puppeteer from "puppeteer";
import fs from "fs";

// Capture the endpoints for each subject area page
async function captureSOCHTTPRequests(page) {
  const endpoints = [];

  await page.setRequestInterception(true);

  await page.on("request", request => {
    const requestUrl = request.url();
    if (request.resourceType() === "xhr" && requestUrl.startsWith("https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?")) {
      endpoints.push(requestUrl);
    }
    // See: https://github.com/puppeteer/puppeteer/issues/3853
    return Promise.resolve().then(() => request.continue()).catch(e => { });
  });

  await page.waitForNetworkIdle();

  await page.evaluate(() => {
    const button = document
      .querySelector("#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app")
      .shadowRoot
      .querySelector("#expandAll");

    button.click();
  });

  await page.waitForNetworkIdle();

  return endpoints;
}

async function captureWithPagination(browser, SOCPage) {
  const page = await browser.newPage();
  const endpoints = [];
  await page.goto(SOCPage);
  await page.waitForNetworkIdle();

  let currPage = 0;
  let numberOfPages = -1;

  do {
    endpoints.push(...(await captureSOCHTTPRequests(page)));

    numberOfPages = await page.evaluate((currPage) => {
      try {
        const pageHandlers = document
          .querySelector("#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app")
          .shadowRoot
          .querySelectorAll("#divPagination > div:nth-child(2) > ul > li > button");
        pageHandlers[currPage].click();
        return Array.from(pageHandlers).length;
      } catch (err) {
        return -1;
      }
    }, currPage);
    currPage++;

    if (numberOfPages === -1) {
      break;
    }
    await page.waitForNetworkIdle();
  } while (currPage <= numberOfPages)

  await page.close();

  // Remove any possible duplicates
  return [...(new Set(endpoints))];
}

async function getSubjectAreas(browser, SOCPage, quarter) {
  const page = await browser.newPage();
  const SOCURLS = {};
  await page.goto(SOCPage);
  await page.waitForNetworkIdle();

  // Select the quarter to scrape
  await page.evaluate((quarter) => {
    document.querySelector("#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app")
      .shadowRoot
      .querySelector("#optSelectTerm")
      .value = quarter;
  }, quarter);

  await page.waitForNetworkIdle();

  // Search by subject area
  await page.evaluate(() => {
    document.querySelector("#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app")
      .shadowRoot
      .querySelector("#search_by")
      .value = "subject";
  });

  const subjectAreas = await page.evaluate(() => {
    const subjectAreaOptions = Array.from(document
      .querySelector("#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app")
      .shadowRoot
      .querySelector("#select_filter_subject")
      .shadowRoot
      .querySelectorAll("#dropdownitems > div"));

    return subjectAreaOptions.map((subjectArea) => subjectArea.textContent);
  });

  await page.waitForNetworkIdle();
  await page.close();
  return subjectAreas
}