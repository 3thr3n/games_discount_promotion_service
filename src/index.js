import {cron, epicEnabled, gogEnabled, steamEnabled} from './variables.js'

import express from 'express'
const app = express()

import {CronJob} from 'cron'

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
import {writeToDB, prepareWriteToDB, deleteDB} from './db.js'

// Configure Express
app.get('/', function(req, res) {
  res.send(cronJob())
})

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

const botJob = new CronJob(cron, () => {
  cronJob()
}, null, false)

const deleteJob = new CronJob('0 0 1 * * *', () => {
  deleteDB()
}, null, false)

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
  await deleteDB()
  if (steamEnabled) {
    execSteam()
  }
  if (epicEnabled) {
    execEpic()
  }
  if (gogEnabled) {
    execGog()
  }
  botJob.start()
  deleteJob.start()
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
init()
app.listen(3000)
