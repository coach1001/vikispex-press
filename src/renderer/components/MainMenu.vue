<template>
  <div class="container d-flex h-100">
    <div class="row align-items-center h-100 w-100">      
      <b-col>
        <b-card border-variant="secondary" align="center">
          <h3>Main Menu</h3>
          <b-card-body>
            <b-btn :block="true" variant="outline-secondary" @click="route('/test-select')">Select Test</b-btn>
            <b-btn :block="true" variant="outline-secondary" class="mt-4">View Results</b-btn>
            <!-- <b-btn :block="true" variant="outline-secondary" class="mt-4">Settings</b-btn>
          <b-row>
            <b-col>
              <b-btn :block="true" variant="outline-secondary" class="mt-4">Forward</b-btn>
            </b-col>
            <b-col>
              <b-btn :block="true" variant="outline-secondary" class="mt-4">Reverse</b-btn>
            </b-col>
            </b-row>-->
            <b-btn :block="true" variant="outline-secondary" class="mt-4" @click="exitApplication">Exit</b-btn>
          </b-card-body>
        </b-card>
      </b-col>
    </div>
  </div>
</template>

<script>
export default {
  name: 'main-menu',
  methods: {
    exitApplication() {
      this.$root.$emit('bv::show::modal', 'exitApplication')
    },
    route(url) {
      this.$router.push(url)
    }
  }
}
</script>

<style scoped>
button {
  min-height: 70px;
}
</style>
