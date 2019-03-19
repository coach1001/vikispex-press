<template>
  <b-card border-variant="secondary" align="center" class="mt-5">
    <h3>Test Card</h3>
    <b-card-body>
      <b-btn :block="true" variant="outline-secondary" @click="$router.go(-1)">Back</b-btn>
    </b-card-body>
  </b-card>
</template>

<script>
export default {
  name: 'test-select',
  methods: {
    exitApplication() {
      this.$root.$emit('bv::show::modal', 'exitApplication')
    }
  }
}
</script>

<style scoped>
button {
  min-height: 70px;
}
</style>
