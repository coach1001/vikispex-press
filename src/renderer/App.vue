<template>
  <div id="app">
    
    <!-- <b-card class="shadow-lg mt-5">
      <div>{{data}}</div>
      <input type="range" min="0" max="16000" step="100" v-model="outputs.pwm0" @change="sendData()" /><span v-text="outputs.pwm0"></span>
      <input type="range" min="0" max="16000" step="100" v-model="outputs.pwm1" @change="sendData()" /><span v-text="outputs.pwm1"></span>
      <input type="checkbox" v-model="outputs.r0" @change="sendData()">
      <input type="checkbox" v-model="outputs.r1" @change="sendData()">        
    </b-card> -->

    <b-navbar class="shadow-lg" type="dark" variant="dark">
      <b-row class="w-100">
        <b-col></b-col>
        <b-col class="text-right">
          <b-btn class="round" variant="primary" v-b-modal.exitApplication>&times;</b-btn>
        </b-col> 
      </b-row>
    </b-navbar>

    <div class="container">
      <router-view></router-view>
    </div>

    <b-modal 
      id="exitApplication"
      title="Exit Application?"
      centered>
        <div slot="modal-footer"></div>
    </b-modal>
    
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'vikispex-press',
  data () {
    return {
      data: null,
      outputs: {
        pwm0: 0,
        pwm1: 0,
        r0: false,
        r1: false
      }
    }
  },
  methods: {
    sendData () {
      let copyOutputs = {...this.outputs}
      for (var key in copyOutputs) {
        if (typeof copyOutputs[key] === 'boolean') {
          copyOutputs[key] = copyOutputs[key] ? 1 : 0
        }
        if (typeof copyOutputs[key] === 'string') {
          copyOutputs[key] = Number(copyOutputs[key])
        }
      }
      ipcRenderer.send('data-set', copyOutputs)
    }
  },
  mounted () {
    ipcRenderer.on('data-get-reply', (event, arg) => {
      this.data = arg
    })
    setInterval(() => {
      ipcRenderer.send('data-get')
    }, 50)
  }
}
</script>

<style>
.round {
  height: 60px;
  width: 60px;
  border-radius: 50% !important;
  font-size: 2.2rem;
}
</style>
