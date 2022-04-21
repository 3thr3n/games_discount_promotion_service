import {cron, epicEnabled, gogEnabled,
  steamEnabled, ubisoftEnabled, timezone,
  timezoneLocale, hour12} from './variables.js'

const env = process.env.NODE_ENV || 'development'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'

import path from 'path'
import {fileURLToPath} from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __vuePath = __dirname + '/vue'

import log from './log.js'

import express from 'express'
const app = express()

import later from 'later'

// EPIC
import Epic from './stores/epic.js'
const epic = new Epic()

// STEAM
import Steam from './stores/steam.js'
const steam = new Steam()
const steamApiTimeout = 1500

// GOG
import Gog from './stores/gog.js'
const gog = new Gog()

// UBISOFT
import Ubisoft from './stores/ubisoft.js'
const ubisoft = new Ubisoft()

let sendingMessages = false

// Initailize Database
import {writeToDB, prepareWriteToDB,
  deleteDB, getGameData, getRecentlyDeletedGames,
  getGameDataPages, getRecentlyDeletedGamesPages,
  getSearchData} from './db.js'
import {sendMessage, sendMessageTooMany} from './msg.js'

// #region Setup Express

// Configure Express
if (env === 'development') {
  // Fucking cors in development
  const allowlist = ['http://localhost:8080']

  /**
   * Cors
   * @param {Object} req
   * @param {Object} callback
   */
  const corsOptionsDelegate = function(req, callback) {
    let corsOptions
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
      corsOptions = {origin: true} // reflect (enable) the requested origin in the CORS response
    } else {
      corsOptions = {origin: false} // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
  }
  app.use(cors(corsOptionsDelegate))
} else {
  app.use(cors())
  app.use(compression())
  app.use(helmet.crossOriginOpenerPolicy())
  app.use(helmet.dnsPrefetchControl())
  app.use(helmet.expectCt())
  app.use(helmet.frameguard())
  app.use(helmet.hidePoweredBy())
  app.use(helmet.hsts())
  app.use(helmet.ieNoOpen())
  app.use(helmet.noSniff())
  app.use(helmet.originAgentCluster())
  app.use(helmet.permittedCrossDomainPolicies())
  app.use(helmet.referrerPolicy())
  app.use(helmet.xssFilter())
}


app.use(express.static(__vuePath))

app.get('/', function(req, res) {
  res.sendFile(__vuePath + '/index.html')
})

app.get('/api/main', function(req, res) {
  res.send({
    mainTimer: later.schedule(mainCron).next(1),
    deleteTimer: later.schedule(deleteCron).next(1),
    timezone,
    timezoneLocale,
    hour12,
  })
})

app.get('/api/epicgames', async function(req, res) {
  const gamesList = await getGameData('epic', req.query['page'], req.query['sort'], req.query['asc'])
  const gamesListPages = await getGameDataPages('epic')
  res.send({
    gamesList,
    gamesListPages,
    curPage: req.query['page'],
  })
})

app.get('/api/steam', async function(req, res) {
  const gamesList = await getGameData('steam', req.query['page'], req.query['sort'], req.query['asc'])
  const gamesListPages = await getGameDataPages('steam')
  res.send( {
    gamesList,
    gamesListPages,
    curPage: req.query['page'],
  })
})

app.get('/api/gog', async function(req, res) {
  const gamesList = await getGameData('gog', req.query['page'], req.query['sort'], req.query['asc'])
  const gamesListPages = await getGameDataPages('gog')
  res.send({
    gamesList,
    gamesListPages,
    curPage: req.query['page'],
  })
})

app.get('/api/ubisoft', async function(req, res) {
  const gamesList = await getGameData('ubisoft', req.query['page'], req.query['sort'], req.query['asc'])
  const gamesListPages = await getGameDataPages('ubisoft')
  res.send({
    gamesList,
    gamesListPages,
    curPage: req.query['page'],
  })
})

app.get('/api/old', async function(req, res) {
  const gamesList = await getRecentlyDeletedGames(req.query['page'], req.query['sort'], req.query['asc'])
  const gamesListPages = await getRecentlyDeletedGamesPages()
  res.send( {
    gamesList,
    timezone,
    timezoneLocale,
    hour12,
    gamesListPages,
    curPage: req.query['page'],
  })
})

app.get('/api/search', async function(req, res) {
  const query = req.query['q']
  if (query && query.length <= 3) {
    res.send({success: false})
    return
  }

  const gameList = await getSearchData(req.query['q'], req.query['page'])
  const keys = Object.keys(gameList)
  const shopList = {}
  for (const key of keys) {
    const game = gameList[key]
    if (!shopList[game.store]) {
      shopList[game.store] = []
    }
    shopList[game.store].push(game)
  }

  res.send({
    gameList: shopList,
    curPage: req.query['page'],
  })
})

app.use(function(req, res, next) {
  res.status(404)

  res.redirect('/#/ohno')
})

// #endregion

/**
 * Method to sleep x ms
 *
 * @param {number} ms
 * @return {Promise<any>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================================
// ------------------------------FUNCTIONS------------------------------
// =====================================================================

/**
 * Checks if the size of send messages are greater than 30 and sends an different message.
 * After check, it sends the messages or sends only an info
 *
 * @param {Map<String, JSON>} pendingMessages all messages for one shop
 */
async function sendingPendingMessages(pendingMessages) {
  while (sendingMessages) {
    await wait(1000)
  }
  sendingMessages = true
  const pendingChanges = [...pendingMessages].filter(([k, v]) => v.dbData !== undefined && v.info !== '')

  if (pendingChanges.length <= 30) {
    for (let i = 0; i < pendingChanges.length; i++) {
      if (pendingChanges[i][1].info === undefined || pendingChanges[i][1].info === '') {
        return
      }
      const messageSent = sendMessage(pendingChanges[i][1].dbData, pendingChanges[i][1].info)
      if (messageSent) {
        await wait(3250)
      }
    }
  } else {
    let store
    for (let i = 0; i < pendingChanges.length; i++) {
      if (i == 30) {
        store = pendingChanges[i][1].dbData.store
        break
      }
      if (pendingChanges[i][1].info === undefined || pendingChanges[i][1].info === '') {
        return
      }
      const messageSent = sendMessage(pendingChanges[i][1].dbData, pendingChanges[i][1].info)
      if (messageSent) {
        await wait(3250)
      }
    }
    sendMessageTooMany(store, pendingChanges.length)
  }
  sendingMessages = false
}

// #region init + cron

// =====================================================================
// -------------------------------CRONJOB-------------------------------
// =====================================================================

const mainCron = later.parse.cron(cron, true)
const deleteCron = later.parse.cron('0 0 1 * * *', true)

/**
 * Runs every x hours
 */
async function cronJob() {
  if (steamEnabled) {
    execSteam()
  }
  if (epicEnabled) {
    execEpic()
  }
  if (gogEnabled) {
    execGog()
  }
  if (ubisoftEnabled) {
    execUbisoft()
  }
}

/**
 * Runs every night at 1 am
 */
async function cronDeleteJob() {
  deleteDB(0)
}

// =====================================================================
// --------------------------------INIT---------------------------------
// =====================================================================

/**
 * Initial run after setup
 */
async function init() {
  later.date.localTime()

  const mainCronTimes = later.schedule(mainCron).next(1)
  const deleteCronTimes = later.schedule(deleteCron).next(1)

  const date = new Date()
  date.setHours(date.getHours() + 1)

  // Run only when the next execution is over one hour away
  if (deleteCronTimes > date) {
    await deleteDB(0)
  }

  if (mainCronTimes > date) {
    if (steamEnabled) {
      execSteam()
    }
    if (epicEnabled) {
      execEpic()
    }
    if (gogEnabled) {
      execGog()
    }
    if (ubisoftEnabled) {
      execUbisoft()
    }
  }

  later.setInterval(await cronJob, mainCron)
  later.setInterval(await cronDeleteJob, deleteCron)
}

// #endregion

// =====================================================================
// --------------------------------STEAM--------------------------------
// =====================================================================

/**
 * execution logic for steam
 */
async function execSteam() {
  const fetchSteamJson = await steam.fetchSteamJson()
  const processSteamJson = await steam.processSteamJson(fetchSteamJson)

  const pendingMessages = new Map()

  for (let i = 0; i < processSteamJson.length; i++) {
    try {
      const concatedAppIds = processSteamJson[i]
      await wait(steamApiTimeout)
      const fetchSteamCashJson = await steam.fetchSteamCashJson(concatedAppIds)
      const processSteamCashJson = await steam.processSteamCashJson(fetchSteamCashJson)

      for (let j = 0; j < processSteamCashJson.length; j++) {
        try {
          const id = processSteamCashJson[j]
          const fetchSteamIndivdualJson = await steam.fetchSteamIndivdualJson(id)
          if (fetchSteamIndivdualJson) {
            const processSteamGameJson = await steam.processSteamGameJson(fetchSteamIndivdualJson)
            const info = await prepareWriteToDB(processSteamGameJson)
            pendingMessages.set(processSteamGameJson.title, {dbData: processSteamGameJson, info})
          }
        } catch (error) {
          log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          log('Error: ' + error)
          log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }
        writeToDB()
      }
    } catch (error) {
      log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      log('Error: ' + error)
      log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    }
  }

  await sendingPendingMessages(pendingMessages)
  writeToDB()
}

// =====================================================================
// --------------------------------EPIC---------------------------------
// =====================================================================

/**
 * execution logic for epic
 */
async function execEpic() {
  try {
    const fetchEpicJson = await epic.fetchEpicJson()
    const listDbData = await epic.processEpicJson(fetchEpicJson)

    const pendingMessages = new Map()

    if (listDbData !== undefined) {
      for (let i = 0; i < listDbData.length; i++) {
        const dbData = listDbData[i]
        const info = await prepareWriteToDB(dbData)
        pendingMessages.set(dbData.title, {dbData, info})
      }
    }
    await sendingPendingMessages(pendingMessages)
    writeToDB()
  } catch (error) {
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    log('Error: ' + error)
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  }
}

// =====================================================================
// ---------------------------------GOG---------------------------------
// =====================================================================

/**
 * execution logic for gog
 */
async function execGog() {
  try {
    const fetchGogJson = await gog.fetchGogJson(1)

    const pendingMessages = new Map()

    for (let i = 0; i < fetchGogJson.length; i++) {
      const gameData = fetchGogJson[i]
      const processGogGameJson = await gog.processGogGameJson(gameData)
      if (processGogGameJson !== undefined) {
        const info = await prepareWriteToDB(processGogGameJson)
        pendingMessages.set(processGogGameJson.title, {dbData: processGogGameJson, info})
      }
    }

    await sendingPendingMessages(pendingMessages)
    writeToDB()
  } catch (error) {
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    log('Error: ' + error)
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  }
}

// =====================================================================
// -------------------------------UBISOFT-------------------------------
// =====================================================================

/**
 * execution logic for epic
 */
async function execUbisoft() {
  let fetchUbisoftHtml = []
  try {
    fetchUbisoftHtml = await ubisoft.fetchUbisoftHtml(1)
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.error('Error: ' + error)
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  }

  try {
    const pendingMessages = new Map()

    for (let i = 0; i < fetchUbisoftHtml.length; i++) {
      const gameTile = fetchUbisoftHtml[i]
      const processUbisoftHtml = await ubisoft.processUbisoftHtml(gameTile).catch((err) => {
        if (err.message !== 'No discount') {
          console.error(err)
        }
      })
      if (processUbisoftHtml !== undefined) {
        for (let x = 0; x < processUbisoftHtml.length; x++) {
          const gameJson = processUbisoftHtml[x]
          const info = await prepareWriteToDB(gameJson)
          pendingMessages.set(gameJson.title, {dbData: gameJson, info})
        }
      }
    }
    await sendingPendingMessages(pendingMessages)
    writeToDB()
  } catch (e) {
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    log('Error: ' + error)
    log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  }
}


// =====================================================================
// --------------------------------START--------------------------------
// =====================================================================

// Start
app.listen(3000)
init()
