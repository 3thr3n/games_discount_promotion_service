<template>
  <v-container ref="container">
      <v-row class="text-center">
        <v-col class="mb-4">
          <h1 class="display-2 font-weight-bold mb-3">
            {{ myData.shop }} discount-promotions
          </h1>
        </v-col>
      </v-row>
      <v-row>
        <v-spacer class="hidden-sm-and-down" />
        <v-col class="mb-4" cols="8">
          <v-select class="mx-1 mb-2" label="Sort by" :items="sortList" v-model="sort" />
        </v-col>
        <v-spacer />
        <v-col class="mt-3">
          <v-btn depressed class="mx-1 mb-2" @click="changeOrder">
            <v-icon color="primary" v-if="asc">mdi-chevron-down</v-icon>
            <v-icon color="primary" v-if="!asc">mdi-chevron-up</v-icon>
          </v-btn>
        </v-col>
        <v-spacer class="hidden-sm-and-down" />
      </v-row>
      <v-row>
        <v-card width="390" class="mx-auto mt-5" v-for="game in games" :key="game.id" :href="game.storeURL" target="_blank">
            <v-list outlined height="100%">
              <v-img :src="game.thumbnailURL" contain height="250px" dark />
              <v-card-title v-text="game.title"/>
               <v-list-item>
                 <v-list-item-content>
                    <v-list-item-title class="text-h6">Price</v-list-item-title>
                    <v-list-item-title>Original price: {{ (game.originalPrice / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }} </v-list-item-title>
                    <v-list-item-title v-if="!game.deleted">Discount price: {{ (game.discountPrice / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }} </v-list-item-title>
                    <v-list-item-title><span v-if="game.deleted">Previous </span>Discount: ~{{ game.discountPercent }}% ({{ (game.discount / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }})</v-list-item-title>
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
          :total-visible="9"
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
          this.page = 1
          this.shop = value
          this.asc = true
          this.sort = 'Title'
          
          const fetchedData = await fetchData(value, 1, this.getSortId(), this.asc)

          this.data = fetchedData
          this.games = fetchedData.gamesList

          this.$vuetify.goTo(0)
          window.scrollTo(0,0);
        }
      },
      page: {
        async handler(value) {
          this.asc = true
          this.sort = 'Title'

          const fetchedData = await fetchData(this.shop, value, this.getSortId(), this.asc)

          this.data = fetchedData
          this.games = fetchedData.gamesList

          this.$vuetify.goTo(0)
          window.scrollTo(0,0);
        }
      },
      sort: {
        async handler() {
          this.asc = true

          const fetchedData = await fetchData(this.shop, this.page, this.getSortId(), this.asc)

          this.data = fetchedData
          this.games = fetchedData.gamesList

          this.$vuetify.goTo(0)
          window.scrollTo(0,0);
        }
      }, 
      asc: {
        async handler(value) {
          const fetchedData = await fetchData(this.shop, this.page, this.getSortId(), value !== undefined ? value : true)

          this.data = fetchedData
          this.games = fetchedData.gamesList

          this.$vuetify.goTo(0)
          window.scrollTo(0,0);
        }
      }
    },
    data: () => ({
      page: 1,
      data: null,
      shop: '',
      games: [],
      asc: true,
      sort: 'Title',
      sortList: ['Title', 'Original price', 'Discount price', 'Discount', 'Added on'],
    }),
    methods: {
      getSortId() {
        if (this.sort === 'Original price') return 1
        if (this.sort === 'Discount price') return 2
        if (this.sort === 'Discount') return 3
        if (this.sort === 'Added on') return 4
        return 0
      },
      changeOrder() {
        this.asc = !this.asc
      }
    }
  }

async function fetchData(shop, page, sort, asc) {
  const get = await client.get({
    url: '/api/'+shop.toLowerCase()+'?page='+page+'&sort='+sort+'&asc='+asc,
    dataType: 'json',
    contentType: 'application/json',
    headers: {
      'Accept': 'application/json',
    }
  });
  return get.data
}
</script>
