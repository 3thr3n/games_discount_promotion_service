import https from 'https'

export default class Epic {
  constructor() {}

  /**
   * 
   * @param {String} epicgamesURL Epicgames API URL
   * @param {String} locale global defined locale
   * @param {String} country gobal defined country
   * @returns 
   */
  fetchEpicJson(epicgamesURL, locale, country) {
    return new Promise((resolve, reject) => {
      console.debug('Running fetchEpicJson')
      const options = {
        hostname: epicgamesURL,
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
   * 
   * @param {any} gameData Element from method "fetchEpicJson"
   * @param {String} epicgamesStoreURL Epicgames Store URL
   * @param {String} locale global defined locale
   * @param {String} country gobal defined country
   * @returns
   */
  processEpicJson(gameData, epicgamesStoreURL, locale, country) {
    console.debug('- Running fetchEpicJson')
    const listDbData = []
    for (let i = 0; i < gameData.length; i++) {
      const {title, id, status, isCodeRedemptionOnly, seller, price, keyImages, urlSlug} = gameData[i]
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
        storeURL: epicgamesStoreURL+urlSlug+'?lang='+locale+'-'+country,
        endDate: endDates.length > 1 ? endDates : endDates[0],
      }
      listDbData.push(dbData)
    }
    return listDbData
  }
}