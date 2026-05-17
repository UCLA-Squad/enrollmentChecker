import fs from 'fs'
import { parseFromSOCURL } from './parser.js'
import { freq } from './../config.js'
import sound from 'sound-play'
import { sendClassOpenMessage } from './lib/discordIntegration.js'

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
            const { classesInfo } = await parseFromSOCURL(currSOCURL);
            for (const classInfo of classesInfo) {
                if (classInfo.lectureSection === section) {
                    const { isOpen } = classInfo
                    if (isOpen) {
                        onClassOpen(className, section);
                    } else {
                        console.log(`${(new Date()).toLocaleDateString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                            hour12: true
                        })} ${className} ${section} is closed`);
                    }
                    break;
                }
            }
        }
    }
}

// TODO: Implement alerting
async function onClassOpen(className, section) {
    console.log(`${className} ${section} is open!`);
    sound.play('static/alertSound.mp3');

    await sendClassOpenMessage(className, section)
}

export async function main() {
    console.log("Generating tracking map");
    // To avoid loading the big mapping file every time, we generate a smaller tracking map
    await generateTrackingMap();
    console.log("Tracking classes");
    setInterval(trackClasses, freq);
}

await main();