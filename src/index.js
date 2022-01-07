import {cron, epicEnabled, steamEnabled} from './variables.js'

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

const deleteJob = new CronJob('0 0 0 * * *', () => {
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
      prepareWriteToDB(processSteamGameJson)
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
function execEpic() {
  epic.fetchEpicJson().then((x) => {
    const listDbData = epic.processEpicJson(x)
    if (listDbData !== undefined) {
      listDbData.forEach((dbData) => {
        prepareWriteToDB(dbData)
      })
    }
    writeToDB()
  })
}

// =====================================================================
// --------------------------------START--------------------------------
// =====================================================================

// Start
init()
app.listen(3000)
