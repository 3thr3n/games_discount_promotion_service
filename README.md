# Games discount promotions service

This service is an gamestore-api-scraper, currenty for Epicgames, Steam and gog.  
It will find any discount on the shop-page. (Demos are excluded)

  - **Epicgames**:  
    Desc: Gets all discounts without filtering  
    Execution Time: ca. 1 min
  - **Steam**:  
    Desc: Gets only discounts which are over the specified threshold in .env-file  
    The API is limited to 100 requests per minute so it takes a while to scrap through ca. 10-20 min.
  - **Gog**:  
    Desc: Like Steam it takes a while, because of request limits, but the Gog-API is better structured then the Steam-API  
    Execution Time: ca. 5 min

Default is to write the discount promotions only into the console, but if an `Telegram-Bot-Token` and `ChatID` are supplied it will also send these per telegram to the chatid.  

The service checks also if the discount changed, so it will also send a notification. 

The Epic API provides an enddate to the discount promotion, it will automatically deleted from the DB (Every day at 01:00).

## How To start

### Creating from scratch
 - Create a folder called `db`, there will be saved the `db.json` 
 - Copy the `.env_template` and rename it to `.env` and edit it to your needs
 - Run `npm install`
 - Start these in dev-mode run `npm run dev`
 
To build the docker-image use `docker-compose build`

### Using Docker
 - Copy the `.env_template` and rename it to `.env` and edit it to your needs
 - Run `docker-compose up -d`


### Telegram
If you want an working telegram group or chat you need a `Telegram-Bot-Token` and a `ChatID`. How to setup such thing, tutorials are given in the internet.  

```
# Technical
Telegram has also an request limit for 20 requests per minute.  
Each game which found is send with an delay of 3 seconds.
```