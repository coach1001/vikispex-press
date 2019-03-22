<template>
  <div v-if="$fieldUtils.isVisible(refData, visibleWhen, visibleWhenValue)" class="mt-2 mb-2">
    <b-card border-variant="info" :header="label">
      <b-row>
        <div v-for="(val, vIndex) in value" :key="vIndex" class="col-12">
          <b-row>
            <component
              v-for="(field, index) in schema"
              :key="index"
              :is="field.fieldType"
              :value="formData[vIndex][field.name]"
              :parentName="`${$fieldUtils.parentName(parentName)}${name}_${vIndex}`"
              :refData="formData[vIndex]"
              @input="updateForm(field.name, $event, vIndex)"
              :mask="field.fieldMask"
              v-bind="field"
              class="col-12 col-sm-12 col-md-12 col-lg col-xl"
            ></component>
            <b-button variant="outline-danger" @click="removeRow(vIndex)" class="b-limit-btn">Remove</b-button>
          </b-row>
        </div>
      </b-row>
      <div slot="footer">
        <b-button variant="primary" @click="addRow()">Add</b-button>
      </div>
    </b-card>
  </div>
</template>

<script>
import BooleanYesNoInput from './BooleanYesNoInput'
import NumberInput from './NumberInput'
import SelectList from './SelectList'
import TextInput from './TextInput'
import TextAreaInput from './TextAreaInput'
import DatePickerInput from './DatePickerInput'

export default {
  name: 'ArrayInput',
  inject: ['$validator'],
  components: {
    ModalInput: () => import('./ModalInput'),
    ArrayInput: () => import('./ArrayInput'),
    ObjectInput: () => import('./ObjectInput'),
    NumberInput,
    SelectList,
    TextInput,
    DatePickerInput,
    BooleanYesNoInput,
    TextAreaInput
  },
  props: [
    'schema',
    'label',
    'name',
    'value',
    'refData',
    'parentName',
    'visibleWhen',
    'visibleWhenValue',
    'clearWhen',
    'clearWhenValue'
  ],
  data() {
    return {
      formData: this.value || []
    }
  },
  watch: {
    value(newValue) {
      this.formData = newValue || []
    },
    refData: {
      handler() {
        if (
          this.clearWhen !== undefined &&
          !this.refData[this.clearWhen] &&
          this.formData.length > 0
        ) {
          this.formData = []
          this.$emit('input', this.formData)
        }
      },
      deep: true
    }
  },
  methods: {
    updateForm(fieldName, value, vIndex) {
      this.$set(this.formData[vIndex], fieldName, value)
      this.$emit('input', this.formData)
    },
    addRow() {
      if (this.formData.length) {
        this.formData.push({})
      } else {
        this.formData = []
        this.formData.push({})
      }
      this.$emit('input', this.formData)
    },
    removeRow(vIndex) {
      this.formData.splice(vIndex, 1)
      this.$emit('input', this.formData)
    }
  }
}
</script>

<style scoped>
</style>
