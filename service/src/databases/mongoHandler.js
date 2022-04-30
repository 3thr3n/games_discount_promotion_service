import {MongoClient} from 'mongodb'
import {mongodbUrl, gamesPerPage, expireThreshold, steamGamePercentage, gogGamePercentage} from '../utils/variables.js'
import moment from 'moment'

import Steam from '../stores/steam.js'
const steam = new Steam()

import Gog from '../stores/gog.js'
const gog = new Gog()

import Ubisoft from '../stores/ubisoft.js'
import log from '../utils/log.js'
const ubisoft = new Ubisoft()

const client = new MongoClient(mongodbUrl)
let gameCollection = undefined
let deleteCollection = undefined

/**
 *
 */
export async function connectToMongo() {
  return client.connect().then(() => {
    console.log('Connected successfully to server')
    const db = client.db('gdps')
    gameCollection = db.collection('games')
    deleteCollection = db.collection('delete')
    return true
  }).catch(() => {
    return false
  })
}

/**
 *
 * @param {any} dbData Data to save
 * @param {boolean} deleted
 */
export async function writeInMongo(dbData, deleted) {
  return new Promise(async (resolve) => {
    const filter = {
      id: dbData.id,
      store: dbData.store,
      title: dbData.title,
      originalPrice: dbData.originalPrice,
    }

    const updateOrInsert = {
      $set: {
        id: dbData.id,
        store: dbData.store,
        title: dbData.title,
        codeRedemptionOnly: dbData.codeRedemptionOnly,
        sellerName: dbData.sellerName,
        originalPrice: dbData.originalPrice,
        discount: dbData.discount,
        discountPrice: dbData.discountPrice,
        discountPercent: dbData.discountPercent,
        currencyCode: dbData.currencyCode,
        currencyDecimals: dbData.currencyDecimals,
        thumbnailURL: dbData.thumbnailURL,
        storeURL: dbData.storeURL,
        endDate: dbData.endDate,
        added: dbData.added,
        deleted: dbData.deleted,
      },
    }

    if (deleted) {
      await deleteCollection.updateOne(filter, updateOrInsert, {upsert: true})
      resolve('')
    } else {
      const result = await gameCollection.findOneAndUpdate(filter, updateOrInsert, {upsert: true})
      if (result.lastErrorObject.upserted) {
        resolve('new')
      } else if (result.value.discount < dbData.discount) {
        resolve('higher')
      } else if (result.value.discount > dbData.discount) {
        resolve('lower')
      } else {
        resolve('')
      }
    }
  })
}

/**
 *
 */
export async function deleteFromMongo() {
  console.log('deleteFromMongo')
  await deleteCollection.deleteMany({deleted: {$lt: moment().subtract(expireThreshold, 'd').toDate()}})
}

/**
 *
 */
export async function moveGamesToDeleted() {
  const date = new Date()
  const findResult = await gameCollection.find().toArray()
  for (let i = 0; i < findResult.length; i++) {
    const x = findResult[i]
    let fine = true
    switch (x.store) {
      case 'epic':
        const endDate = new Date(x.endDate)
        if (endDate < date) {
          fine = false
        }
        break
      case 'steam':
        {
          const gameJson = await steam.fetchSteamIndivdualJson(x.id)
          if (gameJson) {
            const priceOverview = gameJson.price_overview

            if (priceOverview &&
              (priceOverview.discount_percent < steamGamePercentage || priceOverview.final == priceOverview.initial)) {
              fine = false
            }
          }
        }
        break
      case 'gog':
        {
          const gameJson = await gog.fetchGogIndividualJson(x.id)
          const originalPrice = parseInt(gameJson.basePrice)
          const discountPrice = parseInt(gameJson.finalPrice)

          if (discountPrice == originalPrice || Math.round((originalPrice - discountPrice) / originalPrice * 100) < gogGamePercentage) {
            fine = false
          }
        }
        break
      case 'ubisoft':
        {
          if (!await ubisoft.checkIfDiscounted(x)) {
            fine = false
          }
        }
        break
      default:
        break
    }
    if (fine) {
      log((i+1)+'/'+findResult.length + ' fine ' + x.store + ' ' + x.title)
      continue
    }
    x.deleted = new Date()
    await writeInMongo(x, true)
    await gameCollection.deleteOne({id: x.id})
  }
}

/**
 *
 * @param {string} shop Selected shop
 * @param {number} page current page
 * @param {number} sort how to sort
 * @param {boolean} asc true/false
 * @return {any}
 */
export async function getGamesFromMongo(shop, page, sort, asc) {
  let sortBy = 'title'
  switch (parseInt(sort)) {
    case 1:
      sortBy = 'originalPrice'
      break
    case 2:
      sortBy = 'discountPrice'
      break
    case 3:
      sortBy = 'discountPercent'
      break
    case 4:
      sortBy = 'added'
      break
    default:
      break
  }

  const findResult = await gameCollection.find({'store': shop}, {
    sort: {[sortBy]: asc === 'true' ? 1 : -1, title: asc === 'true' ? 1 : -1},
    limit: gamesPerPage,
    skip: gamesPerPage * (page-1),
  }).toArray()
  return findResult
}

/**
 *
 * @param {number} page current page
 * @param {number} sort how to sort
 * @param {boolean} asc true/false
 * @return {any}
 */
export async function getDeletedGamesFromMongo(page, sort, asc) {
  let sortBy = 'title'
  switch (parseInt(sort)) {
    case 1:
      sortBy = 'originalPrice'
      break
    case 3:
      sortBy = 'discountPercent'
      break
    case 5:
      sortBy = 'deleted'
      break
    default:
      break
  }

  const findResult = await deleteCollection.find({}, {
    sort: {[sortBy]: asc === 'true' ? 1 : -1, title: asc === 'true' ? 1 : -1},
    limit: gamesPerPage,
    skip: gamesPerPage * (page-1),
  }).toArray()
  return findResult
}

/**
 *
 * @param {string} shop
 * @param {boolean} deleted
 * @return {number}
 */
export async function getPagesFromMongo(shop, deleted) {
  if (deleted) {
    const findResult = await deleteCollection.find().toArray()
    return findResult.length > 0 ? Math.ceil(findResult.length / gamesPerPage) : 1
  }
  const findResult = await gameCollection.find({'store': shop}).toArray()
  return findResult.length > 0 ? Math.ceil(findResult.length / gamesPerPage) : 1
}

/**
 *
 * @param {string} search
 * @return {any}
 */
export async function searchInMongo(search) {
  const query = {'title': new RegExp('.*'+search+'.*', 'i')}
  const findResult = await gameCollection.find(query).toArray()
  return findResult
}
