import {country, cron, epicEnabled, locale, steamEnabled, epicgamesURL} from './variables.js'

import express from 'express'
const app = express()

import {CronJob} from 'cron'

// EPIC
import Epic from './stores/epic.js'
const epic = new Epic()
const epicgamesStoreURL = 'https://www.epicgames.com/store/en-US/p/'

// STEAM
import Steam from './stores/steam.js'
const steam = new Steam()
const steamApiTimeout = 1500

// Initailize Database
import { writeToDB, prepareWriteToDB, deleteDB } from './db.js'

// Configure Express
app.get('/', function(req, res) {
  res.send(cronJob())
})

const wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

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

// Runs every x m/h/d
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

// Initial run on start
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

async function execSteam() {
  let fetchSteamJson = await steam.fetchSteamJson()
  let processSteamJson = await steam.processSteamJson(fetchSteamJson)

  for (let i = 0; i < processSteamJson.length; i++) {
    const concatedAppIds = processSteamJson[i];
    await wait(steamApiTimeout)
    let fetchSteamCashJson = await steam.fetchSteamCashJson(concatedAppIds)
    let processSteamCashJson = await steam.processSteamCashJson(fetchSteamCashJson)

    for (let j = 0; j < processSteamCashJson.length; j++) {
      const id = processSteamCashJson[j]
      let fetchSteamIndivdualJson = await steam.fetchSteamIndivdualJson(id)
      let processSteamGameJson = await steam.processSteamGameJson(fetchSteamIndivdualJson)
      prepareWriteToDB(processSteamGameJson)
    }
  }

  writeToDB()
}

// =====================================================================
// --------------------------------EPIC---------------------------------
// =====================================================================

function execEpic() {
  epic.fetchEpicJson(epicgamesURL, locale, country).then((x) => {
    let listDbData = epic.processEpicJson(x, epicgamesStoreURL, locale, country)
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
