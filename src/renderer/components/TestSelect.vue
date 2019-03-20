<template>
  <div class="h-100">
    <!-- {{uiData}} -->
    <div class="row align-items-center h-100" v-if="uiTest">
      <div class="text-center display-3 cursor">&lt;</div>
      <div class="col">
        <b-card border-variant="secondary" align="center">
          <h3>{{uiTest.name}}</h3>
          <b-card-body>
            <b-form>
              <!-- <b-row class="text-right mb-3">
                <b-col sm="4">
                  <label class="lg-label" for="sampleNumber">Sample number</label>
                </b-col>
                <b-col>
                  <b-form-input
                    data-vv-name="sampleNumber"
                    id="sampleNumber`"
                    :state="validateState('sampleNumber')"
                    size="lg"
                    v-validate="{ required: true }"
                    type="text"
                    v-model="form['sampleNumber']"
                  />
                </b-col>
              </b-row>-->
              <b-row class="text-right mb-3 align-items-center">
                <b-col sm="4">
                  <label class="lg-label">Date and time</label>
                </b-col>
                <b-col>
                  <b-form-input
                    id="date"
                    data-vv-name="date"
                    :state="validateState('date')"
                    size="lg"
                    v-validate="{ required: true }"
                    type="date"
                    v-model="form['date']"
                  />
                </b-col>
                <b-col>
                  <b-form-input
                    id="time"
                    data-vv-name="time"
                    :state="validateState('time')"
                    size="lg"
                    v-validate="{ required: true }"
                    type="time"
                    v-model="form['time']"
                  />
                </b-col>
              </b-row>

              <b-row class="text-right mb-3 align-items-center" v-for="input in uiTest.inputs" :key="input.id">
                <b-col sm="4">
                  <label class="lg-label" :for="`${input.variable}`">{{`${input.label} ${parseUnit(input.unit)}` }}</label>
                </b-col>
                <b-col>
                  <b-form-input
                    :id="`${input.variable}`"
                    :data-vv-name="input.variable"
                    :state="validateState(input.variable)"
                    size="lg"
                    :type="input.htmlType"
                    v-model="form[input.variable]"
                  />
                </b-col>
              </b-row>
            </b-form>

            <b-row>
              <b-col block>
                <b-button block variant="outline-secondary" @click="$router.push('main-menu')">Back to Menu</b-button>
              </b-col>
              <b-col block>
                <b-button block variant="outline-secondary" @click="onReset">Default Values</b-button>
              </b-col>
              <b-col block>
                <b-button block variant="outline-secondary" @click="onSubmit">Run Test</b-button>
              </b-col>
            </b-row>
            <b-row class="mt-3">
              <b-col block>
                <b-button block variant="outline-secondary">Forward</b-button>
              </b-col>
              <b-col block>
                <b-button block variant="outline-secondary">Reverse</b-button>
              </b-col>
            </b-row>
          </b-card-body>
        </b-card>
      </div>
      <div class="text-center display-3 cursor">&gt;</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'test-select',
  data() {
    return {
      form: {},
      defaultValues: {}
    }
  },
  computed: {
    uiTest() {
      const test = this.$store.getters.GET_SELECTED_TEST
      const now = new Date()
      const time = now
        .toTimeString()
        .split(' ')[0]
        .split(':')
      if (test) {
        test.inputs.forEach(input => {
          this.defaultValues[input.variable] = input.default
        })
        this.form = { ...this.defaultValues }
        this.form.sampleNumber = 'Default'
        this.form.date = now.toISOString().split('T')[0]
        this.form.time = `${time[0]}:${time[1]}`
      }
      return test
    },
    currentValues() {
      return this.$store.getters.GET_CURRENT_VALUES
    },
    uiData() {
      return this.$store.getters.GET_UI_DATA
    }
  },
  methods: {
    exitApplication() {
      this.$root.$emit('bv::show::modal', 'exitApplication')
    },
    parseUnit(unit) {
      return unit === 'integer' ? '' : `(${unit})`
    },
    onReset() {
      const now = new Date()
      const time = now
        .toTimeString()
        .split(' ')[0]
        .split(':')
      this.form = { ...this.defaultValues }
      this.form.date = now.toISOString().split('T')[0]
      this.form.time = `${time[0]}:${time[1]}`
    },
    onSubmit() {
      console.log(this.form)
    },
    validateState(ref) {
      if (
        this.$veeFields[ref] &&
        (this.$veeFields[ref].dirty || this.$veeFields[ref].validated)
      ) {
        console.log(this.$veeFields)
        return !this.errors.has(ref)
      }
      return null
    }
  }
}
</script>

<style scoped>
button {
  min-height: 70px;
  font-size: 1.25rem;
}

.lg-label {
  font-size: 1.25rem;
}
</style>
