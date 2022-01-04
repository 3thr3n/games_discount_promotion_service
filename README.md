# Games discount promotions service

This Service will send notifications to the user/group.  
Notifications are reaching from discount to completly free games.  

It will also check if the discount changed, so it will also send a notification if it has changed.  
When the discount ended (there is a endDate through the API), it will automatically deleted from the DB (Every day at 00:00).

## How To start

### Creating from scratch
 - Create a folder called `db`, there will be saved the `db.json` 
 - Copy the `.env_template` and rename it to `.env` and edit it to your needs
 - Run `npm install`
 - Start these in dev-mode run `npm run dev`
 
To build the docker-image use `docker-compose build`

### Using Docker
 - Run `docker-compose up -d`
