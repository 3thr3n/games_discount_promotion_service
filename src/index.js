import dotenv from 'dotenv'
dotenv.config()

import TelegramBot from 'node-telegram-bot-api'

import express from 'express'
const app = express()

import https from 'https'
import { CronJob } from 'cron'
import {Low, JSONFile} from 'lowdb'

// import json
import { createRequire } from "module"
const require = createRequire(import.meta.url);
const defaults = require("../defaults.json")

// Variables
const filePath = "./db/db.json"
const adapter = new JSONFile(filePath)
const db = new Low(adapter)

// Environment or default
const globTimezone = process.env.TIMEZONE || defaults.timezone
const globTimezoneLocale = process.env.TIMEZONE_LOCALE || defaults.timezone_locale
const glob12Hour = process.env.HOUR_12 || defaults['12Hour']

const globLocale = process.env.LOCALE || defaults.locale
const globCountry = process.env.COUNTRY || defaults.country
const globCron = "0 0 " + (process.env.CRON || defaults.cron)

// Telegram-BOT
const token = process.env.TELEGRAM_BOT_TOKEN
const chatID = process.env.TELEGRAM_CHATID
let bot
if (token !== undefined && chatID !== undefined && token.length > 0 && chatID != 0) {
  bot = new TelegramBot(token, {polling: false});
}

const epicgamesURL = "store-site-backend-static-ipv4.ak.epicgames.com"

// Initailize Database
await checkDB()

const { games } = db.data

// Configure Express
app.get('/', function (req, res) {
  res.send(cronJob())
})

// =====================================================================
// -------------------------------CRONJOBS------------------------------
// =====================================================================


const botJob = new CronJob(globCron, () => {
  cronJob()
}, null, false)

const deleteJob = new CronJob("0 0 0 * * *", () => {
  deleteDB()
}, null, false)


// =====================================================================
// ------------------------------FUNCTIONS------------------------------
// =====================================================================

// Initial run on start
async function init() {
  fetchEpicJson()
  deleteDB()
  botJob.start()
  deleteJob.start()
}

// Runs every x m/h/d
async function cronJob() {
  fetchEpicJson()
}

//#region EpicGames

function fetchEpicJson() {
  const options = {
    hostname: epicgamesURL,
    port: 443,
    path: '/freeGamesPromotions?locale='+globLocale+'&country='+globCountry,
    method: 'GET'
  }

  const req = https.request(options, res => {
    var body = ''
    
    res.on('data', (d) =>{
      body += d
    })

    res.on('end', () => {
      var epicgamesJson = JSON.parse(body);
      
      processEpicJson(epicgamesJson.data.Catalog.searchStore.elements);
  });
  })
  req.on('error', error => {
    console.error(error)
  })
  req.end()
}

function processEpicJson(gameData) {
  for (let i = 0; i < gameData.length; i++) {
    const { title, id, status, isCodeRedemptionOnly, seller, price, keyImages } = gameData[i];
    const { originalPrice, discountPrice, discount, currencyCode, currencyInfo } = price.totalPrice
    if (originalPrice === 0 || discount === 0 || originalPrice === discountPrice) {
      continue;
    }
    let thumbnailURL = ""
    keyImages.forEach(x => {
      if (x.type === "Thumbnail") {
        thumbnailURL = x.url
      }
    })
    const sellerName = seller.name
    const lineOffers = price.lineOffers
    const currencyDecimals = currencyInfo.decimals

    const endDates = []
    lineOffers.forEach(x => {
      if (x.appliedRules.length > 0) {
        x.appliedRules.forEach(y => {
          if (y.endDate) {
            endDates.push(y.endDate)
          }
        })
      }
    })

    const dbData = {
      "store":"epic",
      title, 
      id, 
      status, 
      "codeRedemptionOnly":isCodeRedemptionOnly ? true : false, 
      sellerName, 
      originalPrice, 
      discount, 
      discountPrice, 
      currencyCode, 
      currencyDecimals, 
      thumbnailURL, 
      "endDate":endDates.length > 1 ? endDates : endDates[0] 
    };
    prepareWriteToDB(dbData)
    writeToDB()
  }
}

function sendMessage(dbData, changes) {
  console.log(`
========================================================================
  Store: `+dbData.store+`

  `+dbData.title+` from `+dbData.sellerName+`
  `+(changes === "new" ? "NEW" : changes === "higher" ? "Update (Discount is now higher)" : "Update (Discount is now lower)")+` (`+dbData.status+`)
  
  Original price: `+dbData.originalPrice/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`
  Discount price: `+dbData.discountPrice/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`
  Discount: -`+dbData.discount/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`

  Getting key: `+dbData.codeRedemptionOnly+`
  Ends on : `+new Date(dbData.endDate).toLocaleString(globTimezoneLocale, {timeZone: globTimezone, day: '2-digit', month: '2-digit', year: 'numeric', hour12: (glob12Hour==='true'), hour: '2-digit', minute: '2-digit'})+`
========================================================================
  `)

  sendTelegramMessage(dbData, changes)
}

function sendTelegramMessage(dbData, changes) {
  if (bot === undefined) {
    return;
  }

  const message = `
  *Store: `+dbData.store+`*

  *`+dbData.title+` from `+dbData.sellerName+`*
`+(changes === "new" ? "_NEW_" : changes === "higher" ? "_Update (Discount is now higher)_" : "_Update (Discount is now lower)_")+` (`+dbData.status+`)
  [  ](`+dbData.thumbnailURL+`)
  Original price: `+dbData.originalPrice/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`
  Discount price: `+dbData.discountPrice/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`
  Discount: -`+dbData.discount/Math.pow(10,dbData.currencyDecimals)+` `+dbData.currencyCode+`

  Getting key: `+dbData.codeRedemptionOnly+`
  Ends on : `+new Date(dbData.endDate).toLocaleString(globTimezoneLocale, {timeZone: globTimezone, day: '2-digit', month: '2-digit', year: 'numeric', hour12: (glob12Hour==='true'), hour: '2-digit', minute: '2-digit'})+`
  `

  bot.sendMessage(chatID, message, {parse_mode: 'markdown'}).catch((error) => {
    console.log(error.code);
    console.log(error.response);
  });
  
}

//#endregion

//#region Database

async function prepareWriteToDB(dbData) {
  const postIndex = games.findIndex((p) => p.id === dbData.id)
  const post = games[postIndex]

  if (post === undefined) {
    // TODO write toast / telegram / 
    games.push(dbData)
    sendMessage(dbData, "new")
  } else {
    if (post.discount !== dbData.discount) {
      if (post.discount < dbData.discount) {
        // Higher discount as before
        games[postIndex] = dbData
        sendMessage(dbData, "higher")
      } else {
        // lower discount
        games[postIndex] = dbData
        sendMessage(dbData, "lower")
      }
    }
  }
}

async function writeToDB() {
  db.write()
}

async function checkDB() {
  await db.read()
  db.data ||= { games: [] }
}

async function deleteDB() {
  let date = new Date()
  const toRemoveIDs = []
  games.forEach((element, i) => {
    let endDate = new Date(element.endDate)
    if (endDate < date) {
      toRemoveIDs.push(i)
    }
  });
  toRemoveIDs.forEach(x => {
    games.splice(x, 1)
  })
  db.write()
}

//#endregion


// Start
init()
app.listen(3000)