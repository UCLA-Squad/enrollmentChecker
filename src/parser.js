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

const SOC_URLS = [
  'https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model=%7B%22Term%22%3A%2223W%22%2C%22SubjectAreaCode%22%3A%22AERO+ST%22%2C%22CatalogNumber%22%3A%220000A+++%22%2C%22IsRoot%22%3Atrue%2C%22SessionGroup%22%3A%22%25%22%2C%22ClassNumber%22%3A%22%25%22%2C%22SequenceNumber%22%3Anull%2C%22Path%22%3A%22AEROST0000A%22%2C%22MultiListedClassFlag%22%3A%22n%22%2C%22Token%22%3A%22MDAwMEEgICBBRVJPU1QwMDAwQQ%3D%3D%22%7D&FilterFlags=%7B%22enrollment_status%22%3A%22O%2CW%2CC%2CX%2CT%2CS%22%2C%22advanced%22%3A%22y%22%2C%22meet_days%22%3A%22T%2CF%22%2C%22start_time%22%3A%227%3A00+am%22%2C%22end_time%22%3A%221%3A00+pm%22%2C%22meet_locations%22%3Anull%2C%22meet_units%22%3Anull%2C%22instructor%22%3Anull%2C%22class_career%22%3Anull%2C%22impacted%22%3A%22N%22%2C%22enrollment_restrictions%22%3Anull%2C%22enforced_requisites%22%3Anull%2C%22individual_studies%22%3A%22n%22%2C%22summer_session%22%3Anull%7D&_=1673153684542',
  'https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model=%7B%22Term%22%3A%2223W%22%2C%22SubjectAreaCode%22%3A%22COM+SCI%22%2C%22CatalogNumber%22%3A%220031++++%22%2C%22IsRoot%22%3Atrue%2C%22SessionGroup%22%3A%22%25%22%2C%22ClassNumber%22%3A%22%25%22%2C%22SequenceNumber%22%3Anull%2C%22Path%22%3A%22COMSCI0031%22%2C%22MultiListedClassFlag%22%3A%22n%22%2C%22Token%22%3A%22MDAzMSAgICBDT01TQ0kwMDMx%22%7D&FilterFlags=%7B%22enrollment_status%22%3A%22O%2CW%2CC%2CX%2CT%2CS%22%2C%22advanced%22%3A%22y%22%2C%22meet_days%22%3A%22M%2CT%2CW%2CR%2CF%22%2C%22start_time%22%3A%228%3A00+am%22%2C%22end_time%22%3A%228%3A00+pm%22%2C%22meet_locations%22%3Anull%2C%22meet_units%22%3Anull%2C%22instructor%22%3Anull%2C%22class_career%22%3Anull%2C%22impacted%22%3Anull%2C%22enrollment_restrictions%22%3Anull%2C%22enforced_requisites%22%3Anull%2C%22individual_studies%22%3Anull%2C%22summer_session%22%3Anull%7D&_=1673150852788',
  'https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model=%7B%22Term%22%3A%2223W%22%2C%22SubjectAreaCode%22%3A%22EC+ENGR%22%2C%22CatalogNumber%22%3A%220100++++%22%2C%22IsRoot%22%3Atrue%2C%22SessionGroup%22%3A%22%25%22%2C%22ClassNumber%22%3A%22%25%22%2C%22SequenceNumber%22%3Anull%2C%22Path%22%3A%22ECENGR0100%22%2C%22MultiListedClassFlag%22%3A%22n%22%2C%22Token%22%3A%22MDEwMCAgICBFQ0VOR1IwMTAw%22%7D&FilterFlags=%7B%22enrollment_status%22%3A%22O%2CW%2CC%2CX%2CT%2CS%22%2C%22advanced%22%3A%22y%22%2C%22meet_days%22%3A%22M%2CT%2CW%2CR%2CF%22%2C%22start_time%22%3A%228%3A00+am%22%2C%22end_time%22%3A%228%3A00+pm%22%2C%22meet_locations%22%3Anull%2C%22meet_units%22%3Anull%2C%22instructor%22%3Anull%2C%22class_career%22%3Anull%2C%22impacted%22%3Anull%2C%22enrollment_restrictions%22%3Anull%2C%22enforced_requisites%22%3Anull%2C%22individual_studies%22%3Anull%2C%22summer_session%22%3Anull%7D&_=1673150142127',
  'https://sa.ucla.edu/ro/public/soc/Results/GetCourseSummary?model={%22Term%22:%2223W%22,%22SubjectAreaCode%22:%22COM%20SCI%22,%22CatalogNumber%22:%220131%20%22,%22IsRoot%22:true,%22SessionGroup%22:%22%%22,%22ClassNumber%22:%22%%22,%22SequenceNumber%22:null,%22Path%22:%22COMSCI0131%22,%22MultiListedClassFlag%22:%22n%22,%22Token%22:%22MDEzMSAgICBDT01TQ0kwMTMx%22}&FilterFlags={%22enrollment_status%22:%22O,W,C,X,T,S%22,%22advanced%22:%22y%22,%22meet_days%22:%22M,T,W,R,F%22,%22start_time%22:%228:00%20am%22,%22end_time%22:%228:00%20pm%22,%22meet_locations%22:null,%22meet_units%22:null,%22instructor%22:null,%22class_career%22:null,%22impacted%22:null,%22enrollment_restrictions%22:null,%22enforced_requisites%22:null,%22individual_studies%22:null,%22summer_session%22:null}&_=1673147382140',
]

for (const SOC_URL of SOC_URLS) {
  console.dir(await parseFromSOCURL(SOC_URL), { depth: 5 })
}