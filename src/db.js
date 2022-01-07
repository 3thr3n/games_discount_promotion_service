import {steamGamePercentage, hour12, locale, steamStoreURL, timezoneLocale, timezone} from './variables.js'

import {Low, JSONFile} from 'lowdb'
import { sendMessage } from './msg.js'

import Steam from './stores/steam.js'

let steam = new Steam()

const filePath = './db/db.json'
const adapter = new JSONFile(filePath)
const db = new Low(adapter)

await checkDB()
const {games} = db.data

export async function prepareWriteToDB(dbData) {
  console.debug('* Running prepareWriteToDB')
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
}

export async function writeToDB() {
  console.debug('* Running writeToDB')
  db.write()
}

async function checkDB() {
  console.debug('* Running checkDB')
  await db.read()
  db.data ||= {games: []}
}

export async function deleteDB() {
  console.debug('* Running deleteDB')
  const date = new Date()
  const toRemoveIDs = []
  for (let i = 0; i < games.length; i++) {
    const element = games[i];
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
      let gameJson = await steam.fetchSteamIndivdualJson(element.id, steamStoreURL, locale)
      let price_overview = gameJson.price_overview

      if (price_overview.discount_percent < steamGamePercentage || price_overview.final == price_overview.initial) {
        console.info('Removed steam-game from DB: ' + element.title + ' -> discount=' + price_overview.discount_percent + '%')
        toRemoveIDs.push(i)
      }
    }
  }
    
  toRemoveIDs.forEach((x) => {
    games.splice(x, 1)
  })
  db.write()
}