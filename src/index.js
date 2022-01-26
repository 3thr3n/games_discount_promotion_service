import {cron, epicEnabled, gogEnabled, steamEnabled, ubisoftEnabled, timezone, timezoneLocale, hour12} from './variables.js'

import path from 'path'
import {fileURLToPath} from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Initailize Database
import {writeToDB, prepareWriteToDB, deleteDB, getGameData, getRecentlyDeletedGames} from './db.js'
import {sendMessage, sendMessageToMany} from './msg.js'

// #region Setup Express

// Configure Express
app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', function(req, res) {
  res.render('index')
})

app.get('/main', function(req, res) {
  const data = {
    mainTimer: later.schedule(mainCron).next(1),
    deleteTimer: later.schedule(deleteCron).next(1),
    timezone,
    timezoneLocale,
    hour12,
  }
  res.render('content/main', {data})
})

app.get('/epic', async function(req, res) {
  const gamesList = await getGameData('epic')
  const data = {
    title: 'Epicgames',
    gamesList,
  }
  res.render('content/tables', {data})
})

app.get('/steam', async function(req, res) {
  const gamesList = await getGameData('steam')
  const data = {
    title: 'Steam',
    gamesList,
  }
  res.render('content/tables', {data})
})

app.get('/gog', async function(req, res) {
  const gamesList = await getGameData('gog')
  const data = {
    title: 'GOG',
    gamesList,
  }
  res.render('content/tables', {data})
})

app.get('/ubisoft', async function(req, res) {
  const gamesList = await getGameData('ubisoft')
  const data = {
    title: 'Ubisoft',
    gamesList,
  }
  res.render('content/tables', {data})
})

app.get('/recently', async function(req, res) {
  const gamesList = await getRecentlyDeletedGames()
  const data = {
    title: 'Expired',
    gamesList,
    timezone,
    timezoneLocale,
    hour12,
  }
  res.render('content/recently', {data})
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
async function sendMessages(pendingMessages) {
  const pendingChanges = [...pendingMessages].filter(([k, v]) => v.dbData !== undefined && v.info !== '')

  if (pendingChanges.length <= 30) {
    pendingChanges.forEach(async ([k, value]) => {
      if (value.info === undefined || value.info === '') {
        return
      }
      const messageSent = sendMessage(value.dbData, value.info)
      if (messageSent) {
        await wait(3250)
      }
    })
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
      const messageSent = sendMessage(pendingChanges[i][1].dbData, pendingChanges[i].info)
      if (messageSent) {
        await wait(3250)
      }
    }
    sendMessageToMany(store, pendingChanges.size)
  }
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
    // await deleteDB()
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
  later.setInterval(await deleteDB, deleteCron)
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
    const concatedAppIds = processSteamJson[i]
    await wait(steamApiTimeout)
    const fetchSteamCashJson = await steam.fetchSteamCashJson(concatedAppIds)
    const processSteamCashJson = await steam.processSteamCashJson(fetchSteamCashJson)

    for (let j = 0; j < processSteamCashJson.length; j++) {
      const id = processSteamCashJson[j]
      const fetchSteamIndivdualJson = await steam.fetchSteamIndivdualJson(id)
      const processSteamGameJson = await steam.processSteamGameJson(fetchSteamIndivdualJson)
      const info = await prepareWriteToDB(processSteamGameJson)
      pendingMessages.set(processSteamGameJson.title, {dbData: processSteamGameJson, info})
    }
  }

  sendMessages(pendingMessages)
  writeToDB()
}

// =====================================================================
// --------------------------------EPIC---------------------------------
// =====================================================================

/**
 * execution logic for epic
 */
async function execEpic() {
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
  sendMessages(pendingMessages)
  writeToDB()
}

// =====================================================================
// ---------------------------------GOG---------------------------------
// =====================================================================

/**
 * execution logic for gog
 */
async function execGog() {
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

  sendMessages(pendingMessages)
  writeToDB()
}

// =====================================================================
// -------------------------------UBISOFT-------------------------------
// =====================================================================

/**
 * execution logic for epic
 */
async function execUbisoft() {
  const fetchUbisoftHtml = await ubisoft.fetchUbisoftHtml(1)

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
  sendMessages(pendingMessages)
  writeToDB()
}


// =====================================================================
// --------------------------------START--------------------------------
// =====================================================================

// Start
app.listen(3000)
init()
