import { exit } from "process";

// Put the SOC links of the filled classes you want to watch here
import { freq } from "./constants.js";
import puppeteer from "puppeteer";
import open from "open";
import player from "play-sound";
import notifier from "node-notifier";
import prompt from "prompt";
import fs from "fs";
import robot from "robotjs";

const classesToTrack = JSON.parse(fs.readFileSync("./classes.json"));

async function scrape(course) {
  const browser = await puppeteer.launch({
    headless: true, args: [
      '--user-data-dir=/Users/jasontay/Library/Application Support/Google/Chrome/Default']
  });
  const page = await browser.newPage();
  await page.goto(course[0]);

  // Get the "viewport" of the page, as reported by the page.
  const data = await page.evaluate(() => {
    return document
      .querySelector(
        "#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app"
      )
      .shadowRoot.querySelector(
        "#enrl_mtng_info > table > tbody > tr > td:nth-child(1)"
      )
      .innerHTML.trim();
    //   className: document
    //     .querySelector(
    //       "#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app"
    //     )
    //     .shadowRoot.querySelector("#subject_class > p")
    //     .innerHTML.split("<br>\n")[1]
    //     .split(" - ")[0]
    //     .trim(),
    // };
  });
  await browser.close();
  return data;
}

async function notifyOnStatusChange() {
  let state = false;
  for (const course in classesToTrack) {
    const currData = await scrape(classesToTrack[course]);
    if (currData.split(" ")[0] !== "Closed:") {
      console.log(`${course} is now open!`);
      console.log(currData);
      open(classesToTrack[course][1]);
      player.play("alertSound.mp3", function (err) {
        if (err) throw err;
      });
      notifier.notify({
        title: "CLASS OPENED",
        message: `${course} is now open!`,
      });
      // botTextMessage(course);
      state = true;
      exit(0);
    }
  }
  console.log(
    state
      ? "Classes status changed"
      : `No status changed ${new Date().toLocaleString()}`
  );
}

async function botTextMessage(className) {
  robot.moveMouse(1351, 1030);
  robot.mouseClick();
  robot.typeString(className);
  await sleep(3000);
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  robot.keyTap("enter");
}

// async function selectShadowElement() {
//   try {
//     const container = document.querySelector(
//       "#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app"
//     );
//     return container.shadowRoot
//       .querySelector("#select_filter_subject")
//       .shadowRoot.querySelector("#iwe-autocomplete-78");
//   } catch (err) {
//     return null;
//   }
// }

async function getClassData(subjectArea, className) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://sa.ucla.edu/ro/public/soc", {
    waitUntil: "networkidle2",
  });
  // await page.waitForFunction(selectShadowElement);
  // if (!result) {
  //   console.error("Shadow element was not found!");
  //   return;
  // }

  // await (await page.evaluateHandle(selectShadowElement)).click();
  await browser.close();
  return false;
}

function enterNewClasses() {
  const schema = {
    properties: {
      subjectArea: {
        description: "Subject Area (e.g. COM SCI)",
        type: "string",
        required: true,
      },
      className: {
        description: "Class Name (e.g. 111)",
        type: "string",
        required: true,
      },
    },
  };
  prompt.get(schema, async function (err, result) {
    const fullName = `${result.subjectArea} ${result.className}`;
    let currData = JSON.parse(fs.readFileSync("./classes.json"));
    if (currData.hasOwnProperty(fullName)) {
      console.log("Class already exists");
    } else {
      console.log("Retrieving class info...");
      const addedClass = await getClassData(
        result.subjectArea,
        result.className
      );
      if (!addedClass) console.log("Class not found");
    }
    main();
  });
}

async function main() {
  prompt.start();
  const schema = {
    properties: {
      runState: {
        description: "Run enrollment checker? (y/n)",
        type: "string",
        pattern: /^(y|n|Y|N)$/,
        required: true,
        default: "y",
      },
    },
  };

  prompt.get(schema, function (err, result) {
    let runState = result.runState.toLocaleLowerCase();
    if (runState === "y") {
      console.clear();
      console.log("Enrollment checker started");
      setInterval(notifyOnStatusChange, freq);
    } else if (runState === "n") {
      console.clear();
      console.log("Entering enrollment configuration mode");
      enterNewClasses();
    }
  });
}

main();
