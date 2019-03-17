<template>
  <div id="app">
    <b-card class="mt-5">
      {{receivedDataAt}}
      <div>{{data}}</div>
      <input
        type="range"
        min="0"
        max="16000"
        step="100"
        v-model="outputs.pwm0"
        @change="sendData()"
      >
      <span v-text="outputs.pwm0"></span>
      <input
        type="range"
        min="0"
        max="16000"
        step="100"
        v-model="outputs.pwm1"
        @change="sendData()"
      >
      <span v-text="outputs.pwm1"></span>
      <input type="checkbox" v-model="outputs.r0" @change="sendData()">
      <input type="checkbox" v-model="outputs.r1" @change="sendData()">
    </b-card>
    <!-- <b-navbar type="dark" variant="dark">
      <b-row class="w-100">
        <b-col></b-col>
        <b-col class="text-right">
          <b-btn class="round" variant="primary" v-b-modal.exitApplication>&times;</b-btn>
        </b-col>
      </b-row>
    </b-navbar>-->
    <div class="container">
      <router-view></router-view>
    </div>

    <b-modal id="exitApplication" title="Exit Application?" hide-footer centered>
      <b-container>
        <b-row>
          <b-col>
            <b-btn :block="true" @click="exitApplication" variant="outline-success">Yes</b-btn>
          </b-col>
          <b-col>
            <b-btn :block="true" @click="dismissExitApplication" variant="outline-danger">No</b-btn>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>

    <b-modal id="connectionLost" title="Connection lost" hide-footer centered>
      <b-container>
        <b-row>
          <b-col>
            <b-btn :block="true" @click="reconnect" variant="outline-success">Attempt to reconnect</b-btn>
          </b-col>
          <b-col>
            <b-btn :block="true" @click="exitApplication" variant="outline-danger">Exit Application</b-btn>
          </b-col>
        </b-row>
      </b-container>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'vikispex-press',
  data() {
    return {
      receivedDataAt: null,
      data: null,
      outputs: {
        pwm0: 0, // 16bit
        pwm1: 0, // 16bit
        r0: 0, // SSR
        r1: 0, // SSR
        r2: 0, // RELAY
        r3: 0 // SSR
      }
    }
  },
  methods: {
    exitApplication() {
      ipcRenderer.send('exit-application', null)
    },
    dismissExitApplication() {
      this.$root.$emit('bv::hide::modal', 'exitApplication')
    },
    sendData() {
      let copyOutputs = { ...this.outputs }
      for (var key in copyOutputs) {
        if (typeof copyOutputs[key] === 'boolean') {
          copyOutputs[key] = copyOutputs[key] ? 1 : 0
        }
        if (typeof copyOutputs[key] === 'string') {
          copyOutputs[key] = Number(copyOutputs[key])
        }
      }
      ipcRenderer.send('data-set', copyOutputs)
    },
    reconnect() {
      ipcRenderer.send('reconnect', null)
      this.$root.$emit('bv::hide::modal', 'connectionLost')
    }
  },
  mounted() {
    ipcRenderer.on('data-get-reply', (event, arg) => {
      this.data = arg
      this.receivedDataAt = Date.now()
    })

    ipcRenderer.on('connection-lost', (event, args) => {
      this.$root.$emit('bv::show::modal', 'connectionLost')
    })

    setInterval(() => {
      ipcRenderer.send('data-get')
    }, 50)
  }
}
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
</style>
