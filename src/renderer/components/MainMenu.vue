<template>
  <b-card border-variant="secondary"
          align="center"
          class="mt-5 shadow-lg">
    <h3>Main Menu</h3>
    <b-card-body>
      <b-btn :block="true" size="lg" variant="outline-secondary">Select Test</b-btn>
      <b-btn :block="true" size="lg" variant="outline-secondary" class="mt-4">View Results</b-btn>
      <b-btn :block="true" size="lg" variant="outline-secondary" class="mt-4">Settings</b-btn>
      <b-row>
        <b-col>
          <b-btn :block="true" size="lg" variant="outline-secondary" class="mt-4">Forward</b-btn>
        </b-col>
        <b-col>
          <b-btn :block="true" size="lg" variant="outline-secondary" class="mt-4">Reverse</b-btn>
        </b-col>
      </b-row>
      <b-btn :block="true" size="lg" variant="outline-secondary" class="mt-4">Exit</b-btn>
    </b-card-body>
  </b-card>
</template>

<script>
export default {
  name: 'main-menu',
  methods: {
  }
}
</script>

<style scoped>
button {
    min-height: 70px;
}
</style>
