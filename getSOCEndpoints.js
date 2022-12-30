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