import {cron, epicEnabled, gogEnabled, steamEnabled, timezone, timezoneLocale, hour12} from './variables.js'

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

// Initailize Database
import {writeToDB, prepareWriteToDB, deleteDB, getGameData, getRecentlyDeletedGames} from './db.js'

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

// app.get('/data', function(req, res) {
//   res.sendFile(joinHtmlPath('data.html'))
// })

/**
 * Method to sleep x ms
 *
 * @param {number} ms
 * @return {Promise<any>}
 */
const wait=(ms)=>new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================================
// ------------------------------FUNCTIONS------------------------------
// =====================================================================

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
    await deleteDB()
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

  for (let i = 0; i < processSteamJson.length; i++) {
    const concatedAppIds = processSteamJson[i]
    await wait(steamApiTimeout)
    const fetchSteamCashJson = await steam.fetchSteamCashJson(concatedAppIds)
    const processSteamCashJson = await steam.processSteamCashJson(fetchSteamCashJson)

    for (let j = 0; j < processSteamCashJson.length; j++) {
      const id = processSteamCashJson[j]
      const fetchSteamIndivdualJson = await steam.fetchSteamIndivdualJson(id)
      const processSteamGameJson = await steam.processSteamGameJson(fetchSteamIndivdualJson)
      await prepareWriteToDB(processSteamGameJson)
    }
  }

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
  if (listDbData !== undefined) {
    for (let i = 0; i < listDbData.length; i++) {
      const dbData = listDbData[i]
      await prepareWriteToDB(dbData)
    }
  }
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
  for (let i = 0; i < fetchGogJson.length; i++) {
    const gameData = fetchGogJson[i]
    const processGogGameJson = await gog.processGogGameJson(gameData)
    if (processGogGameJson !== undefined) {
      await prepareWriteToDB(processGogGameJson)
    }
  }
  writeToDB()
}

// =====================================================================
// --------------------------------START--------------------------------
// =====================================================================

// Start
app.listen(3000)
init()
