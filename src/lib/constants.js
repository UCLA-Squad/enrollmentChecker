// Constants:
export const URLS = {
  SOC: 'https://sa.ucla.edu/ro/public/soc',
}
export const PATHS = {
  SUBJECT_AREAS_FILE: 'subjectAreas.txt',
  SUBJECT_AREAS_URLS_FILE: 'subjectAreasURLs.txt',
  OUTPUT_FILE: 'output.json'
}
export const SOC_NAME_LENGTH = 7
export const SUBJECT_AREA_NAME_REGEX = /([a-zA-Z]|\s)+/gm

export const SEASON_TO_SUFFIX_MAP = {
  Winter: 'W',
  Fall: 'F',
  Spring: 'S',
  Summer: '2',
  'Summer Sessions': '1',
}