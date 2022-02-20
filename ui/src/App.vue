<template>
  <v-app>
    <v-app-bar app >
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
  </v-app>
</template>

<script>
  import TableView from './components/TableView';
  import MainView from './components/MainView';
  import NotFound from './components/NotFound';

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
      NotFound
    },

    data: () => ({
      currentPath: window.location.hash,

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
