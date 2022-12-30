import fs from 'fs'

import { getQuarterTermValue, generateSocUrl } from './lib/utils.js'
import { URLS, PATHS, SUBJECT_AREA_NAME_REGEX } from './lib/constants.js'

/**
 *
 * @param {object} browser
 */
async function buildSubjectAreasCache(browser) {
  // Go to SOC Page
  const page = await browser.newPage()
  await page.goto(URLS.SOC)
  await page.waitForNetworkIdle()

  // TO-DO: Get rid of hardcoding
  // Select the quarter to scrape
  const quarterTermValue = getQuarterTermValue('2023', 'Winter')
  await page.evaluate(quarterTermValue => {
    document
      .querySelector(
        '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
      )
      .shadowRoot.querySelector('#optSelectTerm').value = quarterTermValue
  }, quarterTermValue)

  await page.waitForNetworkIdle()

  // Search by subject area
  await page.evaluate(() => {
    document
      .querySelector(
        '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
      )
      .shadowRoot.querySelector('#search_by').value = 'subject'
  })

  const subjectAreas = await page.evaluate(() => {
    const subjectAreaOptions = Array.from(
      document
        .querySelector(
          '#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app'
        )
        .shadowRoot.querySelector('#select_filter_subject')
        .shadowRoot.querySelectorAll('#dropdownitems > div')
    )

    return subjectAreaOptions.map(subjectArea => subjectArea.textContent)
  })

  await page.waitForNetworkIdle()
  await page.close()

  // Write subject areas to file
  fs.writeFileSync(PATHS.SUBJECT_AREAS_FILE, subjectAreas.join('\n'), 'utf8')

  return subjectAreas
}

/**
 *
 * @param {string[]} subjectAreas
 * @returns {string[]}
 */
function buildSubjectAreaURLSCache(subjectAreas) {
  const subjectAreaURLs = subjectAreas.map(subjectArea => {
    // Extract long and short name from subject area
    const matches = subjectArea.match(SUBJECT_AREA_NAME_REGEX) ?? []
    if (matches.length === 1) matches.push(matches[0])

    // Encode long and short name
    const [encodedLongName, encodedShortName] = matches.map(s =>
      s.trim().replace(/ /g, '+')
    )
    return generateSocUrl(encodedLongName, encodedShortName)
    // const capturedSOCURLs = await captureWithPagination(browser, SOC_URL);
  })

  // Write subject areas into file
  fs.writeFileSync(
    PATHS.SUBJECT_AREAS_URLS_FILE,
    subjectAreaURLs.join('\n'),
    'utf8'
  )
  return subjectAreaURLs
}

export async function buildCache(browser) {
  // Get subject areas
  const subjectAreas = await buildSubjectAreasCache(browser)
  buildSubjectAreaURLSCache(subjectAreas)
}

export function readCache() {
  return fs
    .readFileSync(PATHS.SUBJECT_AREAS_URLS_FILE, 'utf8')
    .split(/\r?\n/gm)
    .map(s => s.trim())
}
