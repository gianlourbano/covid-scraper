const express = require("express")
const cors = require("cors")
const puppeteer = require("puppeteer")
require("dotenv").config()
const axios = require("axios").default

const app = express()

app.use(cors())
app.use(express.json());

const PORT = process.env.PORT || 3000

const db = require("./database/initializeDb")
const dbName = "Covid19"
db.initialize(app, dbName, "data")

app.listen(PORT, () =>  {
    console.log("Node.js server is running on port " + PORT)
})

const scrape = async () => {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(process.env.URL)

    await page.waitFor(5000)

    const data = await page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll("table tr td")).slice(1, 9)
        return tds.map(td => td.innerText)
    });

    await browser.close()

    const date_ob = new Date()

    let date = ("0" + date_ob.getDate()).slice(-2)
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
    let year = date_ob.getFullYear()
    let hours = date_ob.getHours()
    let minutes = date_ob.getMinutes()
    let seconds = ("0" + date_ob.getSeconds()).slice(-2)

    let time = `${date}-${month}-${year} (${hours}:${minutes}:${seconds})`

    const obj = {
        type: data[0],
        total_cases: data[1],
        new_cases: data[2],
        total_deaths: data[3],
        new_deaths: data[4],
        total_recovered: data[5],
        active_cases: data[6],
        critical_active_cases: data[7],
        time: time
    }

    axios.put(`http://localhost:${PORT}/api/data/5f652cc9fd9551c302fb117e`, obj)
        .catch(error => console.log(error))
}

var cron = require("node-cron")
cron.schedule("*/30 * * * *", () => {
    scrape()
})