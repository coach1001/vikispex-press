<template> 
  <div class="container d-flex h-100">
    <div v-if="test" class="row align-items-center h-100 w-100">
      <div class="text-center display-3 cursor">&lt;</div>
      <div class="col">
        <b-card border-variant="secondary" align="center">
          <h3>{{test.name}}</h3>
          <b-card-body align="left">
            <form-generator :schema="test.inputs" @input="setFormData" :value="form" :name="test.name"></form-generator>
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
                <b-button block variant="outline-secondary" @mousedown="advance" @mouseup="idle" @mouseout="idle">Advance</b-button>
              </b-col>
              <b-col block>
                <b-button block variant="outline-secondary" @mousedown="reverse" @mouseup="idle" @mouseout="idle">Reverse</b-button>
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
import { ipcRenderer } from 'electron'
import FormGenerator from './DynamicFormComponents/FormGenerator'
import cloneDeep from 'lodash-es/cloneDeep'
import * as math from 'mathjs'

export default {
  name: 'test-select',
  components: { FormGenerator },
  inject: ['$validator'],
  data() {
    return {
      form: {},
      defaultValues: {}
    }
  },
  computed: {
    test() {
      const test = this.$store.getters.GET_SELECTED_TEST
      if (test) {
        test.inputs.forEach(input => {
          if (input.fieldType === 'DatePickerInput') {
            this.defaultValues[input.name] = new Date()
          } else {
            this.defaultValues[input.name] = input.defaultValue
          }
        })
        test.constants.forEach(constant => {
          this.defaultValues[constant.name] = constant.value
        })
        this.form = cloneDeep(this.defaultValues)
      }
      return test
    }
  },
  methods: {
    idle() {
      ipcRenderer.send('state-set', {
        state: 'MANUAL',
        subState: 'IDLE'
      })
    },
    advance() {
      ipcRenderer.send('state-set', {
        state: 'MANUAL',
        subState: 'ADVANCE'
      })
    },
    reverse() {
      ipcRenderer.send('state-set', {
        state: 'MANUAL',
        subState: 'REVERSE'
      })
    },
    setFormData(data) {
      this.form = data
    },
    exitApplication() {
      this.$root.$emit('bv::show::modal', 'exitApplication')
    },
    onReset() {
      this.form = cloneDeep(this.defaultValues)
    },
    onSubmit() {
      if (!(this.$validator.errors.items.length > 0) && this.test) {
        this.$store.commit('SET_SELECTED_TEST_TYPE', this.test.testType)
        this.test.calculated.forEach(calc => {
          this.form[calc.name] = Number(
            math.eval(calc.calc, this.form).toFixed(calc.precision)
          )
        })
        this.$store.commit('SET_SELECTED_TEST_PARAMS', {
          ...this.form,
          sampleHeaders: this.test.sampleHeaders
        })
        this.$router.push('/run-test')
      }
    }
  }
}
</script>

<style scoped>
button {
  min-height: 70px;
}
.cursor {
  cursor: pointer;
}
</style>
