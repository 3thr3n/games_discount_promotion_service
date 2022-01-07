import https from 'https'

import {country, timezoneLocale, gogAPIURL, gogImageURL, gogCurrency} from '../variables.js'

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
      console.debug('Running fetchGogJson')
      const options = {
        hostname: gogAPIURL,
        port: 443,
        path: '/games/ajax/filtered?mediaType=game&price=discounted&page='+page,
        method: 'GET',
        headers: {'Cookie':'gog_lc='+country+'_'+gogCurrency+'_'+timezoneLocale}
      }

      const req = https.request(options, (res) => {
        let body = ''

        res.on('data', (d) => {
          body += d
        })

        res.on('end', async () => {
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
  processGogGameJson(json) {
    const originalPrice = Math.round(parseFloat(json.price.baseAmount)*100)
    const discountPercent = Math.round(parseFloat(json.price.discount))
    if (originalPrice < 1499 || discountPercent < 20) {
      return 
    }

    const regex = new RegExp("(?://.*)(/.*)", 'gm')
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
      thumbnailURL: "https://"+gogImageURL+(regexResult[1])+"_product_card_v2_mobile_slider_639.jpg",
      storeURL: 'https://'+gogAPIURL+json.url,
    }
  }
}