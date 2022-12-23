// From: https://devforth.io/blog/how-to-simply-workaround-ram-leaking-libraries-like-puppeteer-universal-way-to-fix-ram-leaks-once-and-forever/

// Builds Chart in png file with RAM consumption of one or several processes. 
// To filter process you can pass a fake argument as a CLI argument e.g. --tagprocess and then run it as:
//
//   node drawRamOnChart.js 'tagprocess'
//
// Or you can use process name directly:
//
//   node drawRamOnChart.js 'chrome'
//
// If there are multiple processes with specified tag, then the number of such processes will be counted (red line) and chart will show common RAM (blue)
//
// You can also use OR to filter by multiple criteria:
//
//   # draw summary RAM of all processes which have tagprocess or chrome in ps aux output
//   node drawRamOnChart.js 'tagprocess|chrome'


// requires "vega": "^5.22.1"
// just execute "npm i vega"



import vega from 'vega';
import sharp from 'sharp';

const tags = process.argv[2] ? process.argv[2].split('|') : ['tagprocess'];


import { exec } from 'child_process';

function os_func() {
    this.execCommand = function (cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout)
            });
        })
    }
}
var os = new os_func();

const TITLE_FONT_SIZE = 28;
const LABEL_FONT_SIZE = 24;

const data = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "Line chart",
    width: 1920,
    height: 1080,
    padding: 20,
    background: "white",
    data: [
        {
            name: "table",
            values: [
            ]
        }
    ],

    scales: [
        {
            name: "x",
            type: "linear",
            range: "width",
            round: true,
            domain: { data: "table", field: "x" }
        },
        {
            name: "y",
            type: "linear",
            range: "height",
            nice: true,
            zero: false,
            domain: { data: "table", field: "y" }
        },
        {
            name: "p",
            type: "linear",
            range: "height",
            nice: true,
            zero: false,
            domain: { data: "table", field: "p" }
        },
    ],
    axes: [
        {
            orient: "bottom",
            scale: "x",
            title: "Time (seconds)",
            titleFontSize: TITLE_FONT_SIZE,
            labelFontSize: LABEL_FONT_SIZE,
        },
        {
            orient: "left",
            scale: "y",
            labelColor: "blue",
            tickColor: "blue",
            title: "Occupied RAM (MiB)",
            titleColor: "blue",
            grid: true,
            titleFontSize: TITLE_FONT_SIZE,
            labelFontSize: LABEL_FONT_SIZE,
        },
        {
            orient: "right",
            scale: "p",
            labelColor: "red",
            tickColor: "red",
            title: "Processes count",
            titleColor: "red",
            tickMinStep: 1,
            titleFontSize: TITLE_FONT_SIZE,
            labelFontSize: LABEL_FONT_SIZE,
        }
    ],

    marks: [
        {
            fontSize: 25,
            "type": "line",
            "from": { "data": "table" },
            "encode": {
                "enter": {
                    "x": { "scale": "x", "field": "x" },
                    "y": { "scale": "y", "field": "y" },
                    "stroke": { "value": "blue" },
                    "strokeWidth": { "value": 2 }
                },
                "update": {
                    "strokeOpacity": { "value": 1 }
                },
                "hover": {
                    "strokeOpacity": { "value": 0.5 }
                }
            }
        },
        {
            "type": "line",
            "from": { "data": "table" },
            "encode": {
                "enter": {
                    "x": { "scale": "x", "field": "x" },
                    "y": { "scale": "p", "field": "p" },
                    "stroke": { "value": "red" },
                    "strokeWidth": { "value": 2 }
                },
                "update": {
                    "strokeOpacity": { "value": 1 }
                },
                "hover": {
                    "strokeOpacity": { "value": 0.5 }
                }
            }
        }
    ]
};

function doPlot() {
    const view = new vega
        .View(vega.parse(data))
        .renderer('none')
        .initialize();

    view.toSVG().then(async function (svg) {

        await sharp(Buffer.from(svg))
            .toFormat('png')
            .toFile(`RAMChart_${tags.join('_or_')}.png`)

    }).catch(function (err) {
        console.error(err);
    });
}

const start = new Date();
async function run() {
    while (1) {
        await new Promise((r) => setTimeout(r, 1000),)

        const secondsPassed = Math.round(new Date() - start) / 1000;

        const rss = await os.execCommand(`ps aux | grep ${tags.reduce((a, t) => a + ' -e ' + t, '')} | grep -v grep  | grep -v drawRamOnChart | awk '{print $6}'`);
        // rss might be string separated by \n if there are multiple processes with tag (e.g. when child process spawned)
        // we want to see total value so we summ them

        // filter out empty strings
        const rssForMultipleProcesses = rss.split('\n').filter(v => !!v);
        const sumRSS = rssForMultipleProcesses.reduce((summ, value) => {
            return summ + +value;
        }, 0);

        data.data[0].values.push(
            { "x": secondsPassed, "y": +sumRSS / 1024, "p": rssForMultipleProcesses.length }
        )
        doPlot();

    }
}

run();