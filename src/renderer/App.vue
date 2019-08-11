<template>
  <div class="h-100 d-flex flex-column">    
    <b-navbar :sticky="false" type="dark" variant="dark">      
      <b-navbar-nav>
        <b-nav-text class="mr-3">
          <div>Piston Travel</div>
        </b-nav-text>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-text>          
          <b-form-input class="abs-displacement mr-sm-2" v-model="absDisplacement" size="sm" readonly></b-form-input>          
        </b-nav-text>
      </b-navbar-nav>      
      <b-navbar-nav class="ml-auto">
        <b-nav-text>          
          <div>{{connected ? 'Connected' : 'Disconnected'}}</div>
        </b-nav-text>
      </b-navbar-nav>
    </b-navbar>        
    <router-view></router-view>        
    <b-modal id="exitApplication" title="Exit Application?" hide-footer centered>
      <b-container>
        <b-row>
          <b-col>
            <b-button block @click="exitApplication" variant="outline-success">Yes</b-button>
          </b-col>
          <b-col>
            <b-button block @click="dismissExitApplication" variant="outline-danger">No</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
    <b-modal id="connectionLost" title="Connection lost" hide-footer centered>
      <b-container>
        <b-row>
          <b-col>
            <b-button block @click="reconnect" variant="outline-success">Attempt to reconnect</b-button>
          </b-col>
          <b-col>
            <b-button block @click="exitApplication" variant="outline-danger">Exit Application</b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { mapGetters } from 'vuex';

export default {
  name: 'vikispex-press',
  data() {
    return {
      reconnecting: false,
      startingUp: true
    }
  },
  computed: {
    ...mapGetters({
      connected: 'GET_CONNECTED',
      uiData: 'GET_UI_DATA'
    }),
    absDisplacement() {
      const uiData = this.$store.getters.GET_UI_DATA;
      if (uiData.uiDisplacement) {
        const primaryDisplacement = uiData.uiDisplacement.find((channel) => channel.primary)
        return primaryDisplacement ? `${primaryDisplacement.realValue} ${primaryDisplacement.unit}` : ''
      } else {
        return ''
      }
    }
  },
  methods: {
    exitApplication() {
      ipcRenderer.send('exit-application', null);
    },
    dismissExitApplication() {
      this.$root.$emit('bv::hide::modal', 'exitApplication');
    },
    sendData() {
      let copyOutputs = { ...this.outputs };
      for (var key in copyOutputs) {
        if (typeof copyOutputs[key] === 'boolean') {
          copyOutputs[key] = copyOutputs[key] ? 1 : 0;
        }
        if (typeof copyOutputs[key] === 'string') {
          copyOutputs[key] = Number(copyOutputs[key]);
        }
      }
      ipcRenderer.send('data-set', copyOutputs);
    },
    reconnect() {
      this.reconnecting = true;
      setTimeout(() => {
        this.reconnecting = false;
      }, 5000);
      ipcRenderer.send('reconnect', null);
      this.$root.$emit('bv::hide::modal', 'connectionLost');
    }
  },
  mounted() {
    setTimeout(() => {
      this.startingUp = false;
    }, 5000);
    ipcRenderer.on('data-get-reply', (event, arg) => {
      if (!arg.connected && !this.reconnecting && !this.startingUp) {
        this.$root.$emit('bv::show::modal', 'connectionLost');
      }
      this.$store.commit('SET_CONNECTED', arg.connected);
      this.$store.commit('SET_UI_DATA', arg);
    });
    ipcRenderer.on('connection-lost', (event, args) => {
      this.$store.commit('SET_CONNECTED', false);
      this.$root.$emit('bv::show::modal', 'connectionLost');
    });
    ipcRenderer.send('tests-get');
    ipcRenderer.send('test-types-get');
    ipcRenderer.on('tests-reply', (event, arg) => {
      this.$store.commit('SET_UI_TESTS', arg);
    });
    ipcRenderer.on('test-types-reply', (event, arg) => {
      this.$store.commit('SET_TEST_TYPES', arg);
    });
    setInterval(() => {
      ipcRenderer.send('data-get');
    }, 33);
  }
};
</script>

<style>
button {
  min-height: 70px;
}
.round {
  height: 60px;
  min-height: 60px;
  width: 60px;
  border-radius: 50% !important;
  font-size: 2.2rem;
}
.abs-displacement {
  width: 95px;
}
</style>
