import dotenv from 'dotenv'
dotenv.config()

import TelegramBot from 'node-telegram-bot-api'

import express from 'express'
const app = express()

import https from 'https'
import {CronJob} from 'cron'
import {Low, JSONFile} from 'lowdb'

// import json
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
const defaults = require('../defaults.json')

// Variables
const filePath = './db/db.json'
const adapter = new JSONFile(filePath)
const db = new Low(adapter)

// Environment or default
const globTimezone = process.env.TIMEZONE || defaults.timezone
const globTimezoneLocale = process.env.TIMEZONE_LOCALE || defaults.timezone_locale
const glob12Hour = process.env.HOUR_12 || defaults['12Hour']

const globLocale = process.env.LOCALE || defaults.locale
const globCountry = process.env.COUNTRY || defaults.country
const globCron = '0 0 ' + (process.env.CRON || defaults.cron)

// EPIC
const globEpic = process.env.EPIC_ENABLED || false
const epicgamesURL = 'store-site-backend-static-ipv4.ak.epicgames.com'
const epicgamesStoreURL = 'https://www.epicgames.com/store/en-US/p/'

// STEAM
const globSteam = process.env.STEAM_ENABLED || false
const globSteamGamePrice = process.env.STEAM_GAME_PRICE || defaults.steam_game_price
const globSteamGamePercent = process.env.STEAM_GAME_PERCENTAGE || defaults.steam_game_percent
const steamStoreURL = 'store.steampowered.com'
const steanAPIURL = 'api.steampowered.com'
const steamApiTimeout = 1500

// Telegram-BOT
const token = process.env.TELEGRAM_BOT_TOKEN
const chatID = process.env.TELEGRAM_CHATID
let bot
if (token !== undefined && chatID !== undefined && token.length > 0 && chatID != 0) {
  bot = new TelegramBot(token, {polling: false})
}

// Initailize Database
await checkDB()

const {games} = db.data

// Configure Express
app.get('/', function(req, res) {
  res.send(cronJob())
})

// =====================================================================
// ------------------------------FUNCTIONS------------------------------
// =====================================================================

// #region init + cron

// =====================================================================
// -------------------------------CRONJOB-------------------------------
// =====================================================================

const botJob = new CronJob(globCron, () => {
  cronJob()
}, null, false)

const deleteJob = new CronJob('0 0 0 * * *', () => {
  deleteDB()
}, null, false)

// Runs every x m/h/d
async function cronJob() {
  if (globSteam === 'true') {
    fetchSteamJson()
  }
  if (globEpic === 'true') {
    fetchEpicJson()
  }
}

// =====================================================================
// --------------------------------INIT---------------------------------
// =====================================================================

// Initial run on start
async function init() {
  if (globSteam === 'true') {
    await fetchSteamJson()
  }
  if (globEpic === 'true') {
    await fetchEpicJson()
  }
  await deleteDB()
  botJob.start()
  deleteJob.start()
}

// #endregion

// =====================================================================
// --------------------------------STEAM--------------------------------
// =====================================================================

// #region SteamGames

async function fetchSteamJson() {
  console.debug('Running fetchSteamJson')
  const options = {
    hostname: steanAPIURL,
    port: 443,
    path: '/ISteamApps/GetAppList/v0002/?format=json',
    method: 'GET',
  }
  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', (d) => {
      body += d
    })

    res.on('end', () => {
      try {
        const steamGamesJson = JSON.parse(body)
        processSteamJson(steamGamesJson.applist.apps)
      } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.error('Error: ' + error)
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      }
    })
  })
  req.on('error', (error) => {
    console.error(error)
  })
  req.end()
}

const listAppIds = []

function processSteamJson(gameData) {
  console.debug('- Running processSteamJson')
  const appidConcatArray = []
  let appidConcat = ''

  gameData.forEach((game, i) => {
    const name = String(game.name)
    if (name.length > 0 && !name.match('demo')) {
      appidConcat += game.appid + ','
      if (i != 0 && i % 800 == 0) {
        appidConcatArray.push(appidConcat)
        appidConcat = ''
      }
    }
  })

  for (let i = 0; i < appidConcatArray.length; i++) {
    const element = appidConcatArray[i]
    setTimeout(async function() {
      await fetchSteamCashJson(element)
    }, steamApiTimeout * i)
  }

  setTimeout(async function() {
    listAppIds.forEach((i, n) => {
      setTimeout(async function() {
        await fetchSteamIndivdualJson(i)
      }, steamApiTimeout * n)
    })
    setTimeout(() => {
      writeToDB()
    }, steamApiTimeout * listAppIds.length)
  }, steamApiTimeout * appidConcatArray.length)
}

async function fetchSteamCashJson(appids) {
  console.debug('-- Running fetchSteamCashJson')
  const options = {
    hostname: steamStoreURL,
    port: 443,
    path: '/api/appdetails?cc=' + globLocale + '&l=' + globLocale + '&filters=price_overview&appids=' + appids,
    method: 'GET',
  }
  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', (d) => {
      body += d
    })

    res.on('end', () => {
      try {
        const steamStoreCashJson = JSON.parse(body)
        processSteamCashJson(steamStoreCashJson).forEach((i) => listAppIds.push(i))
      } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.error('Error: ' + error)
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.info('--> Try again! ')
        fetchSteamCashJson(appids)
      }
    })
  })
  req.on('error', (error) => {
    console.error(error)
  })
  req.end()
}

function processSteamCashJson(cashData) {
  console.debug('--- Running processSteamCashJson')
  const discounts = []
  Object.keys(cashData).forEach(function(k, v) {
    const gameAppID = cashData[k]
    if (gameAppID.data !== undefined && gameAppID.data.price_overview !== undefined) {
      const gameAppIDCash = gameAppID.data.price_overview
      if (gameAppIDCash.initial >= globSteamGamePrice && gameAppIDCash.discount_percent >= globSteamGamePercent) {
        discounts.push(k)
      }
    }
  })
  return discounts
}

async function fetchSteamIndivdualJson(appid) {
  const options = {
    hostname: steamStoreURL,
    port: 443,
    path: '/api/appdetails?cc=' + globLocale + '&l=' + globLocale + '&appids=' + appid,
    method: 'GET',
  }
  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', (d) => {
      body += d
    })

    res.on('end', () => {
      try {
        const steamStoreGameJson = JSON.parse(body)
        const game = steamStoreGameJson[appid]
        const gameSuccess = game.success
        if (gameSuccess) {
          processSteamGameJson(game.data)
        }
      } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.error('Error: ' + error)
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      }
    })
  })
  req.on('error', (error) => {
    console.error(error)
  })
  req.end()
}

function processSteamGameJson(json) {
  const dbData = {
    store: 'steam',
    title: json.name,
    id: json.steam_appid,
    status: '',
    sellerName: json.publishers[0],
    originalPrice: json.price_overview.initial,
    discountPrice: json.price_overview.final,
    discountPercent: json.price_overview.discount_percent,
    discount: json.price_overview.initial - json.price_overview.final,
    currencyCode: json.price_overview.currency,
    currencyDecimals: 2,
    thumbnailURL: json.header_image,
    storeURL: 'https://'+steamStoreURL+'/app/'+json.steam_appid,
  }
  prepareWriteToDB(dbData)
}

async function fetchSteamIndividualCashJson(appid) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: steamStoreURL,
      port: 443,
      path: '/api/appdetails?cc=' + globLocale + '&l=' + globLocale + '&filters=price_overview&appids=' + appid,
      method: 'GET',
    }
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (d) => {
        body += d
      })

      res.on('end', () => {
        try {
          const steamStoreIndividualCashJson = JSON.parse(body)
          resolve(steamStoreIndividualCashJson[appid].data.price_overview)
        } catch (error) {
          console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          console.error('Error: ' + error)
          console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          reject(error)
        }
      })
    })
    req.on('error', (error) => {
      reject(error)
    })
    req.end()
  })
}

// #endregion

// =====================================================================
// --------------------------------EPIC---------------------------------
// =====================================================================

// #region EpicGames

async function fetchEpicJson() {
  console.debug('Running fetchEpicJson')
  const options = {
    hostname: epicgamesURL,
    port: 443,
    path: '/freeGamesPromotions?locale=' + globLocale + '&country=' + globCountry,
    method: 'GET',
  }

  const req = https.request(options, (res) => {
    let body = ''

    res.on('data', (d) => {
      body += d
    })

    res.on('end', () => {
      const epicgamesJson = JSON.parse(body)
      processEpicJson(epicgamesJson.data.Catalog.searchStore.elements)
    })
  })
  req.on('error', (error) => {
    console.error(error)
  })
  req.end()
}

function processEpicJson(gameData) {
  console.debug('- Running fetchEpicJson')
  for (let i = 0; i < gameData.length; i++) {
    const {title, id, status, isCodeRedemptionOnly, seller, price, keyImages, urlSlug} = gameData[i]
    const {originalPrice, discountPrice, discount, currencyCode, currencyInfo} = price.totalPrice
    if (originalPrice === 0 || discount === 0 || originalPrice === discountPrice) {
      continue
    }
    let thumbnailURL = ''
    keyImages.forEach((x) => {
      if (x.type === 'Thumbnail') {
        thumbnailURL = x.url
      }
    })
    const sellerName = seller.name
    const lineOffers = price.lineOffers
    const currencyDecimals = currencyInfo.decimals

    const endDates = []
    lineOffers.forEach((x) => {
      if (x.appliedRules.length > 0) {
        x.appliedRules.forEach((y) => {
          if (y.endDate) {
            endDates.push(y.endDate)
          }
        })
      }
    })

    const dbData = {
      store: 'epic',
      title,
      id,
      status,
      codeRedemptionOnly: isCodeRedemptionOnly ? true : false,
      sellerName,
      originalPrice,
      discount,
      discountPrice,
      currencyCode,
      currencyDecimals,
      thumbnailURL,
      storeURL: epicgamesStoreURL+urlSlug+'?lang='+globLocale+'-'+globCountry,
      endDate: endDates.length > 1 ? endDates : endDates[0],
    }
    prepareWriteToDB(dbData)
  }
  writeToDB()
}

// #endregion

// =====================================================================
// ---------------------------------MSG---------------------------------
// =====================================================================

// #region msg

function sendMessage(dbData, changes) {
  const message =
  '========================================================================\n' +
  '  Store: ' + dbData.store + '\n' +
  '\n' +
  '  ' + dbData.title + ' from ' + dbData.sellerName + '\n' +
  '  ' + (changes === 'new' ? 'NEW' : changes === 'higher' ? 'Update (Discount is now higher)' : 'Update (Discount is now lower)') +
    ((dbData.status.length > 0) ? ' (' + dbData.status + ') ' : '') + '\n' +
  '\n' +
  '  ' + 'Original price: ' + dbData.originalPrice/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
  '  ' + 'Discount price: ' + dbData.discountPrice/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
  '  ' + 'Discount: -' + dbData.discount/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + ' ' +
    (dbData.discountPercent !== undefined ?
      '(~' + dbData.discountPercent + '%)' :
      '(~' + Math.round(dbData.discount / dbData.originalPrice * 100) + '%)') + '\n' +
  (
  dbData.store === 'epic' ?
  '\n' +
  '  ' + 'Getting key: ' + dbData.codeRedemptionOnly + '\n' +
  '  ' + 'Ends on : ' +
    new Date(dbData.endDate).toLocaleString(globTimezoneLocale,
        {
          timeZone: globTimezone,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour12: (glob12Hour==='true'),
          hour: '2-digit',
          minute: '2-digit',
        }) + '\n' : '' ) +
  '  ' + dbData.store + ' store url: ' + dbData.storeURL + '\n' +
  '========================================================================'

  console.info(message)
  sendTelegramMessage(dbData, changes)
}

function sendTelegramMessage(dbData, changes) {
  if (bot === undefined) {
    return
  }

  const message =
    '*Store: ' + dbData.store + '*\n' +
    '\n' +
    '*' + dbData.title + ' from ' + dbData.sellerName + '*\n' +
    (changes === 'new' ? '_NEW_' : changes === 'higher' ? '_Update (Discount is now higher)_' : '_Update (Discount is now lower)_') +
      (dbData.status.length > 0 ?' (' + dbData.status + ') ' : '') + '\n' +
    '[  ](' + dbData.thumbnailURL + ')\n' +
    '  ' + 'Original price: ' + dbData.originalPrice / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
    '  ' + 'Discount price: ' + dbData.discountPrice / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
    '  ' + 'Discount: -' +dbData.discount / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + ' ' +
      (dbData.discountPercent !== undefined ?
        '(~' + dbData.discountPercent + '%)' :
        '(~' + Math.round((dbData.discount / dbData.originalPrice) * 100) + '%)') + '\n' +
    (
      dbData.store === 'epic' ?
      '\n' +
      '  ' + 'Getting key: ' + dbData.codeRedemptionOnly + '\n' +
      '  ' + 'Ends on : ' + new Date(dbData.endDate).toLocaleString(globTimezoneLocale,
          {
            timeZone: globTimezone,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour12: glob12Hour === 'true',
            hour: '2-digit',
            minute: '2-digit',
          }) : ''
    ) +
    '\n' +
    '[' + dbData.store + ' store url](' + dbData.storeURL + ')\n'

  bot.sendMessage(chatID, message, {parse_mode: 'markdown'}).catch((error) => {
    console.error(error.code)
    console.error(error.response)
  })
}

// #endregion

// =====================================================================
// ------------------------------DATABASE-------------------------------
// =====================================================================

// #region Database

async function prepareWriteToDB(dbData) {
  console.debug('* Running prepareWriteToDB')
  const postIndex = games.findIndex((p) => p.id === dbData.id)
  const post = games[postIndex]

  if (post === undefined) {
    // TODO write toast / telegram /
    games.push(dbData)
    sendMessage(dbData, 'new')
  } else {
    if (post.discount !== dbData.discount) {
      if (post.discount < dbData.discount) {
        // Higher discount as before
        games[postIndex] = dbData
        sendMessage(dbData, 'higher')
      } else {
        // lower discount
        games[postIndex] = dbData
        sendMessage(dbData, 'lower')
      }
    }
  }
}

async function writeToDB() {
  console.debug('* Running writeToDB')
  db.write()
}

async function checkDB() {
  console.debug('* Running checkDB')
  await db.read()
  db.data ||= {games: []}
}

async function deleteDB() {
  console.debug('* Running deleteDB')
  const date = new Date()
  const toRemoveIDs = []
  games.forEach((element, i) => {
    if (element.store === 'epic') {
      const endDate = new Date(element.endDate)
      if (endDate < date) {
        console.info(
            'Removed epic-game from DB: ' +
            element.title +
            ' -> ' +
            new Date(dbData.endDate).toLocaleString(globTimezoneLocale, {
              timeZone: globTimezone,
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour12: glob12Hour === 'true',
              hour: '2-digit',
              minute: '2-digit',
            }),
        )
        toRemoveIDs.push(i)
      }
    } else if (element.store === 'steam') {
      fetchSteamIndividualCashJson(element.id).then((x) => {
        if (x.discount_percent < globSteamGamePercent || x.final == x.initial) {
          console.info('Removed steam-game from DB: ' + element.tile + ' -> discount=' + x.discount_percent + '%')
          toRemoveIDs.push(i)
        }
      })
    }
  })
  toRemoveIDs.forEach((x) => {
    games.splice(x, 1)
  })
  db.write()
}

// #endregion

// =====================================================================
// --------------------------------START--------------------------------
// =====================================================================

// Start
init()
app.listen(3000)
