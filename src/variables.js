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
export const epicgamesURL = defaults.epic_api_url

export const steamEnabled = process.env.STEAM_ENABLED === 'true' || false
export const steamGamePrice = process.env.STEAM_GAME_PRICE || defaults.steam_game_price
export const steamGamePercentage = process.env.STEAM_GAME_PERCENTAGE || defaults.steam_game_percent
export const steamStoreURL = defaults.steam_store_url
export const steamAPIURL = defaults.steam_api_url
