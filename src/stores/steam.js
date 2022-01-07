import https from 'https'

import {steamAPIURL, steamStoreURL, locale, steamGamePrice, steamGamePercentage} from '../variables.js'

export default class Steam {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Gets from the Steam-API all games as JSON
   *
   * @return {Promise<JSON>} a JSON with all games (id + name)
   */
  fetchSteamJson() {
    return new Promise((resolve, reject) => {
      console.debug('Running fetchSteamJson')
      const options = {
        hostname: steamAPIURL,
        port: 443,
        path: '/ISteamApps/GetAppList/v0002/?format=json',
        method: 'GET',
      }
      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (d) => {
          body += d
        })

        res.on('end', () => {
          try {
            const steamGamesJson = JSON.parse(body)
            resolve(steamGamesJson.applist.apps)
          } catch (error) {
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            console.error('Error: ' + error)
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            reject(error)
          }
        })
      })
      req.on('error', (error) => {
        reject(error)
      })
      req.end()
    })
  }

  /**
   * Uses the JSON from the Steam API to get all game-ids and concated these to an acceptable request size (800 ids per request)
   *
   * @param {JSON} gameData json with many items, which contains name + id of game
   * @return {Promise<String[]>} list of concated ids
   */
  processSteamJson(gameData) {
    return new Promise((resolve) => {
      console.debug('- Running processSteamJson')
      const appidConcatArray = []
      let appidConcat = ''

      gameData.forEach((game, i) => {
        const name = String(game.name)
        if (name.length > 0 && !name.match('demo')) {
          appidConcat += game.appid + ','
          if (i != 0 && i % 800 == 0) {
            appidConcatArray.push(appidConcat)
            appidConcat = ''
          }
        }
      })
      resolve(appidConcatArray)
    })
  }

  /**
   * With the concated ids, the function makes an request
   * against the API for the prices of these ids
   *
   * @param {String} appids concated string of ids
   * @return {JSON} a JSON of prices for the specified ids
   */
  fetchSteamCashJson(appids) {
    return new Promise((resolve, reject) => {
      console.debug('-- Running fetchSteamCashJson')
      const options = {
        hostname: steamStoreURL,
        port: 443,
        path: '/api/appdetails?cc=' + locale + '&l=' + locale + '&filters=price_overview&appids=' + appids,
        method: 'GET',
      }
      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (d) => {
          body += d
        })

        res.on('end', () => {
          try {
            const steamStoreCashJson = JSON.parse(body)
            resolve(steamStoreCashJson)
          } catch (error) {
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            console.error('Error: ' + error)
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          }
        })
      })
      req.on('error', (error) => {
        reject(error)
      })
      req.end()
    })
  }

  /**
   * Checks the inputed JSON, if the game has the correct properties to get displayed
   *
   * @param {JSON} cashData JSON to check prices and percentage
   * @return {Promise<String[]>} a List of Strings with ids from games
   */
  processSteamCashJson(cashData) {
    return new Promise((resolve) => {
      console.debug('--- Running processSteamCashJson')
      const discounts = []
      Object.keys(cashData).forEach(function(k, v) {
        const gameAppID = cashData[k]
        if (gameAppID.data !== undefined && gameAppID.data.price_overview !== undefined) {
          const gameAppIDCash = gameAppID.data.price_overview
          if (gameAppIDCash.initial >= steamGamePrice && gameAppIDCash.discount_percent >= steamGamePercentage) {
            discounts.push(k)
          }
        }
      })
      resolve(discounts)
    })
  }

  /**
   * Gets data for the game-id and returns these
   *
   * @param {String} appid id of game
   * @return {Promise<JSON>} a JSON with data from game
   */
  fetchSteamIndivdualJson(appid) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: steamStoreURL,
        port: 443,
        path: '/api/appdetails?cc=' + locale + '&l=' + locale + '&appids=' + appid,
        method: 'GET',
      }
      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (d) => {
          body += d
        })

        res.on('end', () => {
          try {
            const steamStoreGameJson = JSON.parse(body)
            const game = steamStoreGameJson[appid]
            const gameSuccess = game.success
            if (gameSuccess) {
              resolve(game.data)
            }
          } catch (error) {
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            console.error('Error: ' + error)
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            reject(error)
          }
        })
      })
      req.on('error', (error) => {
        reject(error)
      })
      req.end()
    })
  }

  /**
   * Prepares a JSON for input into the database
   *
   * @param {JSON} json gameData-JSON
   * @return {JSON} prepared JSON for Database
   */
  processSteamGameJson(json) {
    return {
      store: 'steam',
      title: json.name,
      id: json.steam_appid,
      sellerName: json.publishers[0],
      originalPrice: json.price_overview.initial,
      discountPrice: json.price_overview.final,
      discountPercent: json.price_overview.discount_percent,
      discount: json.price_overview.initial - json.price_overview.final,
      currencyCode: json.price_overview.currency,
      currencyDecimals: 2,
      thumbnailURL: json.header_image,
      storeURL: 'https://'+steamStoreURL+'/app/'+json.steam_appid,
    }
  }
}
