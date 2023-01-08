import cheerio from 'cheerio'
import axios from 'axios'

async function parseFromSOCURL(SOCURL) {
  // Request the data from the SOC URL
  const res = await axios.get(SOCURL).catch(err => console.error(err))
  if (res == null || (res.status < 200 || res.status >= 300)) {
    console.error(`An error occurred trying to get the data from the URL ${SOCURL}`)
    console.error(res)
  }
  const { data } = res

  // Parse the HTML
  const $ = cheerio.load(data)

  // Class ID & internal ID
  const classID = $('div').attr('id')?.match(/\w+/)[0]
  const internalIDs = $(`div#${classID}-children > div`).toArray().map(e => $(e).attr('id'))

  // Get the info for each lecture
  const elems = $(`div#${classID}-children > div`).toArray()
  const parsePromises = elems.map(async (e, index) => parseElem($, e, internalIDs[index]))
  const classesInfo = await Promise.all(parsePromises)

  return { classID, internalIDs, classesInfo }
}
