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

// For experimenting with the SOC endpoints to figure out if there's a way to generate the links without scraping the SOC website
function SOCexperimenting() {
  // https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model=%7B%22Term%22%3A%2223W%22%2C%22SubjectAreaCode%22%3A%22AERO+ST%22%2C%22CatalogNumber%22%3A%220000A+++%22%2C%22IsRoot%22%3Atrue%2C%22SessionGroup%22%3A%22%25%22%2C%22ClassNumber%22%3A%22%25%22%2C%22SequenceNumber%22%3Anull%2C%22Path%22%3A%22AEROST0000A%22%2C%22MultiListedClassFlag%22%3A%22n%22%2C%22Token%22%3A%22MDAwMEEgICBBRVJPU1QwMDAwQQ%3D%3D%22%7D
  const params = new URLSearchParams('?model=%7B%22Term%22%3A%2223W%22%2C%22SubjectAreaCode%22%3A%22AERO+ST%22%2C%22CatalogNumber%22%3A%220000A+++%22%2C%22IsRoot%22%3Atrue%2C%22SessionGroup%22%3A%22%25%22%2C%22ClassNumber%22%3A%22%25%22%2C%22SequenceNumber%22%3Anull%2C%22Path%22%3A%22AEROST0000A%22%2C%22MultiListedClassFlag%22%3A%22n%22%2C%22Token%22%3A%22MDAwMEEgICBBRVJPU1QwMDAwQQ%3D%3D%22%7D&FilterFlags=%7B%22enrollment_status%22%3A%22O%2CW%2CC%2CX%2CT%2CS%22%2C%22advanced%22%3A%22y%22%2C%22meet_days%22%3A%22T%2CF%22%2C%22start_time%22%3A%227%3A00+am%22%2C%22end_time%22%3A%221%3A00+pm%22%2C%22meet_locations%22%3Anull%2C%22meet_units%22%3Anull%2C%22instructor%22%3Anull%2C%22class_career%22%3Anull%2C%22impacted%22%3A%22N%22%2C%22enrollment_restrictions%22%3Anull%2C%22enforced_requisites%22%3Anull%2C%22individual_studies%22%3A%22n%22%2C%22summer_session%22%3Anull%7D')
  const options = Object.fromEntries(params.entries())

  console.log(options);

  for (const [key, value] of Object.entries(options)) {
    console.log(JSON.parse(value));
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false, args: [
      '--user-data-dir=/Users/jasontay/Library/Application Support/Google/Chrome/Default']
  });
  const SOCURL = "https://sa.ucla.edu/ro/public/soc"
  const subjectAreas = await getSubjectAreas(browser, SOCURL, "23W");

  // TODO: put this into a function
  await fs.readFileSync("subjectAreas.txt", "utf8").split("\n")
    .forEach(async (subjectArea) => {
      console.log(subjectArea);
      let subjectAreaLongName;
      let subjectAreaShortName;

      if (!subjectArea.includes("(")) {
        subjectAreaLongName = subjectArea
          .trim()
          .replace(/ /g, "+");
        subjectAreaShortName = subjectArea
          .trim()
          .replace(/ /g, "+");
      } else {
        subjectAreaLongName = subjectArea
          .split("(")[0]
          .trim()
          .replace(/ /g, "+");
        subjectAreaShortName = subjectArea
          .split("(")[1]
          .split(")")[0]
          .trim()
          .replace(/ /g, "+");
      }

      const SOCURL = `https://sa.ucla.edu/ro/public/soc/Results?SubjectAreaName=${subjectAreaLongName}+(${subjectAreaShortName})&t=23W&sBy=subject&subj=${subjectAreaShortName.padEnd(7, "+")}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`;
      // const capturedSOCURLs = await captureWithPagination(browser, SOCURL);
    });

  // const SOCURL = "https://sa.ucla.edu/ro/public/soc/Results?SubjectAreaName=Computer+Science+(COM+SCI)&t=23W&sBy=subject&subj=COM+SCI&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex";

  // const capturedSOCURLs = await captureWithPagination(browser, SOCURL);
  // console.log(capturedSOCURLs.length);

  await browser.close();
}

main();
