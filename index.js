const express = require("express")
const cors = require("cors")
const puppeteer = require("puppeteer")
require("dotenv").config()
var cron = require("node-cron")
const axios = require("axios").default

const app = express()

app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.json())

const PORT = process.env.PORT || 3000

// Database initialization
const db = require("./database/initializeDb")
const dbName = "Covid19"
db.initialize(app, dbName, "data")

//Express server
app.listen(PORT, async () => {
    console.log(`Server is running on port: ${PORT}`)
})

const primaryID = process.env.PRIMARY_ID
const secondaryID = process.env.SECONDARY_ID
const tertiaryID = process.env.TERTIARY_ID

const Scrape = async () => {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(process.env.URL)

    const data = await page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll("table tr td"))
        return tds.map(td => td.innerText)
    });

    await browser.close()

    console.log(data)
    const world_data = data.slice(1, 9)

    const date_ob = new Date()

    let date = ("0" + date_ob.getDate()).slice(-2)
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
    let year = date_ob.getFullYear()
    let hours = ("0" + date_ob.getHours()).slice(-2)
    let minutes = ("0" + date_ob.getMinutes()).slice(-2)
    let seconds = ("0" + date_ob.getSeconds()).slice(-2)

    let time = `${date}-${month}-${year} (${hours}:${minutes}:${seconds})`

    const obj = {
        type: world_data[0],
        total_cases: world_data[1],
        new_cases: world_data[2],
        total_deaths: world_data[3],
        new_deaths: world_data[4],
        total_recovered: world_data[5],
        active_cases: world_data[6],
        critical_active_cases: world_data[7],
        time: time
    }

    axios.put(`http://localhost:${PORT}/api/data/${primaryID}`, obj)
        .catch(error => console.log(error))
}

const SwapData = async (id1, id2) => {
    const { data } = await axios.get(`http://localhost:${PORT}/api/data/${id1}`)

    const history = {
        type: data.type,
        total_cases: data.total_cases,
        new_cases: data.new_cases,
        total_deaths: data.total_deaths,
        new_deaths: data.new_deaths,
        total_recovered: data.total_recovered,
        active_cases: data.active_cases,
        critical_active_cases: data.critical_active_cases,
        time: data.time
    }
    
    axios.put(`http://localhost:${PORT}/api/data/${id2}`, history)
        .catch(error => console.log(error))
}

//At 2:00 am, the server saves the current data
cron.schedule("0 2 * * *", async () => {
    await Scrape()
    await SwapData(secondaryID, tertiaryID)
    await SwapData(primaryID, secondaryID)
})

//The server scrapes every 10 minutes
cron.schedule("*/10 * * * *", async () => {
    await Scrape()
    console.log("scraping in 10 minutes") 
})