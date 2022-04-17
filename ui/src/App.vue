<template>
  <v-app>
    <v-overlay :value="searchOverlay">
      <v-container ref="container">
        <v-col>
          <game-card-search-component :games="gameList" />
        </v-col>
        <v-col class="text-center">
          <v-btn @click="searchOverlay = false; search = ''">Close</v-btn>
        </v-col>
      </v-container>
    </v-overlay>
    <v-app-bar app>
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          @click="onChangeShop('')"
          width="40" />
      </div>

      <div class="mt-1 hidden-sm-and-down">
        <v-btn class="mx-4" depressed @click="onChangeShop('epicgames')">Epicgames</v-btn>
        <v-btn class="mx-4" depressed @click="onChangeShop('steam')">Steam</v-btn>
        <v-btn class="mx-4" depressed @click="onChangeShop('gog')">Gog</v-btn>
        <v-btn class="mx-4" depressed @click="onChangeShop('ubisoft')">Ubisoft</v-btn>
        <v-btn class="mx-4" depressed @click="onChangeShop('recently')">Old discounts</v-btn>
      </div>
      <v-spacer />
      <div>
        <v-text-field
          clearable
          dense
          single-line
          class="mt-4 mx-10"
          v-model="search"
          hint="At least 4 characters"
          label="Search"
          @change="onChange"
        ></v-text-field>
      </div>
      <div>
        <v-tooltip v-if="!$vuetify.theme.dark" bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" small fab @click="darkMode">
              <v-icon class="mr-1">mdi-moon-waxing-crescent</v-icon>
            </v-btn>
          </template>
          <span>Dark Mode On</span>
        </v-tooltip>

        <v-tooltip v-else bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" small fab @click="darkMode">
              <v-icon color="yellow">mdi-white-balance-sunny</v-icon>
            </v-btn>
          </template>
          <span>Dark Mode Off</span>
        </v-tooltip>
      </div>
      <div class="mt-1 hidden-md-and-up">
        <v-menu bottom left>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon color="primary">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
              <v-list-item @click="onChangeShop('epicgames')">
                <v-list-item-title>Epicgames</v-list-item-title>
              </v-list-item>
              <v-list-item @click="onChangeShop('steam')">
                <v-list-item-title>Steam</v-list-item-title>
              </v-list-item>
              <v-list-item @click="onChangeShop('gog')">
                <v-list-item-title>Gog</v-list-item-title>
              </v-list-item>
              <v-list-item @click="onChangeShop('ubisoft')">
                <v-list-item-title>Ubisoft</v-list-item-title>
              </v-list-item>
              <v-list-item @click="onChangeShop('recently')">
                <v-list-item-title>Old discounts</v-list-item-title>
              </v-list-item>
            </v-list>
        </v-menu>
      </div>

    </v-app-bar>

    <v-main dark>
      <component :is="currentView" :myData="propData" />
    </v-main>

    <v-footer padless>
    <v-col>
        <div class="text-left text-caption">
          {{ new Date().getFullYear() }} — <strong><a style="text-decoration: none; color: grey" href="https://github.com/3thr3n">&copy;3thr3n</a></strong>
        </div>
    </v-col>
    <v-col>
      <div class="text-right text-caption" >Powered by Vuetify </div>
    </v-col>
  </v-footer>
  </v-app>
</template>

<script>
  import TableView from './components/TableView';
  import MainView from './components/MainView';
  import NotFound from './components/NotFound';
  import GameCardSearchComponent from './components/GameCardSearchComponent.vue';

  import {AjaxClient2} from 'ajax-client'
  const client = new AjaxClient2();

  import {backendPath} from './variables.js'

  const routes = [
    {
      path: '/',
      component: MainView,
      props: { }
    },
    {
      path: '/gog',
      component: TableView,
      props: { shop: 'Gog'}
    },
    {
      path: '/steam',
      component: TableView,
      props: { shop: 'Steam'}
    },
    {
      path: '/ubisoft',
      component: TableView,
      props: { shop: 'Ubisoft'}
    },
    {
      path: '/epicgames',
      component: TableView,
      props: { shop: 'Epicgames'}
    },
    {
      path: '/recently',
      component: TableView,
      props: { shop: 'Old'}
    },
     {
      path: '/ohno',
      component: NotFound,
      props: { }
    }
  ]

  export default {
    name: 'App',

    components: {
      TableView,
      MainView,
      NotFound,
      GameCardSearchComponent,
    },

    data: () => ({
      currentPath: window.location.hash,
      search: '',
      searchOverlay: false,
      zIndex: 10,
      gameList: {},

      propData: {},
    }),
    computed: {
      currentView: function() {
        const route = getRoute(this.currentPath)
        return (route ? route.component : NotFound)
      }
    },
    mounted: function() {
      window.addEventListener('hashchange', function() {
        this.currentPath = window.location.hash
      })
    },
    created: function() {
      if (window.location.hash !== '#/ohno')
        this.onChangeShop('')
    },
    methods: {
      onChangeShop(shop) {
        const urlPath = '#/'+shop

        const route = getRoute(urlPath)
        this.propData = (route ? route.props : {})

        window.location.hash = urlPath
        this.currentPath = urlPath
      },
      darkMode() {
        this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      },
      async onChange(x) {
        if (x === null || x.length <= 3) {
          return
        }
        const get = await client.get({
          url: backendPath + 'api/search?q='+x,
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
          this.gameList = get.data.gameList
          this.searchOverlay = true
          console.log(get.data);
        }
      }
    }
  };

function getRoute(routePath) {
  return routes.find(x => {
    if (x.path === routePath.slice(1)) {
      return true
    }
  })
}
</script>
