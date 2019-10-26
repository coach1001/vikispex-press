<template>
  <div v-if="$fieldUtils.isVisible(refData, visibleWhen, visibleWhenValue)">
    <b-form-group
      :label="label"
      :invalid-feedback="errors.first(`${$fieldUtils.parentName(parentName)}${name}`)"
      :state="errors.has(`${$fieldUtils.parentName(parentName)}${name}`) ? false : null"
    >
      <b-form-input
        type="number"
        :data-vv-as="label"
        :state="errors.has(`${$fieldUtils.parentName(parentName)}${name}`) ? false : null"
        :disabled="$fieldUtils.isEnabled(refData, enabledWhen, enabledWhenValue)"
        :name="`${$fieldUtils.parentName(parentName)}${name}`"
        :value="value"
        @change="(val) => $emit('input',Number(val))"
        @blur.native="$validator.validate(`${$fieldUtils.parentName(parentName)}${name}`)"
        :placeholder="placeholder"
        v-validate="validation"
      ></b-form-input>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: 'NumberInput',
  inject: ['$validator'],
  props: [
    'placeholder',
    'label',
    'name',
    'value',
    'refData',
    'defaultValue',
    'parentName',
    'validation',
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