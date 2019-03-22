<template>
  <b-modal :id="name" :size="size" centered @show="cloneForm" @hide="validateModal">
    <div slot="modal-header" class="w-100">
      <b-row>
        <b-col cols="12" md="auto">
          <strong>{{label}}</strong>
        </b-col>
      </b-row>
      <b-row v-if="subTitle">
        <b-col cols="12" md="auto">{{subTitle}}</b-col>
      </b-row>
    </div>
    <b-row>
      <component
        v-for="(field, index) in schema"
        :name="`${$fieldUtils.parentName(parentName)}${field.name}`"
        :key="index"
        :is="field.fieldType"
        :value="formData[field.name]"
        :refData="formData"
        @input="updateForm(field.name, $event)"
        v-bind="field"
        :mask="field.fieldMask"
        :class="$fieldUtils.getInputClass(field.fieldType, field.fullWidth)"
      ></component>
    </b-row>
  </b-modal>
</template>

<script>
import NumberInput from './NumberInput'
import SelectList from './SelectList'
import TextInput from './TextInput'
import TextAreaInput from './TextAreaInput'
import DatePickerInput from './DatePickerInput'
import BooleanYesNoInput from './BooleanYesNoInput'
import cloneDeep from 'lodash-es/cloneDeep'

export default {
  name: 'ModalInput',
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
    'size',
    'subTitle',
    'parentName',
    'clearWhen',
    'clearWhenValue'
  ],
  data() {
    return {
      formData: this.value || {},
      vPromises: [],
      formDataCopy: {}
    }
  },
  watch: {
    value(newValue) {
      this.formData = newValue || {}
      console.log(newValue)
    },
    refData: {
      handler() {
        if (
          this.$fieldUtils.canClear(
            this.refData,
            this.clearWhen,
            this.clearWhenValue
          ) &&
          !this.$objectUtils.isEmpty(this.formData)
        ) {
          this.formData = {}
          this.$emit('input', this.formData)
        }
      },
      deep: true
    }
  },
  methods: {
    cloneForm() {
      this.clearErrorsAllChildren_r(this)
      this.formDataCopy = cloneDeep(this.formData)
    },
    clearErrorsAllChildren_r(component) {
      component.errors.clear()
      component.$children.forEach(child => {
        this.clearErrorsAllChildren_r(child)
      })
    },
    validateAllChildren_r(component) {
      this.vPromises.push(component.$validator.validateAll())
      component.$children.forEach(child => {
        this.validateAllChildren_r(child)
      })
    },
    updateForm(fieldName, value) {
      this.$set(this.formData, fieldName, value)
    },
    validateModal(event) {
      if (event.trigger !== 'ok' && event.trigger !== null) {
        this.$emit('input', this.formDataCopy)
      } else if (event.trigger === 'ok') {
        event.preventDefault()
        this.vPromises = []
        this.validateAllChildren_r(this)
        Promise.all(this.vPromises).then(results => {
          let closeModal = true
          results.forEach(result => {
            if (!result) {
              closeModal = false
            }
          })
          if (closeModal) {
            this.$emit('input', this.formData)
            this.$root.$emit('bv::hide::modal', this.name)
          }
        })
      }
    }
  }
}
</script>

<style scoped>
</style>