import dotenv from 'dotenv'
dotenv.config()

import {env} from 'process'

// import json
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
export const defaults = require('../defaults.json')

export const timezone = env.TIMEZONE || defaults.timezone
export const timezoneLocale = env.TIMEZONE_LOCALE || defaults.timezone_locale
export const hour12 = env.HOUR_12 || defaults['12Hour']

export const locale = env.LOCALE || defaults.locale
export const country = env.COUNTRY || defaults.country
export const cron = '0 0 ' + (env.CRON || defaults.cron)

export const epicEnabled = env.EPIC_ENABLED === 'true' || false
export const epicAPIURL = defaults.epic_api_url
export const epicStoreURL = defaults.epic_store_url

export const steamEnabled = env.STEAM_ENABLED === 'true' || false
export const steamGamePrice = env.STEAM_GAME_PRICE || defaults.steam_game_price
export const steamGamePercentage = env.STEAM_GAME_PERCENTAGE || defaults.steam_game_percentage
export const steamStoreURL = defaults.steam_store_url
export const steamAPIURL = defaults.steam_api_url

export const gogEnabled = env.GOG_ENABLED === 'true' || false
export const gogCurrency = env.GOG_CURRENCY || defaults.gog_currency
export const gogGamePrice = env.GOG_GAME_PRICE || defaults.gog_game_price
export const gogGamePercentage = env.GOG_GAME_PERCENTAGE || defaults.gog_game_percentage
export const gogStoreURL = defaults.gog_store_url
export const gogAPIURL = defaults.gog_api_url
export const gogImageURL = defaults.gog_image_url

export const ubisoftEnabled = env.UBISOFT_ENABLED === 'true' || false
export const ubisoftGamePrice = env.UBISOFT_GAME_PRICE || defaults.ubisoft_game_price
export const ubisoftGamePercentage = env.UBISOFT_GAME_PERCENTAGE || defaults.ubisoft_game_percentage

export const expireThreshold = env.EXPIRE_THRESHOLD || defaults.expire_threshold

export const mongodbEnabled = env.MONGO_ENABLED === 'true' || false

const mongodbHost = env.MONGO_HOST || 'localhost'
const mongodbPort = env.MONGO_PORT || 27017
const mongodbUser = env.MONGO_USER || 'root'
const mongodbPass = env.MONGO_PASS || 'mongodb'
export const mongodbUrl = 'mongodb://'+mongodbUser+':'+mongodbPass+'@'+mongodbHost+':'+mongodbPort+''

export const gamesPerPage = defaults.games_per_page

export const debugSkipDelete = env.DEBUG_SKIP_DELETE === 'true' || false
export const debugSkipStores = env.DEBUG_SKIP_STORES === 'true' || false

export const lowdbFile = defaults.lowdbFile
