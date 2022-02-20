import {timezoneLocale, timezone, hour12} from './variables.js'

// Telegram-BOT
import TelegramBot from 'node-telegram-bot-api'
const token = process.env.TELEGRAM_BOT_TOKEN
const chatID = process.env.TELEGRAM_CHATID
let bot
if (token !== undefined && chatID !== undefined && token.length > 0 && chatID != 0) {
  bot = new TelegramBot(token, {polling: false})
}

/**
 * Writes a message to the console and if provided also to a chat in Telegram
 *
 * @param {JSON} dbData a JSON of game-data
 * @param {String} changes (new/higher/lower)
 */
export async function sendMessage(dbData, changes) {
  const message =
  '========================================================================\n' +
  '  Store: ' + dbData.store + '\n' +
  '\n' +
  '  ' + dbData.title + ' from ' + dbData.sellerName + '\n' +
  '  ' + (changes === 'new' ? 'NEW' :
            changes === 'higher' ? 'Update (Discount is now higher)' :
              changes === 'lower' ? 'Update (Discount is now lower)' : '') + '\n' +
  '\n' +
  '  ' + 'Original price: ' + dbData.originalPrice/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
  '  ' + 'Discount price: ' + dbData.discountPrice/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
  '  ' + 'Discount: -' + dbData.discount/Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + ' ' +
    (dbData.discountPercent !== undefined ?
      '(~' + dbData.discountPercent + '%)' :
      '(~' + Math.round(dbData.discount / dbData.originalPrice * 100) + '%)') + '\n' +
  (
  dbData.store === 'epic' ?
  '\n' +
  '  ' + 'Getting key: ' + dbData.codeRedemptionOnly + '\n' +
  '  ' + 'Ends on : ' +
    new Date(dbData.endDate).toLocaleString(timezoneLocale,
        {
          timeZone: timezone,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour12: (hour12==='true'),
          hour: '2-digit',
          minute: '2-digit',
        }) + '\n' : '' ) +
  '\n' +
  '  ' + dbData.store + ' store url: ' + dbData.storeURL + '\n' +
  '========================================================================'

  console.info(message)
  const response = await sendTelegramMessage(dbData, changes)

  if (bot === undefined) {
    return false
  }
  return response === false || response !== undefined
}

/**
 * Writes a message, with the store and how many discounts they have
 *
 * @param {String} store which store
 * @param {Integer} items how many messages
 */
export async function sendMessageToMany(store, items) {
  const message =
  '========================================================================\n' +
  '  More than 30(' + items + ') deals at once at ' + store + '\n' +
  '========================================================================'
  console.info(message)
  await sendTelegramMessageToMany(store, items)
}

/**
 * Writes if possible a message to telegram-chat
 *
 * @param {JSON} dbData a JSON of game-data
 * @param {String} changes (new/higher/lower)
 */
async function sendTelegramMessage(dbData, changes) {
  if (bot === undefined) {
    return false
  }

  const message =
    '*Store: ' + dbData.store + '*\n' +
    '\n' +
    '[' + dbData.title + ' from ' + dbData.sellerName + '](' + dbData.storeURL + ')\n' +
    (changes === 'new' ? '_NEW_' :
      changes === 'higher' ? '_Update (Discount is now higher)_' :
        changes === 'lower' ? '_Update (Discount is now lower)_' : '') + '\n' +
    '[ ](' + dbData.thumbnailURL + ')\n' +
    '  ' + 'Original price: ' + dbData.originalPrice / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
    '  ' + 'Discount price: ' + dbData.discountPrice / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + '\n' +
    '  ' + 'Discount: -' +dbData.discount / Math.pow(10, dbData.currencyDecimals) + ' ' + dbData.currencyCode + ' ' +
      (dbData.discountPercent !== undefined ?
        '(~' + dbData.discountPercent + '%)' :
        '(~' + Math.round((dbData.discount / dbData.originalPrice) * 100) + '%)') + '\n' +
    (
      dbData.store === 'epic' ?
      '\n' +
      '  ' + 'Getting key: ' + dbData.codeRedemptionOnly + '\n' +
      '  ' + 'Ends on : ' + new Date(dbData.endDate).toLocaleString(timezoneLocale,
          {
            timeZone: timezone,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour12: hour12 === 'true',
            hour: '2-digit',
            minute: '2-digit',
          }) : ''
    )

  return await bot.sendMessage(chatID, message, {parse_mode: 'markdown'}).catch((error) => {
    console.error(error.code)
    console.error(error.response)
  })
}

/**
 * Sends a message to telegram if possible
 *
 * @param {String} store which store
 * @param {Integer} items how many messages
 * @return {Boolean} could be sent?
 */
async function sendTelegramMessageToMany(store, items) {
  if (bot === undefined) {
    return false
  }
  const message =
  '*Aborted for store "'+store+'"*\n' +
  '\n' +
  'There are more than 30 deals for this store: _' + items + '_'
  await bot.sendMessage(chatID, message, {parse_mode: 'markdown'}).catch((error) => {
    console.error(error.code)
    console.error(error.response)
  })
}
