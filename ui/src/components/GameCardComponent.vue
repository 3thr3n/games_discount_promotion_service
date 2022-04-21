<template>
  <v-row v-if="data">
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
          <v-list-item-title v-else-if="game.added" v-html="'Added on: ' + new Date(game.added).toLocaleString(data.timezoneLocale, {timeZone: data.timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour12: data.hour12 === 'true', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })" />
          <v-list-item-title v-if="!game.deleted && !game.added" v-html="'Added on: N/A'"/>
        </v-list-item>
        <v-list-item>
          <v-list-item-subtitle v-html="game.sellerName" />
        </v-list-item>
      </v-list>
    </v-card>
  </v-row>
</template>

<script>
  export default ({
    props: [
      'data',
      'games'
    ],
  })
</script>
