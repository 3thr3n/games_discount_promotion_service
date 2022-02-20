<template>
  <v-container dark>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="require('../assets/logo.svg')"
          class="my-3"
          contain
          height="200"
        />
      </v-col>

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Games discount-promotions
        </h1>

        <p class="subheading font-weight-regular">
          This service is an gamestore-api-scraper, currenty for Epicgames, steam, gog and ubisoft.<br />
          It will find any discount on the shop-page. <br />
          (Gamedemos are excluded) 
        </p>
      </v-col>

      <v-col class="mb-5" cols="12" >
        <h2 class="headline font-weight-bold mb-3">
          Gamestore check
        </h2>

        <v-row justify="center">
          <div>{{ gamestoreDate }}</div>
        </v-row>
        <v-row justify="center">
          <div>{{ gamestoreDatetext }}</div>
        </v-row>
      </v-col>

      <v-col class="mb-5" cols="12" >
        <h2 class="headline font-weight-bold mb-3">
          Cleanup database
        </h2>
        
        <v-row justify="center">
          <div>{{ cleanupDate }}</div>
        </v-row>
        <v-row justify="center">
          <div>{{ cleanupDatetext }}</div>
        </v-row>
      </v-col>

      <v-col class="mb-5" cols="12" >
        <h2 class="headline font-weight-bold mb-3">
          Source code
        </h2>

        <v-row justify="center">
          <a v-for="(source, i) in sources"
            :key="i" :href="source.href"
            class="subheading mx-3" 
            target="_blank" >
            {{ source.text }}
          </a>
        </v-row>
      </v-col>

      <v-col class="mb-5" cols="12" >
        <h2 class="headline font-weight-bold mb-3">
          Framework
        </h2>

        <v-row justify="center">
           <a v-for="(framework, i) in frameworks"
            :key="i" :href="framework.href"
            class="subheading mx-3" 
            target="_blank" >
            {{ framework.text }}
          </a>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import {AjaxClient2} from 'ajax-client'
  const client = new AjaxClient2();

  export default {
    name: 'MainView',

    props: [
      'myData'
    ],
    data: () => ({
      sources: [
        {
          text: 'Github',
          href: 'https://github.com/3thr3n/games_discount_promotion_service',
        },
        {
          text: 'Dockerhub',
          href: 'https://hub.docker.com/r/3thr3n/games_discount_promotions_service',
        },
      ],
      frameworks: [
        {
          text: 'Express',
          href: 'https://expressjs.com'
        },
        {
          text: 'LowDB',
          href: 'https://www.npmjs.com/package/lowdb'
        },
        {
          text: 'Vuetify',
          href: 'https://vuetifyjs.com'
        }
      ],
      cleanupDatetext: '',
      cleanupDate: null,
      cleanupCounter: 0,
      gamestoreDatetext: '',
      gamestoreDate: null,
      gamestoreCounter: 0,
    }),
    watch: {
      gamestoreCounter: {
        handler(value) {
          if (value > 0) {
            this.gamestoreDatetext = runTime(this.gamestoreCounter)
            setTimeout(() => {
              this.gamestoreCounter--;
              this.gamestoreDatetext = runTime(this.gamestoreCounter)
            }, 1000);
          }
        },
        // immediate: true // This ensures the watcher is triggered upon creation
      },
      cleanupCounter: {
        handler(value) {
          if (value > 0 ) {
            this.cleanupDatetext = runTime(this.cleanupCounter)
            setTimeout(() => {
              this.cleanupCounter--;
              this.cleanupDatetext = runTime(this.cleanupCounter)
            }, 1000);
          }
        },
        immediate: true // This ensures the watcher is triggered upon creation
      }
    },
    created: async function() {
      const get = await client.get({
        url: '/api/main',
        dataType: 'json',
        contentType: 'application/json',
        headers: {
          'Accept': 'application/json',
        },
        success: function(data) {
          this.games = data
        }
      });

      this.cleanupDate = new Date(get.data.deleteTimer).toLocaleString(get.data.timezoneLocale, {
        timeZone: get.data.timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: get.data.hour12 === 'true',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      this.cleanupCounter = new Date(get.data.deleteTimer).getTime() - new Date().getTime()

      this.gamestoreDate = new Date(get.data.mainTimer).toLocaleString(get.data.timezoneLocale, {
        timeZone: get.data.timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: get.data.hour12 === 'true',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      this.gamestoreCounter = new Date(get.data.mainTimer).getTime() - new Date().getTime()
    }
  }
  function runTime(distance) {
    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

    const s = 'Next execution: '
    if (days == 0) {
      return s + hours + 'h '+ minutes + 'm'
    }
    if (days == 0 && hours == 0) {
      return s + minutes + 'm'
    }
    return s + days + 'd ' + hours + 'h ' + minutes + 'm'
  }
</script>
