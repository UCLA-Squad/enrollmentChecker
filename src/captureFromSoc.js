import { URLS } from './lib/constants.js'

// to-do: move to utils
async function expandAll() {
  const button = document
    .querySelector(
      '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
    )
    .shadowRoot.querySelector('#expandAll')
  if (button !== null) {
    button.click()
    return true
  }
  return false
}

// Capture the endpoints for each subject area page
export async function captureSOCHTTPRequests(page) {
  // const requests = await collectAllNetworkRequests(page)
  const requestURLs = []
  await page.setRequestInterception(true)
  await page.on('request', request => {
    const requestURL = request.url()

    if (
      request.resourceType() === 'xhr' &&
      requestURL.startsWith(`${URLS.SOC}/Results/GetCourseSummary?`)
    ) {
      requestURLs.push(requestURL)
    }
    // See: https://github.com/puppeteer/puppeteer/issues/3853
    return Promise.resolve()
      .then(() => request.continue())
      .catch(e => {})
  })
  await page.waitForNetworkIdle()

  // Click the "expand all" button
  await page.waitForSelector(
    '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
  )
  const expandAllExists = await page.evaluate(expandAll)
  if (!expandAllExists) return []

  await page.waitForNetworkIdle()
  return requestURLs
}

/**
 * Captures requests accounting for multiple pages (pagination)
 * @param {object} browser
 * @param {string} SOCPage
 * @returns {Promise<string[]>}
 */
export async function captureWithPagination(browser, SOCPage) {
  // Go to the SOC Page in a new tab
  const page = await browser.newPage()
  await page.goto(SOCPage)
  await page.waitForNetworkIdle()

  let [currPage, numberOfPages] = [0, -1]
  const socRequestURLs = []
  do {
    // Append requests from page to socRequestURLs
    const SOC_HTTP_requests = await captureSOCHTTPRequests(page)
    socRequestURLs.push(...SOC_HTTP_requests)

    // Calculate number of pages AND go to next page at the same time
    numberOfPages = await page.evaluate(currPage => {
      let numberOfPages = -1
      try {
        const pageHandlers = document
          .querySelector(
            '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
          )
          .shadowRoot.querySelectorAll(
            '#divPagination > div:nth-child(2) > ul > li > button'
          )
        // Get number of pages
        numberOfPages = Array.from(pageHandlers).length

        // Attempt to go to the next page afterwards
        pageHandlers[currPage].click()
      } catch (err) {}
      return numberOfPages
    }, currPage)

    // Increment page counter
    currPage += 1
    await page.waitForNetworkIdle()
  } while (currPage <= numberOfPages || numberOfPages === -1)

  await page.close()

  // Remove any possible duplicates
  const uniqueSocRequestURLs = new Set(socRequestURLs)
  return [...uniqueSocRequestURLs]
}
