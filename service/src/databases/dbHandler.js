import {mongodbEnabled} from '../utils/variables.js'

import {prepareWriteToDB, checkDB, deleteDB, writeToDB, getGameData,
  getGameDataPages, getSearchData, getRecentlyDeletedGames, getRecentlyDeletedGamesPages} from './lowDbHandler.js'
import {connectToMongo, writeInMongo, getGamesFromMongo,
  getPagesFromMongo, searchInMongo, deleteFromMongo, moveGamesToDeleted, getDeletedGamesFromMongo} from './mongoHandler.js'

await connectDB()

/**
 *
 */
async function connectDB() {
  if (mongodbEnabled) {
    await connectToMongo()
  } else {
    await checkDB()
  }
}

/**
 *
 * @param {string} store
 * @param {number} page
 * @param {string} sort
 * @param {boolean} asc
 * @return {Promise<any>}
 */
export async function getGamesFromDatabase(store, page, sort, asc) {
  if (mongodbEnabled) {
    return await getGamesFromMongo(store, page, sort, asc)
  } else {
    return await getGameData(store, page, sort, asc)
  }
}

/**
 *
 * @param {string} store Selected store
 * @return {Promise<number>}
 */
export async function getGamePagesFromDatabase(store) {
  if (mongodbEnabled) {
    return await getPagesFromMongo(store)
  } else {
    return await getGameDataPages(store)
  }
}

/**
 *
 * @param {number} page
 * @param {string} sort
 * @param {boolean} asc
 * @return {Promise<any>}
 */
export async function getDeletedGamesFromDatabase(page, sort, asc) {
  if (mongodbEnabled) {
    return await getDeletedGamesFromMongo(page, sort, asc)
  } else {
    return await getRecentlyDeletedGames(page, sort, asc)
  }
}

/**
 *
 * @return {Promise<any>}
 */
export async function getDeletedGamePagesFromDatabase() {
  if (mongodbEnabled) {
    return await getPagesFromMongo('', true)
  } else {
    return await getRecentlyDeletedGamesPages()
  }
}

/**
 *
 * @param {string} query Query
 * @return {Promise<any>}
 */
export async function searchInDatabase(query) {
  if (mongodbEnabled) {
    return await searchInMongo(query)
  } else {
    return await getSearchData(query)
  }
}

/**
 *
 * @param {*} dbData
 * @return {Promise<any>} JSON-data to write in database
 */
export async function prepareWrite(dbData) {
  if (mongodbEnabled) {
    return await writeInMongo(dbData)
  } else {
    return await prepareWriteToDB(dbData)
  }
}

/**
 * @return {any}
 */
export function writeDatabase() {
  if (!mongodbEnabled) {
    return writeToDB()
  }
}

/**
 *
 * @param {number} startAt start deletetion at position x
 */
export async function cleanupDatabase(startAt) {
  console.log('cleanupDatabase')
  if (mongodbEnabled) {
    await deleteFromMongo()
    await moveGamesToDeleted()
  } else {
    await deleteDB(startAt)
  }
}
