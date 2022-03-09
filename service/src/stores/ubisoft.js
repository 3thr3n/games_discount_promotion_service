import {locale, ubisoftGamePercentage, ubisoftGamePrice} from '../variables.js'
import log from '../log.js'

import {parse} from 'node-html-parser'
import https from 'https'
import {decode} from 'html-entities'

export default class Ubisoft {
  /**
   * Gets from the ubisoft store site the complete html for 32 games
   *
   * @param {int} page
   * @return {List<HTMLElement>} a list of HTMLElement's
   */
  fetchUbisoftHtml(page) {
    return new Promise((resolve, reject) => {
      log('UBI * Running fetchUbisoftHtml, Page: ' + page)
      const options = {
        hostname: 'store.ubi.com',
        port: 443,
        path: '/' + locale + '/games?sz=32&format=page-element&start='+(32*(page-1)),
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
            const regexStyles = /<style\b[^>]*>([\s\S]*?)<\/style>/gm
            const regexG = /<g\b[^>]*>([\s\S]*?)<\/g>/gm
            const regexHead = /<head\b[^>]*>([\s\S]*?)<\/head>/gm
            const regexFooter = /<footer\b[^>]*>([\s\S]*?)<\/footer>/gm
            const regexSVG = /<svg\b[^>]*>([\s\S]*?)<\/svg>/gm

            body = body.replaceAll(/^\s+\n/gm, '')
            body = body.replaceAll(regexStyles, '')
            body = body.replaceAll(regexHead, '')
            body = body.replaceAll(regexG, '')
            body = body.replaceAll(regexSVG, '')
            body = body.replaceAll(regexFooter, '')

            const root = parse(body)
            let mainDiv = root.querySelectorAll('div.product-tile')
            if (mainDiv.length == 32) {
              const anotherPage = await this.fetchUbisoftHtml(page+1)
              mainDiv = mainDiv.concat(anotherPage)
            }
            resolve(mainDiv)
          } catch (error) {
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
   * Creates an Json from the HTMLElement
   *
   * @param {HTMLElement} gameHtml HTMLElement with all informations of the game
   * @return {JSON} a json, prepared for db
   */
  processUbisoftHtml(gameHtml) {
    return new Promise((resolve, reject) => {
      log('UBI * Running fetchUbisoftHtml')
      const list = []

      try {
        if (gameHtml.querySelector('span.price-item') === null) {
          reject(new Error('No discount'))
          return
        }

        // ID of Game
        const id = gameHtml.attributes['data-itemid']
        // Thumbnail Image
        const gameImage = gameHtml.querySelector('img.product_image')
        // Title of Game
        const gameTitle = decodeAndSanitize(gameHtml.querySelector('div.prod-title').innerHTML)
        // Subtitle of Game
        const gameSubtitle = ' - '+ decodeAndSanitize(gameHtml.querySelector('div.card-subtitle').innerHTML)

        // Original price
        const originalPriceString = decodeAndSanitize(gameHtml.querySelector('span.price-item').innerHTML)
        const originalPrice = Math.round(parseFloat(originalPriceString.replace(',', '.'))*100)
        const currencyCode = parseCurrencyCode(originalPriceString)

        // Discount price
        const discountPriceString = decodeAndSanitize(gameHtml.querySelector('span.price-sales').innerHTML)
        const discountPrice = Math.round(parseFloat(discountPriceString.replace(',', '.'))*100)

        // Discount
        const discount = originalPrice - discountPrice
        const discountPercent = Math.round(discount/originalPrice*100)

        if (discountPercent < ubisoftGamePercentage || originalPrice < ubisoftGamePrice) {
          reject(new Error('No discount'))
          return
        }

        // StoreUrl
        const storeURL = 'https://store.ubi.com/' + locale + '/game?pid=' + id

        const ubiGameJson = {
          store: 'ubisoft',
          title: gameTitle + gameSubtitle,
          id,
          sellerName: 'Ubisoft',
          originalPrice,
          discountPrice,
          discountPercent,
          discount,
          currencyCode,
          currencyDecimals: 2,
          thumbnailURL: gameImage.attributes['data-mobile-src'],
          storeURL,
          added: new Date(),
        }
        list.push(ubiGameJson)
      } catch (error) {
        console.error(error)
      }
      resolve(list)
    })
  }

  /**
   * Gets from an specific game all informations
   *
   * @param {JSON} gameJson
   * @return {HTMLElement} a HTMLELement with all Information about the game
   */
  fetchUbisoftSingleGame(gameJson) {
    return new Promise((resolve, reject) => {
      log('UBI * Running fetchUbisoftSingleGame')
      const options = {
        hostname: 'store.ubi.com',
        port: 443,
        path: '/' + locale + '/game?pid='+gameJson.id,
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
            const regexStyles = /<style\b[^>]*>([\s\S]*?)<\/style>/gm
            const regexG = /<g\b[^>]*>([\s\S]*?)<\/g>/gm
            const regexHead = /<head\b[^>]*>([\s\S]*?)<\/head>/gm
            const regexFooter = /<footer\b[^>]*>([\s\S]*?)<\/footer>/gm
            const regexSVG = /<svg\b[^>]*>([\s\S]*?)<\/svg>/gm

            body = body.replaceAll(/^\s+\n/gm, '')
            body = body.replaceAll(/^\n/gm, '')
            body = body.replaceAll(regexStyles, '')
            body = body.replaceAll(regexHead, '')
            body = body.replaceAll(regexG, '')
            body = body.replaceAll(regexSVG, '')
            body = body.replaceAll(regexFooter, '')

            const root = parse(body)
            const mainSection = root.querySelector('section.product-main-section')
            resolve(mainSection)
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
   * Checks if the given game is discounted
   *
   * @param {JSON} gameJson
   * @return {Boolean} a boolean if it's discounted or not
   */
  checkIfDiscounted(gameJson) {
    return new Promise(async (resolve, reject) => {
      log('UBI * Running checkIfDiscounted')
      const gameHtml = await this.fetchUbisoftSingleGame(gameJson)
      if (gameHtml !== null) {
        const priceItem = gameHtml.querySelector('span.price-item')

        if (priceItem === null) {
          resolve(false)
        } else {
          resolve(true)
        }
      }
      resolve(false)
    })
  }
}

/**
 * Decodes and trimmes a String and returns them
 *
 * @param {String} toDecode string to decode HTMl-Entities
 * @return {String} a decoded and trimmed string
 */
function decodeAndSanitize(toDecode) {
  return decode(toDecode.trim())
}

/**
 * Checks which currency is used and gets the
 *
 * @param {String} priceWithCode
 * @return {String} currencyCode
 */
function parseCurrencyCode(priceWithCode) {
  if (priceWithCode.includes('€')) {
    return priceWithCode.substring(priceWithCode.length-1, priceWithCode.length)
  }
  if (priceWithCode.includes('$')) {
    return priceWithCode.substring(0, 1)
  }
  return ''
}
