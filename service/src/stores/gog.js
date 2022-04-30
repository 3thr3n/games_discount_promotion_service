import https from 'https'
import log from '../utils/log.js'

import {country, timezoneLocale, gogStoreURL, gogImageURL,
  gogCurrency, gogGamePrice, gogGamePercentage, gogAPIURL} from '../utils/variables.js'

export default class Gog {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Fetches all games from GOG-API
   * If page is `1` then it will recursive load all others too
   *
   * @param {number} page which page will be loaded
   * @return {Promise<JSON>} a JSON of discounted games
   */
  fetchGogJson(page) {
    return new Promise((resolve, reject) => {
      log('GOG * Running fetchGogJson, Page: '+page)
      const options = {
        hostname: gogStoreURL,
        port: 443,
        path: '/games/ajax/filtered?mediaType=game&price=discounted&page='+page,
        method: 'GET',
        headers: {'Cookie': 'gog_lc='+country+'_'+gogCurrency+'_'+timezoneLocale},
        timeout: 3000,
      }

      const req = https.request(options, (res) => {
        let body = ''

        res.on('data', (d) => {
          body += d
        })

        res.on('end', async () => {
          try {
            const gogJson = JSON.parse(body)
            if (page != 1) {
              resolve(gogJson.products)
            } else {
              let products = gogJson.products
              for (let i = 2; i <= parseInt(gogJson.totalPages); i++) {
                products = products.concat(await this.fetchGogJson(i))
              }
              resolve(products)
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
      req.on('timeout', (e) => {
        reject(e)
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
  processGogGameJson(json) {
    log('GOG * Running processGogGameJson, Game: ' + json.title)
    const originalPrice = Math.round(parseFloat(json.price.baseAmount)*100)
    const discountPercent = Math.round(parseFloat(json.price.discount))
    if (originalPrice < gogGamePrice || discountPercent < gogGamePercentage) {
      return
    }

    const regex = new RegExp('(?://.*)(/.*)', 'gm')
    const regexResult = regex.exec(String(json.image))
    return {
      store: 'gog',
      title: json.title,
      id: json.id,
      sellerName: json.publisher,
      originalPrice,
      discountPrice: Math.round(parseFloat(json.price.finalAmount)*100),
      discountPercent,
      discount: Math.round(parseFloat(json.price.discountDifference)*100),
      currencyCode: json.price.symbol,
      currencyDecimals: 2,
      thumbnailURL: 'https://'+gogImageURL+(regexResult[1])+'.jpg',
      storeURL: 'https://'+gogStoreURL+json.url,
      added: new Date(),
    }
  }

  /**
   * Gets for the specified id the prices and returns these as JSON
   *
   * @param {string} appid id of game
   * @return {Promise<JSON>} a JSON with prices
   */
  fetchGogIndividualJson(appid) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: gogAPIURL,
        port: 443,
        path: '/products/'+appid+'/prices?countryCode='+country+'&currency='+gogCurrency,
        method: 'GET',
        timeout: 3000,
      }

      const req = https.request(options, (res) => {
        let body = ''

        res.on('data', (d) => {
          body += d
        })

        res.on('end', async () => {
          try {
            const gogJson = JSON.parse(body)
            resolve(gogJson['_embedded'].prices[0])
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
      req.on('timeout', (e) => {
        reject(e)
      })
      req.end()
    })
  }
}
