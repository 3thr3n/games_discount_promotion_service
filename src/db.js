import {steamGamePercentage, hour12, timezoneLocale, timezone, gogGamePercentage, expireThreshold} from './variables.js'

import {Low, JSONFile} from 'lowdb'
import {sendMessage} from './msg.js'

import Steam from './stores/steam.js'
const steam = new Steam()

import Gog from './stores/gog.js'
const gog = new Gog()

const filePath = './db/db.json'
const adapter = new JSONFile(filePath)
const db = new Low(adapter)

await checkDB()
const {games, deleted} = db.data

/**
 * Method to sleep x ms
 *
 * @param {number} ms
 * @return {Promise<any>}
 */
const wait=(ms)=>new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Writes the specified JSON in database (only in memory)
 *
 * @param {JSON} dbData JSON-data to write in database
 */
export async function prepareWriteToDB(dbData) {
  return new Promise(async (resolve) => {
    console.debug(String(dbData.store).toUpperCase() + ' * Running prepareWriteToDB')
    const postIndex = games.findIndex((p) => p.id === dbData.id)
    const post = games[postIndex]

    if (post === undefined) {
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
    await wait(3100)
    resolve()
  })
}

/**
 * Writes the database from memory on the disk
 */
export async function writeToDB() {
  console.debug('*** Running writeToDB')
  db.write()
}

/**
 * Checks if the db is readable and setup
 */
async function checkDB() {
  console.debug('* Running checkDB')
  await db.read()
  db.data ||= {games: [], deleted: []}

  if (!db.data.deleted) {
    db.data = ({
      games: db.data.games,
      deleted: [],
    })
  }
}

/**
 * Deletes out of database if:
 * - epic: endDate is older than today
 * - steam: discount is under the threshold or no discount is found for the game
 */
export async function deleteDB() {
  console.debug('* Running deleteDB')
  // Clear deleted db-schema
  deleteOverThreshold()

  const date = new Date()
  const toRemoveIDs = []
  for (let i = 0; i < games.length; i++) {
    
    const element = games[i]
    if (element.store === 'epic') {
      const endDate = new Date(element.endDate)
      if (endDate < date) {
        console.info(
            'Removed epic-game from DB: ' +
            element.title +
            ' -> ' +
            new Date(element.endDate).toLocaleString(timezoneLocale, {
              timeZone: timezone,
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour12: hour12 === 'true',
              hour: '2-digit',
              minute: '2-digit',
            }),
        )
        toRemoveIDs.push(i)
      }
    } else if (element.store === 'steam') {
      const gameJson = await steam.fetchSteamIndivdualJson(element.id)
      const priceOverview = gameJson.price_overview

      if (priceOverview.discount_percent < steamGamePercentage || priceOverview.final == priceOverview.initial) {
        console.info('Removed steam-game from DB: ' + element.title + ' -> discount=' + priceOverview.discount_percent + '%')
        toRemoveIDs.push(i)
      }
    } else if (element.store === 'gog') {
      const gameJson = await gog.fetchGogIndividualJson(element.id)
      const originalPrice = parseInt(gameJson.basePrice)
      const discountPrice = parseInt(gameJson.finalPrice)

      if (discountPrice == originalPrice || Math.round((originalPrice - discountPrice) / originalPrice * 100) < gogGamePercentage) {
        console.info('Removed gog-game from DB: ' + element.title +
          ' -> discount=' + Math.round((originalPrice - discountPrice) / originalPrice * 100) + '%')
        toRemoveIDs.push(i)
      }
    }
  }

  for (let x = toRemoveIDs.length-1; x >= 0; x--) {
    const id = toRemoveIDs[x]
    let date = new Date()
    date.setMilliseconds(0)
    date.setSeconds(0)
    deleted.push({
      ...games[id],
      deleted: date,
    })
    games.splice(id, 1)
  }

  db.write()
}

function deleteOverThreshold() {

  let data = deleted.filter((element) => {
    let deletionDate = new Date(element.deleted)
    let thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - parseInt(expireThreshold))

    if (deletionDate > thresholdDate) return true
    return false
  })

  deleted.length = 0

  deleted.push(...data)
}

/**
 * Gets from the database all games from one store
 *
 * @param {String} store
 * @return {JSON[]} a array of games
 */
export async function getGameData(store) {
  return new Promise(async (resolve) => {
    const elements = []
    games.forEach((element) => {
      if (element.store == store) {
        elements.push(element)
      }
    })
    resolve(elements.sort((a, b) => {
      if (a.title < b.title) return -1
      if (a.title > b.title) return 1
    }))
  })
}

export async function getRecentlyDeletedGames() {
  return new Promise(async (resolve) => {
    resolve(deleted.sort((a, b) => {
      if (a.title < b.title) return -1
      if (a.title > b.title) return 1
    }))
  })
}
