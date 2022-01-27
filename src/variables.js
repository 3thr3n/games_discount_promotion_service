import dotenv from 'dotenv'
dotenv.config()

// import json
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
export const defaults = require('../defaults.json')

export const timezone = process.env.TIMEZONE || defaults.timezone
export const timezoneLocale = process.env.TIMEZONE_LOCALE || defaults.timezone_locale
export const hour12 = process.env.HOUR_12 || defaults['12Hour']

export const locale = process.env.LOCALE || defaults.locale
export const country = process.env.COUNTRY || defaults.country
export const cron = '0 0 ' + (process.env.CRON || defaults.cron)

export const epicEnabled = process.env.EPIC_ENABLED === 'true' || false
export const epicAPIURL = defaults.epic_api_url
export const epicStoreURL = defaults.epic_store_url

export const steamEnabled = process.env.STEAM_ENABLED === 'true' || false
export const steamGamePrice = process.env.STEAM_GAME_PRICE || defaults.steam_game_price
export const steamGamePercentage = process.env.STEAM_GAME_PERCENTAGE || defaults.steam_game_percentage
export const steamStoreURL = defaults.steam_store_url
export const steamAPIURL = defaults.steam_api_url

export const gogEnabled = process.env.GOG_ENABLED === 'true' || false
export const gogCurrency = process.env.GOG_CURRENCY || defaults.gog_currency
export const gogGamePrice = process.env.GOG_GAME_PRICE || defaults.gog_game_price
export const gogGamePercentage = process.env.GOG_GAME_PERCENTAGE || defaults.gog_game_percentage
export const gogStoreURL = defaults.gog_store_url
export const gogAPIURL = defaults.gog_api_url
export const gogImageURL = defaults.gog_image_url

export const ubisoftEnabled = process.env.UBISOFT_ENABLED === 'true' || false
export const ubisoftGamePrice = process.env.UBISOFT_GAME_PRICE || defaults.ubisoft_game_price
export const ubisoftGamePercentage = process.env.UBISOFT_GAME_PERCENTAGE || defaults.ubisoft_game_percentage

export const expireThreshold = process.env.EXPIRE_THRESHOLD || defaults.expire_threshold
