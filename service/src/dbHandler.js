import {mongodbEnabled} from './variables.js'

import {prepareWriteToDB, checkDB, deleteDB, writeToDB, getGameData,
  getGameDataPages, getSearchData, getRecentlyDeletedGames, getRecentlyDeletedGamesPages} from './databases/lowDbHandler.js'
import {connectToMongo} from './databases/mongoHandler.js'

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
    console.log('getGamesFromDatabase')
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
    console.log('getGamePagesFromDatabase')
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
    console.log('getDeletedGamesFromDatabase')
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
    console.log('getDeletedGamePagesFromDatabase')
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
    console.log('searchInDatabase')
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
    console.log('prepareWrite')
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
  if (mongodbEnabled) {
    console.log('cleanupDatabase')
  } else {
    await deleteDB(startAt)
  }
}
