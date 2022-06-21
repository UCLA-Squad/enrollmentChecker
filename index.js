// Put the SOC links of the filled classes you want to watch here
const { freq } = require("./constants.js"),
  puppeteer = require("puppeteer"),
  open = require("open"),
  player = require("play-sound")((opts = {})),
  notifier = require("node-notifier"),
  prompt = require("prompt"),
  fs = require("fs");

const classesToTrack = JSON.parse(fs.readFileSync("./classes.json"));

async function scrape(course) {
  const browser = await puppeteer.launch();
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
  for (course in classesToTrack) {
    const currData = await scrape(classesToTrack[course]);
    if (currData.split(" ")[0] !== "Closed:") {
      console.log(`${course} is now open!`);
      open(classesToTrack[course][1]);
      player.play("alertSound.mp3", function (err) {
        if (err) throw err;
      });
      notifier.notify({
        title: "CLASS OPENED",
        message: `${course} is now open!`,
      });
      state = true;
    }
  }
  console.log(
    state
      ? "Classes status changed"
      : `No status changed ${new Date().toLocaleString()}`
  );
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
  prompt.get(schema, function (err, result) {
    const fullName = `${result.subjectArea} ${result.className}`;
    let currData = JSON.parse(fs.readFileSync("./classes.json"));
    if (currData.hasOwnProperty(fullName)) {
      console.log("Class already exists");
      main();
    }
    console.log("Retrieving class info...");
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
