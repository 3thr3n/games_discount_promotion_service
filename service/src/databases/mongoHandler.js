import {MongoClient} from 'mongodb'
import {mongodbUrl} from '../variables.js'

const client = new MongoClient(mongodbUrl)
let gameCollection = undefined

/**
 *
 */
export async function connectToMongo() {
  return client.connect().then(() => {
    console.log('Connected successfully to server')
    const db = client.db('gdps')
    gameCollection = db.collection('games')
    return true
  }).catch(() => {
    return false
  })
}

/**
 *
 * @param {string} shop selectedShop
 */
export async function loadShopData(shop) {
  if (gameCollection) {
    const findResult = await gameCollection.find({'shop': shop}).toArray()
    console.log('Found games => ', findResult)
  }
}
