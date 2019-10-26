<template>
  <div v-if="$fieldUtils.isVisible(refData, visibleWhen, visibleWhenValue)" class="mt-2 mb-2">    
    <b-card border-variant="info" :header="label">  
      <b-row>
        <component v-for="(field, index) in schema"
                  :key="index"                  
                  :parentName="`${$fieldUtils.parentName(parentName)}${name}`"
                  :is="field.fieldType"
                  :value="formData[field.name]"
                  @input="updateForm(field.name, $event)"
                  :refData="formData"                  
                  v-bind="field"
                  :mask="field.fieldMask"                  
                  :class="$fieldUtils.getInputClass(field.fieldType, field.fullWidth)">
        </component>        
      </b-row>
    </b-card>    
  </div>
</template>

<script>
import NumberInput from './NumberInput'
import SelectList from './SelectList'
import TextInput from './TextInput'
import TextAreaInput from './TextAreaInput'
import DatePickerInput from './DatePickerInput'
import BooleanYesNoInput from './BooleanYesNoInput'

export default {
  name: 'ObjectInput',
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
    TextAreaInput },
  props: [
    'schema', 'label', 'name', 'value', 'refData', 'parentName',
    'visibleWhen', 'visibleWhenValue',
    'clearWhen', 'clearWhenValue'
  ],
  data() {
    return {
      formData: this.value || {}
    }
  },
  watch: {
    value(newValue) {
      this.formData = newValue || {}
    },
    refData: {
      handler() {
        if (this.$fieldUtils.canClear(this.refData, this.clearWhen, this.clearWhenValue) && !this.$objecUtils.isEmpty(this.formData)) {
          this.formData = {}
          this.$emit('input', this.formData)
        }
      },
      deep: true
    }
  },
  methods: {
    updateForm(fieldName, value) {
      this.$set(this.formData, fieldName, value)
      this.$emit('input', this.formData)
    }
  }
}
</script>

<style scoped>
</style>