<template>
  <div class="h-100" v-if="test">
    <div class="row align-items-center h-100">
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
                <b-button block variant="outline-secondary" @mousedown="forward" @mouseup="neutral" @mouseout="neutral">Forward</b-button>
              </b-col>
              <b-col block>
                <b-button block variant="outline-secondary" @mousedown="reverse" @mouseup="neutral" @mouseout="neutral">Reverse</b-button>
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
        this.form = cloneDeep(this.defaultValues)
      }
      return test
    }
  },
  methods: {
    forward() {
      ipcRenderer.send('set-state', {
        state: 'manual-forward'
      })
    },
    reverse() {
      ipcRenderer.send('set-state', {
        state: 'manual-reverse'
      })
    },
    neutral() {
      ipcRenderer.send('set-state', {
        state: 'idle'
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
        // eslint-disable-next-line no-unused-vars
        const input = cloneDeep(this.form)
        this.test.calculated.forEach(calc => {
          // eslint-disable-next-line no-eval
          this.form[calc.name] = eval(calc.calc)
        })
        console.log(this.form)
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
