// Put the SOC links of the filled classes you want to watch here
const { urls, freq, exchangeUrls } = require("./constants.js");
const puppeteer = require("puppeteer");
const open = require("open");
const player = require("play-sound")((opts = {}));
const notifier = require("node-notifier");

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Get the "viewport" of the page, as reported by the page.
  const data = await page.evaluate(() => {
    return {
      status: document
        .querySelector(
          "#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app"
        )
        .shadowRoot.querySelector(
          "#enrl_mtng_info > table > tbody > tr > td:nth-child(1)"
        ).innerHTML,
      className: document
        .querySelector(
          "#block-mainpagecontent > div > div > div > div > ucla-sa-soc-app"
        )
        .shadowRoot.querySelector("#subject_class > p")
        .innerHTML.split("<br>\n")[1]
        .split(" - ")[0]
        .trim(),
    };
  });
  await browser.close();
  return data;
}

async function checkFilledClassStatus(urls) {
  let data = [];
  for (let i = 0; i < urls.length; i++) {
    const currData = await scrape(urls[i]);
    if (currData.status.split(" ")[0] !== "Closed:")
      data.push(currData.className);
  }
  return data;
}

async function main() {
  setInterval(async () => {
    const changedStatusClasses = await checkFilledClassStatus(urls);
    changedStatusClasses.forEach((className) => {
      console.log(`${className} is now open!`);
      open(exchangeUrls[className]);
      player.play("alertSound.mp3", function (err) {
        if (err) throw err;
      });
      notifier.notify({
        title: "CLASS OPENED",
        message: `${className} is now open!`,
      });
    });
  }, freq);
}

main();
