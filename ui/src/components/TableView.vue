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
      <game-card-component :data="data" :games="games"/>
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

  import GameCardComponent from './GameCardComponent.vue';
  import {backendPath} from '../variables.js'

  export default {
    components: { GameCardComponent },
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

          if (value === 'Old') {
            this.sortList = ['Title', 'Original Price', 'Discount', 'Deleted on']
          } else {
            this.sortList = ['Title', 'Original price', 'Discount price', 'Discount', 'Added on']
          }

          this.$vuetify.goTo(0)
          window.scrollTo(0,0);
        }
      },
      page: {
        async handler(value) {
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
      sortList: [],
    }),
    methods: {
      getSortId() {
        if (this.sort === 'Original price') return 1
        if (this.sort === 'Discount price') return 2
        if (this.sort === 'Discount') return 3
        if (this.sort === 'Added on') return 4
        if (this.sort === 'Deleted on') return 5
        return 0
      },
      changeOrder() {
        this.asc = !this.asc
      }
    }
  }

async function fetchData(shop, page, sort, asc) {
  const get = await client.get({
    url: backendPath + 'api/'+shop.toLowerCase()+'?page='+page+'&sort='+sort+'&asc='+asc,
    dataType: 'json',
    contentType: 'application/json',
    headers: {
      'Accept': 'application/json',
    }
  });
  return get.data
}
</script>
