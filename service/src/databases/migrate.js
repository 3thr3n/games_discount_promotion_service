import {mongodbEnabled, lowdbFile} from '../utils/variables.js'
import {connectToMongo, writeInMongo} from './mongoHandler.js'
import fs from 'fs'
import log from '../utils/log.js'

init()

/**
 *
 */
async function init() {
  if (mongodbEnabled) {
    try {
      const rawdata = fs.readFileSync(lowdbFile)
      const lowdbData = JSON.parse(rawdata)

      if (!lowdbData) {
        return
      }

      await connectToMongo()

      for (let i = 0; i < lowdbData.games.length; i++) {
        const game = lowdbData.games[i]
        await writeInMongo(game)
      }
      for (let i = 0; i < lowdbData.deleted.length; i++) {
        const game = lowdbData.deleted[i]
        await writeInMongo(game, true)
      }

      fs.unlinkSync(lowdbFile)
    } catch (error) {
      log('Nothing to migrate!')
    }
  }
}

