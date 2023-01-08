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

/**
 * Example: Select Computer Science (COM SCI) 31 - Introduction to Computer Science I Lec 1
 * We ignore the "Select" part of this
 * Group 1 - Match the department name - Computer Science
 * Group 2 - Match the short departent name - COM SCI
 * Group 3 - Match the course number in series - 31
 * Group 4 - Match the course description - Introduction to Computer Science I
 * Group 5 - Match the lecture section name
 */
const COURSE_NAME_REGEX =
  /Select ([\w\s]+) \(([\w\s]+)\)\s+([\w\d]+)\s+-\s+([\w\s]+) ((Lec|Lab) (\d+))/

async function parseElem($, e, internalId) {
  // Get if it's open & spots left
  const statusText = $(e).find(`div#${internalId}-status_data`).text().trim()
  const isOpen = statusText.includes('Open')
  const isWaitlist = statusText.includes('Waitlist')
  const isClosed = statusText.includes('Closed')
  if (isOpen) {
    var [openSeats, totalSeats]  = statusText.match(/(\d+) of (\d+)/)?.slice(1)
  }
  else if (isWaitlist) {
    var [totalSeats] = statusText.match(/Class Full \((\d+)\)/)?.slice(1)
    const waitlistText = $(`div#${internalId}-waitlist_data`).text().trim()
    var [takenWaitlistSeats, totalWaitlistSeats] = waitlistText.match(/(\d+) of (\d+) Taken/)?.slice(1)
  }
  else if (isClosed) {
    var [totalSeats] = statusText.match(/Class Full \((\d+)\)/)?.slice(1)
  }

  // Get waitlist status
  const waitlistText = $(e).find(`div#${internalId}-waitlist_data`).text()
  const isWaitlisted = !waitlistText.includes('No') && isWaitlist

  // Get days, time, location, units, and instructors
  const meetingDays = $(e).find(`div#${internalId}-days_data > p > button`).first().text().trim().split('')
  const meetingTime = $(e).find(`div#${internalId}-time_data > p`).text().trim()
  const location = $(e).find(`div#${internalId}-location_data`).text().trim()
  const units = $(e).find(`div#${internalId}-units_data`).text().trim()
  const instructors = $(e).find(`div#${internalId}-instructor_data`).text().trim()

  // Get course name information
  const courseFullNameInfo = $(e).find('.screenReaderOnly').text().trim()
  const [
    _,
    // courseFullNameInfo,
    courseLongCategory,
    courseShortCategory,
    courseNumber,
    courseDescription,
    lectureSection,
  ] = courseFullNameInfo.match(COURSE_NAME_REGEX)

  return {  
    isOpen,
    isWaitlisted,
    isClosed,
    openSeats: +(openSeats ?? 0),
    totalSeats: +(totalSeats ?? 0),
    takenWaitlistSeats: takenWaitlistSeats ? +takenWaitlistSeats : null,
    totalWaitlistSeats: totalWaitlistSeats ? +totalWaitlistSeats : null,
    courseLongCategory,
    courseShortCategory,
    courseNumber,
    courseShortName: courseShortCategory + ' ' + courseNumber,
    courseLongName: courseDescription,
    lectureSection,
    meetingDays,
    meetingTime,
    location,
    units,
    instructors,
  }
}