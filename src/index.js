import puppeteer from 'puppeteer'
import fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config()

import { captureWithPagination } from './captureFromSOC.js'
import { buildCache, readCache } from './cache.js'
import { PATHS } from './lib/constants.js'

const { CHROME_PROFILE_DIR } = process.env

// TO-DO: Use a logging library!
async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--user-data-dir=${CHROME_PROFILE_DIR}`],
  })

  // Build the cache
  console.info('Building cache')
  await buildCache(browser)

  console.info('Reading from cache')
  const subjectAreaURLs = readCache()

  console.info('Capturing HTTP requests from all subject areas WITH pagination')
  const output = []
  // for (let x = 0; x < subjectAreaURLs.length + 4; x += 5) {
  //   const nPromises = subjectAreaURLs
  //     .slice(x, x + 5)
  //     .map(async subjectAreaURL => captureWithPagination(browser, subjectAreaURL))
  //   const nCaptures = await Promise.all(nPromises).catch(e => console.log(e))
  //   output.push(...(nCaptures ?? []))
  //   console.info(`Finished processing (${x + 5}/${subjectAreaURLs.length})`)
  //   let oldData = [];
  //   try {
  //     oldData = JSON.parse(fs.readFileSync(PATHS.OUTPUT_FILE, 'utf8'));
  //   } catch (e) { }
  //   fs.writeFileSync(PATHS.OUTPUT_FILE, JSON.stringify([...oldData, ...output], null, 2), 'utf8');
  // }

  for (let x = 25; x < subjectAreaURLs.length; x++) {
    try {
      const subjectAreaURL = subjectAreaURLs[x]
      const nCaptures = await captureWithPagination(browser, subjectAreaURL)
      output.push(...(nCaptures ?? []))
      console.info(`Finished processing (${x + 1}/${subjectAreaURLs.length})`)
      let oldData = [];
      try {
        oldData = JSON.parse(fs.readFileSync(PATHS.OUTPUT_FILE, 'utf8'));
      } catch (e) { }
      fs.writeFileSync(PATHS.OUTPUT_FILE, JSON.stringify([...oldData, ...output], null, 2), 'utf8');
    } catch (e) {
      console.log(`Failed ${subjectAreaURLs[x]}}`);
    }
  }

  await browser.close()
}

main();
