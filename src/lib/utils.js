import { URLS, SOC_NAME_LENGTH, SEASON_TO_SUFFIX_MAP } from './constants.js'

/**
 * Takes in a term such as "Winter" or "Spring"
 * along with a year, e.g. "2023" and converts it to
 * this format: "23W", "23S", etc.
 * @param {string} quarterFourDigitYear
 * @param {string} quarterTerm
 * @returns {string}
 */
export function getQuarterTermValue(quarterFourDigitYear, quarterTerm) {
  const TWO_YEAR_SUFFIX = quarterFourDigitYear.substring(2, 4)
  return TWO_YEAR_SUFFIX + SEASON_TO_SUFFIX_MAP[quarterTerm]
}

/**
 * to-do: fix the term
 * Generates URL for getting classes from SOC
 * @param {string} subjectAreaLongName
 * @param {string} subjectAreaShortName
 * @returns {string}
 */
export function generateSocUrl(subjectAreaLongName, subjectAreaShortName) {
  const paddedShortName = subjectAreaShortName.padEnd(SOC_NAME_LENGTH, '+')
  return `${URLS.SOC}/Results?SubjectAreaName=${subjectAreaLongName}+(${subjectAreaShortName})&t=23W&sBy=subject&subj=${paddedShortName}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`
}
