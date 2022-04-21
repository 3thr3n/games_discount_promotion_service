<template>
  <div>
    <v-container ref="container" v-if="keys > 0">
      <v-row  v-for="(game, i) in gameList" :key="i" class="text-center">
        <v-col />
        <v-col class="mb-4">
          <v-container>
            <game-card-search-component :games="game" />
          </v-container>
        </v-col>
        <v-col />
      </v-row>
    </v-container>
    <v-container v-if="keys == 0">
      <v-row class="text-center">
        <v-col />
        <v-col class="mb-4">
          <span>No data found</span>
        </v-col>
        <v-col />
      </v-row>
    </v-container>
  </div>
</template>

<script>
  import GameCardSearchComponent from './GameCardSearchComponent'

  import {AjaxClient2} from 'ajax-client'
  const client = new AjaxClient2();

  import {backendPath} from '../variables.js'

  export default {
    name: 'SearchView',

    props: [
      'myData',
    ],

    components: {
      GameCardSearchComponent
    },

    data: ()=> ({
      gameList: {},
      keys: 0
    }),

    created: function() {
      this.getData()
    },

    watch: { 
      myData: function() {
        this.getData()
      }
    },

    methods: {
      async getData() {
        const get = await client.get({
            url: backendPath + 'api/search?q='+this.myData.value,
            dataType: 'json',
            contentType: 'application/json',
            headers: {
              'Accept': 'application/json',
            },
            success: function(data) {
              return data
            }
          });

          if (get.data.gameList) {
            this.keys = Object.keys(get.data.gameList).length
            this.gameList = get.data.gameList
          }
      }
    }
  }
</script>