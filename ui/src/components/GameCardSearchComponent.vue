<template>
  <v-row v-if="games">
    <v-col>
      <span><b>{{ games[0].store.toUpperCase()}}</b></span>
    </v-col>
    <v-col>
      <v-carousel cycle height="500" hide-delimiters show-arrows-on-hover>
        <v-carousel-item v-for="game in games" :key="game.id" :href="game.storeURL" target="_blank">
          <v-list outlined height="100%" min-width="450" max-width="450">
            <v-card-title v-if="!game.deleted" v-text="game.title" />
            <v-card-title v-if="game.deleted" v-text="game.title" style="text-decoration: line-through;" />
            <v-img :src="game.thumbnailURL" contain max-height="250" dark />
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="text-h6">Price</v-list-item-title>
                  <v-list-item-title>Original price: {{ (game.originalPrice / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }} </v-list-item-title>
                  <v-list-item-title v-if="!game.deleted">Discount price: {{ (game.discountPrice / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }} </v-list-item-title>
                  <v-list-item-title ><span v-if="game.deleted">Previous </span>Discount: ~{{ game.discountPercent }}% ({{ (game.discount / Math.pow(10, game.currencyDecimals)).toFixed(2) + " " + game.currencyCode }})</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-subtitle v-html="game.sellerName" />
            </v-list-item>
          </v-list>
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </v-row>
</template>

<script>
  export default ({
    props: [
      'games'
    ],
  })
</script>
