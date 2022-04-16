import {steamGamePercentage, hour12, timezoneLocale, timezone, gogGamePercentage, expireThreshold} from './variables.js'
import log from './log.js'

import {Low, JSONFile} from 'lowdb'

import Steam from './stores/steam.js'
const steam = new Steam()

import Gog from './stores/gog.js'
const gog = new Gog()

import Ubisoft from './stores/ubisoft.js'
const ubisoft = new Ubisoft()

const filePath = './db/db.json'
const adapter = new JSONFile(filePath)
const db = new Low(adapter)

await checkDB()
const {games, deleted} = db.data

/**
 * Writes the specified JSON in database (only in memory)
 *
 * @param {JSON} dbData JSON-data to write in database
 */
export async function prepareWriteToDB(dbData) {
  return new Promise(async (resolve) => {
    log(String(dbData.store).toUpperCase() + ' * Running prepareWriteToDB')
    const postIndex = games.findIndex((p) => p.id === dbData.id)
    const post = games[postIndex]
    let info = ''
    if (post === undefined) {
      games.push(dbData)
      info = 'new'
    } else {
      if (post.discount !== dbData.discount) {
        if (post.discount < dbData.discount) {
          // Higher discount as before
          games[postIndex] = dbData
          info = 'higher'
        } else {
          // lower discount
          games[postIndex] = dbData
          info = 'lower'
        }
      }
    }
    resolve(info)
  })
}

/**
 * Writes the database from memory on the disk
 */
export async function writeToDB() {
  log('* Running writeToDB')
  db.write()
}

/**
 * Checks if the db is readable and setup
 */
async function checkDB() {
  log('* Running checkDB')
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
 *
 * @param {int} x position of pointer (default 0)
 */
export async function deleteDB(x) {
  log('* Running deleteDB')
  // Clear deleted db-schema
  deleteOverThreshold()

  const date = new Date()
  const toRemoveIDs = []
  for (let i = x; i < games.length; i++) {
    const element = games[i]
    if (element.store === 'epic') {
      try {
        const endDate = new Date(element.endDate)
        if (endDate < date) {
          log(
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
      } catch (error) {}
    } else if (element.store === 'steam') {
      try {
        const gameJson = await steam.fetchSteamIndivdualJson(element.id)
        const priceOverview = gameJson.price_overview

        if (priceOverview.discount_percent < steamGamePercentage || priceOverview.final == priceOverview.initial) {
          log('Removed steam-game from DB: ' + element.title + ' -> discount=' + priceOverview.discount_percent + '%')
          toRemoveIDs.push(i)
        }
      } catch (error) {}
    } else if (element.store === 'gog') {
      try {
        const gameJson = await gog.fetchGogIndividualJson(element.id)
        const originalPrice = parseInt(gameJson.basePrice)
        const discountPrice = parseInt(gameJson.finalPrice)

        if (discountPrice == originalPrice || Math.round((originalPrice - discountPrice) / originalPrice * 100) < gogGamePercentage) {
          log('Removed gog-game from DB: ' + element.title +
            ' -> discount=' + Math.round((originalPrice - discountPrice) / originalPrice * 100) + '%')
          toRemoveIDs.push(i)
        }
      } catch (error) {}
    } else if (element.store === 'ubisoft') {
      try {
        if (!await ubisoft.checkIfDiscounted(element)) {
          log('Removed ubisoft-game from DB: ' + element.title + ' -> no discount')
          toRemoveIDs.push(i)
        }
      } catch (error) {}
    }
    if (i > 0 && i % 50 == 0) {
      deleteAndWriteDB(toRemoveIDs)
      await deleteDB((i+1 - toRemoveIDs.length))
      return
    }
  }
  deleteAndWriteDB(toRemoveIDs)
  log('* Finished deleteDB')
}


/**
 * Deletes the ids from DB
 *
 * @param {List<int>} toRemoveIDs
 */
function deleteAndWriteDB(toRemoveIDs) {
  for (let x = toRemoveIDs.length-1; x >= 0; x--) {
    const id = toRemoveIDs[x]
    const date = new Date()
    date.setMilliseconds(0)
    date.setSeconds(0)
    deleted.push({
      ...games[id],
      deleted: date,
    })
    games.splice(id, 1)
  }
  if (toRemoveIDs.length > 0) {
    db.write()
  }
}

/**
 * Removes all games from schema `deleted` which are over the specified threshold
 */
function deleteOverThreshold() {
  const data = deleted.filter((element) => {
    const deletionDate = new Date(element.deleted)
    const thresholdDate = new Date()
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
 * @param {int} page
 * @param {int} sort
 * @param {boolean} asc
 * @return {JSON[]} a array of games
 */
export async function getGameData(store, page, sort, asc) {
  return new Promise(async (resolve) => {
    if (asc === undefined) {
      asc = true
    } else if (typeof variable != 'boolean') {
      asc = asc === 'true'
    }
    if (sort === undefined) {
      sort = 0
    }

    const elements = []
    games.forEach((element) => {
      if (element.store == store) {
        elements.push(element)
      }
    })

    let sortedList
    switch (parseInt(sort)) {
      // Added on
      case 4:
        sortedList = elements.sort((a, b) => {
          const dateA = new Date(a.added)
          const dateB = new Date(b.added)

          if (dateA < dateB) return asc ? -1 : 1
          if (dateA == dateB) return 0
          if (dateA > dateB) return asc ? 1 : -1
        })
        break
      // Discount
      case 3:
        sortedList = elements.sort((a, b) => {
          if (a.discountPercent < b.discountPercent) return asc ? -1 : 1
          if (a.discountPercent == b.discountPercent) return 0
          if (a.discountPercent > b.discountPercent) return asc ? 1 : -1
        })
        break
      // Discount price
      case 2:
        sortedList = elements.sort((a, b) => {
          if (a.discountPrice < b.discountPrice) return asc ? -1 : 1
          if (a.discountPrice == b.discountPrice) return 0
          if (a.discountPrice > b.discountPrice) return asc ? 1 : -1
        })
        break
      // Original price
      case 1:
        sortedList = elements.sort((a, b) => {
          if (a.originalPrice < b.originalPrice) return asc ? -1 : 1
          if (a.originalPrice == b.originalPrice) return 0
          if (a.originalPrice > b.originalPrice) return asc ? 1 : -1
        })
        break
      // Title
      case 0:
      default:
        sortedList = elements.sort((a, b) => {
          if (a.title < b.title) return asc ? -1 : 1
          if (a.title > b.title) return asc ? 1 : -1
        })
        break
    }
    resolve(sortedList.splice(30*(page-1), 30))
  })
}

/**
 * Get's elements for the store and checks how many pages are needed
 *
 * @param {String} store
 * @return {int} count pages
 */
export async function getGameDataPages(store) {
  return new Promise(async (resolve) => {
    const elements = []
    games.forEach((element) => {
      if (element.store == store) {
        elements.push(element)
      }
    })
    resolve(elements.length > 0 ? Math.ceil(elements.length / 30) : 1)
  })
}

/**
 * Gets from the database all games which are recently deleted
 *
 * @param {int} page
 * @param {int} sort
 * @param {boolean} asc
 * @return {JSON[]} a array of recently deleted Games
 */
export async function getRecentlyDeletedGames(page, sort, asc) {
  return new Promise(async (resolve) => {
    if (asc === undefined) {
      asc = true
    } else if (typeof variable != 'boolean') {
      asc = asc === 'true'
    }

    const elements = deleted.slice()

    if (sort !== undefined) {
      let sortedList
      switch (parseInt(sort)) {
        case 5:
          sortedList = elements.sort((a, b) => {
            const dateA = new Date(a.deleted)
            const dateB = new Date(b.deleted)

            if (dateA < dateB) return asc ? -1 : 1
            if (dateA == dateB) return 0
            if (dateA > dateB) return asc ? 1 : -1
          })
          break
        // Discount
        case 3:
          sortedList = elements.sort((a, b) => {
            if (a.discountPercent < b.discountPercent) return asc ? -1 : 1
            if (a.discountPercent == b.discountPercent) return 0
            if (a.discountPercent > b.discountPercent) return asc ? 1 : -1
          })
          break
        // Original price
        case 1:
          sortedList = elements.sort((a, b) => {
            if (a.originalPrice < b.originalPrice) return asc ? -1 : 1
            if (a.originalPrice == b.originalPrice) return 0
            if (a.originalPrice > b.originalPrice) return asc ? 1 : -1
          })
          break
        case 0:
        default:
          sortedList = elements.sort((a, b) => {
            if (a.store < b.store) return asc ? -1 : 1
            if (a.store > b.store) return asc ? 1 : -1
          })
          break
      }
      resolve(sortedList.splice(30*(page-1), 30))
    } else {
      resolve(elements.splice(30*(page-1), 30))
    }
  })
}

/**
 * Get's elements for the deleted games and checks how many pages are needed
 *
 * @return {int} count pages
 */
export async function getRecentlyDeletedGamesPages() {
  return new Promise(async (resolve) => {
    resolve(deleted.length > 0 ? Math.ceil(deleted.length / 30) : 1)
  })
}
