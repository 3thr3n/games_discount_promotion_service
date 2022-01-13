import https from 'https'

import {country, locale, epicAPIURL, epicStoreURL} from '../variables.js'

export default class Epic {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Gets from the Epic-API a list of discounted games
   *
   * @return {JSON} a JSON with all discounted games
   */
  fetchEpicJson() {
    return new Promise((resolve, reject) => {
      console.debug('Running fetchEpicJson')
      const options = {
        hostname: epicAPIURL,
        port: 443,
        path: '/freeGamesPromotions?locale=' + locale + '&country=' + country,
        method: 'GET',
      }

      const req = https.request(options, (res) => {
        let body = ''

        res.on('data', (d) => {
          body += d
        })

        res.on('end', () => {
          const epicgamesJson = JSON.parse(body)
          resolve(epicgamesJson.data.Catalog.searchStore.elements)
        })
      })
      req.on('error', (error) => {
        reject(error)
      })
      req.end()
    })
  }

  /**
   * Takes an list of discounted games and creates out of that an list of JSON for the database
   *
   * @param {JSON[]} gameData List of discounted games
   * @return {Promise<JSON[]>} prepared JSON for Database
   */
  processEpicJson(gameData) {
    console.debug('- Running fetchEpicJson')
    const listDbData = []
    for (let i = 0; i < gameData.length; i++) {
      const {title, id, isCodeRedemptionOnly, seller, price, keyImages, productSlug} = gameData[i]
      const {originalPrice, discountPrice, discount, currencyCode, currencyInfo} = price.totalPrice

      if (originalPrice === 0 || discount === 0 || originalPrice === discountPrice) {
        continue
      }

      let thumbnailURL = ''
      keyImages.forEach((x) => {
        if (x.type === 'Thumbnail') {
          thumbnailURL = x.url
        }
      })
      
      const sellerName = seller.name
      const lineOffers = price.lineOffers
      const currencyDecimals = currencyInfo.decimals
      const productUrl = productSlug.replace("/home", "")

      const endDates = []
      lineOffers.forEach((x) => {
        if (x.appliedRules.length > 0) {
          x.appliedRules.forEach((y) => {
            if (y.endDate) {
              endDates.push(y.endDate)
            }
          })
        }
      })

      const dbData = {
        store: 'epic',
        title,
        id,
        codeRedemptionOnly: isCodeRedemptionOnly ? true : false,
        sellerName,
        originalPrice,
        discount,
        discountPrice,
        currencyCode,
        currencyDecimals,
        thumbnailURL,
        storeURL: epicStoreURL+productUrl+'?lang='+locale+'-'+country,
        endDate: endDates.length > 1 ? endDates : endDates[0],
      }
      listDbData.push(dbData)
    }
    return listDbData
  }
}
