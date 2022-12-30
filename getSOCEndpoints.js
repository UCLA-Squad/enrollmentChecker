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