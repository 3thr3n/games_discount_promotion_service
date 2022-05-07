import https from 'https'
import log from '../utils/log.js'

import {country, locale, epicAPIURL, epicStoreURL, epicGamePrice, epicGamePercentage} from '../utils/variables.js'

export default class Epic {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Gets from the Epic-API a list of discounted games
   *
   * @param {number} start
   * @return {Promise<JSON>} a JSON with all discounted games
   */
  fetchEpicJson(start) {
    return new Promise((resolve, reject) => {
      log('EPIC * Running fetchEpicJson')
      const variables = {
        allowCountries: country,
        commingSoon: false,
        count: 40,
        country,
        locale,
        onSale: true,
        start,
        priceRange: '['+epicGamePrice+',]',
        withPrice: true,
      }

      const options = {
        hostname: epicAPIURL,
        port: 443,
        path: '/graphql?operationName=searchStoreQuery&variables=' + JSON.stringify(variables) + '&' +
              'extensions={"persistedQuery":{"version":1,"sha256Hash":"13a2b6787f1a20d05c75c54c78b1b8ac7c8bf4efc394edf7a5998fdf35d1adb0"}}',
        method: 'GET',
        timeout: 3000,
      }

      const req = https.request(options, (res) => {
        let body = ''

        res.on('data', (d) => {
          body += d
        })

        res.on('end', async () => {
          start = start + 40
          try {
            const epicgamesJson = JSON.parse(body)
            const searchStore = epicgamesJson.data.Catalog.searchStore
            const data = searchStore.elements
            if (searchStore.paging.total > start) {
              const items = await this.fetchEpicJson(start)
              for (let i = 0; i < items.length; i++) {
                data.push(items[i])
              }
            }
            resolve(data)
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
   * Takes an list of discounted games and creates out of that an list of JSON for the database
   *
   * @param {JSON[]} gameData List of discounted games
   * @return {Promise<JSON[]>} prepared JSON for Database
   */
  processEpicJson(gameData) {
    log('EPIC * Running processEpicJson')
    const listDbData = []
    for (let i = 0; i < gameData.length; i++) {
      const {
        title,
        id,
        isCodeRedemptionOnly,
        seller,
        price,
        keyImages,
        productSlug,
        offerMappings,
        catalogNs,
        categories,
        namespace,
      } = gameData[i]
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
      let productUrl = ''
      if (productSlug) {
        productUrl = productSlug.replace('/home', '')
      } else if (offerMappings && offerMappings.length > 0) {
        offerMappings.forEach((offer) => {
          if (offer.pageSlug) {
            productUrl = offer.pageSlug
            return
          }
        })
      } else if (catalogNs && catalogNs.mappings && catalogNs.mappings.find((x) => x.pageSlug)) {
        productUrl = catalogNs.mappings.find((x) => x.pageSlug).pageSlug
      }
      if (!productUrl) {
        continue
      }

      if (!categories.find((x) => x.path === 'games' || x.path === 'addons')) {
        continue
      }

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

      const discountPercent = Math.round(Math.floor(discount/originalPrice*100))
      if (discountPercent < epicGamePercentage) {
        continue
      }

      const dbData = {
        store: 'epic',
        title,
        id,
        namespace,
        codeRedemptionOnly: isCodeRedemptionOnly ? true : false,
        sellerName,
        originalPrice,
        discount,
        discountPrice,
        discountPercent,
        currencyCode,
        currencyDecimals,
        thumbnailURL,
        storeURL: epicStoreURL+productUrl+'?lang='+locale+'-'+country,
        endDate: endDates.length > 1 ? endDates : endDates[0],
        added: new Date(),
      }
      listDbData.push(dbData)
    }
    return listDbData
  }

  /**
   *
   * @param {string} id gameId
   * @param {string} namespace game namespace
   * @return {Promise<any>}
   */
  fetchEpicSingleGame(id, namespace) {
    return new Promise((resolve, reject) => {
      log('EPIC * Running fetchEpicSingleGame')
      const variables = {
        country,
        locale,
        sandboxId: namespace,
        offerId: id,
      }

      const options = {
        hostname: epicAPIURL,
        port: 443,
        path: '/graphql?operationName=getCatalogOffer&variables=' + JSON.stringify(variables) + '&' +
              'extensions={"persistedQuery":{"version":1,"sha256Hash":"ff096572d1065b7058e64c86ce4630bfb5727955056fe910b3f29cb50568fdd7"}}',
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
            const epicgamesJson = JSON.parse(body)
            const searchStore = epicgamesJson.data.Catalog.searchStore
            resolve(searchStore.elements)
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
