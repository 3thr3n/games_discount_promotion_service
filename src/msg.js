import {timezoneLocale, timezone, hour12} from './variables.js'

// Telegram-BOT
import TelegramBot from 'node-telegram-bot-api'
const token = process.env.TELEGRAM_BOT_TOKEN
const chatID = process.env.TELEGRAM_CHATID
let bot
if (token !== undefined && chatID !== undefined && token.length > 0 && chatID != 0) {
  bot = new TelegramBot(token, {polling: false})
}

export function sendMessage(dbData, changes) {
  const message =
  '========================================================================\n' +
  '  Store: ' + dbData.store + '\n' +
  '\n' +
  '  ' + dbData.title + ' from ' + dbData.sellerName + '\n' +
  '  ' + (changes === 'new' ? 'NEW' : changes === 'higher' ? 'Update (Discount is now higher)' : 'Update (Discount is now lower)') + '\n' +
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
  sendTelegramMessage(dbData, changes)
}

function sendTelegramMessage(dbData, changes) {
  if (bot === undefined) {
    return
  }

  const message =
    '*Store: ' + dbData.store + '*\n' +
    '\n' +
    '[' + dbData.title + ' from ' + dbData.sellerName + '](' + dbData.storeURL + ')\n' +
    (changes === 'new' ? '_NEW_' : changes === 'higher' ? '_Update (Discount is now higher)_' : '_Update (Discount is now lower)_') + '\n' +
    '[  ](' + dbData.thumbnailURL + ')\n' +
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

  bot.sendMessage(chatID, message, {parse_mode: 'markdown'}).catch((error) => {
    console.error(error.code)
    console.error(error.response)
  })
}
