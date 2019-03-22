<template>
  <div v-if="$fieldUtils.isVisible(refData, visibleWhen, visibleWhenValue)">
    <b-form-group
      :label="label"
      :invalid-feedback="errors.first(`${$fieldUtils.parentName(parentName)}${name}`)"
      :state="errors.has(`${$fieldUtils.parentName(parentName)}${name}`) ? false : null"
    >
      <b-form-textarea
        :data-vv-as="label"
        :state="errors.has(`${$fieldUtils.parentName(parentName)}${name}`) ? false : null"
        :disabled="$fieldUtils.isEnabled(refData, enabledWhen, enabledWhenValue)"
        :name="name"
        :value="value"
        @input="(val) => $emit('input',val)"
        :placeholder="placeholder"
        :rows="5"
        :max-rows="6"
        @blur.native="$validator.validate(`${$fieldUtils.parentName(parentName)}${name}`)"
        v-validate="validation"
      ></b-form-textarea>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: 'TextAreaInput',
  inject: ['$validator'],
  props: [
    'placeholder',
    'label',
    'name',
    'value',
    'refData',
    'defaultValue',
    'mask',
    'validation',
    'parentName',
    'visibleWhen',
    'visibleWhenValue',
    'clearWhen',
    'clearWhenValue',
    'enabledWhen',
    'enabledWhenValue'
  ],
  watch: {
    refData: {
      handler() {
        if (
          this.$fieldUtils.canClear(
            this.refData,
            this.clearWhen,
            this.clearWhenValue
          ) &&
          this.value !== undefined
        ) {
          this.$emit('input', undefined)
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
</style>
