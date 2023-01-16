import fs from 'fs'
import { parseFromSOCURL } from './parser.js'
import { freq } from './../config.js'

async function generateTrackingMap() {
    const classToSOCRequestMapping = JSON.parse(fs.readFileSync('classToSOCRequestMapping.json', 'utf8'));
    const classesToTrack = JSON.parse(fs.readFileSync('classes.json', 'utf8'));

    const trackingMap = {};

    for (const course in classesToTrack) {
        for (let i = 0; i < classesToTrack[course].length; i++) {
            const section = classesToTrack[course][i];
            const currSOCURL = classToSOCRequestMapping[course][section];

            if (trackingMap.hasOwnProperty(course)) {
                trackingMap[course][section] = currSOCURL;
            }
            else {
                trackingMap[course] = {
                    [section]: currSOCURL
                };
            }
        }
    }
    fs.writeFileSync('trackingMap.json', JSON.stringify(trackingMap, null, 2), 'utf8');
}

async function trackClasses() {
    const SOCURLsToTrack = JSON.parse(fs.readFileSync('trackingMap.json', 'utf8'));
    for (const className in SOCURLsToTrack) {
        for (const section in SOCURLsToTrack[className]) {
            const currSOCURL = SOCURLsToTrack[className][section];
            const { isOpen } = await parseFromSOCURL(currSOCURL);
            if (isOpen) onClassOpen(className, section);
        }
    }
}

// TODO: Implement alerting
function onClassOpen(className, section) {
    console.log(`${classToTrack} is open!`);
}

export async function main() {
    console.log("Generating tracking map");
    // To avoid loading the big mapping file every time, we generate a smaller tracking map
    await generateTrackingMap();
    console.log("Tracking classes");
    setInterval(trackClasses, freq);
}

await main();