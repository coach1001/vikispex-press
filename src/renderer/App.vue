<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
export default {
  name: 'vikispex-press',
  mounted () {
    ipcRenderer.on('data-get-reply', (event, arg) => {
      console.log(arg)
    })
    setInterval(() => {
      ipcRenderer.send('data-get')
    }, 10)
  }
}
</script>

<style>
</style>
