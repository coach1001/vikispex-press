<template>
  <div>
    <b-row align-h="center">
      <b-col>
        <b-form>
          <b-row>
            <component
              v-for="(field, index) in schema"
              :name="field.name"
              :key="index"
              :is="field.fieldType"
              :value="formData[field.name]"
              @input="updateForm(field.name, $event)"
              :refData="formData"
              v-bind="field"
              :mask="field.fieldMask"
              :class="$fieldUtils.getInputClass(field.fieldType, field.fullWidth)"
            ></component>
          </b-row>
        </b-form>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import NumberInput from './NumberInput'
import SelectList from './SelectList'
import TextInput from './TextInput'
import TextAreaInput from './TextAreaInput'
import ArrayInput from './ArrayInput'
import ObjectInput from './ObjectInput'
import DatePickerInput from './DatePickerInput'
import BooleanYesNoInput from './BooleanYesNoInput'
import ModalInput from './ModalInput'

export default {
  name: 'FormGenerator',
  inject: ['$validator'],
  components: {
    NumberInput,
    SelectList,
    TextInput,
    ArrayInput,
    ObjectInput,
    DatePickerInput,
    BooleanYesNoInput,
    ModalInput,
    TextAreaInput
  },
  props: ['schema', 'value', 'name', 'dataLocation', 'defaultValues'],
  data() {
    return {
      formData: this.value || {},
      formDataCopy: {},
      formValidators: []
    }
  },
  watch: {
    value(newValue) {
      this.formData = newValue || {}
    }
  },
  methods: {
    updateForm(fieldName, value) {
      this.$set(this.formData, fieldName, value)
      this.$emit('input', this.formData)
    }
  },
  updated() {
    this.$validator.validateAll()
  }
}
</script>

<style scoped>
</style>