<template>
  <v-container>
      <v-row class="text-center">
        <v-col class="mb-4">
          <h1 class="display-2 font-weight-bold mb-3">
            {{ myData.shop }} discount-promotions
          </h1>
        </v-col>
      </v-row>
      <v-row>
        <v-card width="390" class="mx-auto mt-5" v-for="game in games" :key="game.id" :href="game.storeURL" target="_blank">
            <v-list outlined height="100%">
              <v-img :src="game.thumbnailURL" contain height="250px" dark />
              <v-card-title v-text="game.title"/>
               <v-list-item>
                 <v-list-item-content>
                    <v-list-item-title class="text-h6">Price</v-list-item-title>
                    <v-list-item-title>Original price: {{ (game.originalPrice / Math.pow(10, game.currencyDecimals)) + " " + game.currencyCode }} </v-list-item-title>
                    <v-list-item-title v-if="!game.deleted">Discount price: {{ (game.discountPrice / Math.pow(10, game.currencyDecimals)) + " " + game.currencyCode }} </v-list-item-title>
                    <v-list-item-title><span v-if="game.deleted">Previous </span>Discount: ~{{ game.discountPercent }}% ({{ (game.discount / Math.pow(10, game.currencyDecimals)) + " " + game.currencyCode }})</v-list-item-title>
                 </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-title v-if="game.deleted" v-html="'Deleted on: ' + new Date(game.deleted).toLocaleString(data.timezoneLocale, {timeZone: data.timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour12: data.hour12 === 'true', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })" />
                <v-list-item-title v-if="game.added" v-html="'Added on: ' + new Date(game.added).toLocaleString(data.timezoneLocale, {timeZone: data.timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour12: data.hour12 === 'true', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })" />
                <v-list-item-title v-if="!game.deleted && !game.added" v-html="'Added on: N/A'"/>
              </v-list-item>
              <v-list-item>
                <v-list-item-subtitle v-html="game.sellerName" />
              </v-list-item>
            </v-list>
        </v-card>
      </v-row>
      <v-row justify="center">
        <v-pagination v-if="data"
          v-model="page"
          class="my-4"
          :length="data.gamesListPages"
          :total-visible="7"
        ></v-pagination>
      </v-row>
  </v-container>
</template>

<script>
  import {AjaxClient2} from 'ajax-client'
  const client = new AjaxClient2();

  export default {
    name: 'TableView',
    props: [
      'myData'
    ],
    updated: function() {
      this.shop = this.myData.shop
    },
    created: function() {
      this.shop = this.myData.shop
    },
    watch: {
      shop: {
        async handler(value) {
          this.shop = value
          const get = await client.get({
            url: '/api/'+this.myData.shop.toLowerCase()+'?page=1',
            dataType: 'json',
            contentType: 'application/json',
            headers: {
              'Accept': 'application/json',
            },
            success: function(data) {
              this.games = data
            }
          });
          this.data = get.data
          this.games = get.data.gamesList
        }
      },
      page: {
        async handler(value) {
          const get = await client.get({
            url: '/api/'+this.myData.shop.toLowerCase()+'?page='+value,
            dataType: 'json',
            contentType: 'application/json',
            headers: {
              'Accept': 'application/json',
            },
            success: function(data) {
              this.games = data
            }
          });
          this.data = get.data
          this.games = get.data.gamesList
        }
      }
    },
    data: () => ({
      page: 1,
      data: null,
      shop: '',
      games: []
    }),
  }
</script>
