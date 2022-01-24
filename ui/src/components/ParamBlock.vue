<style lang="sass" scoped>

</style>
<template lang="pug">
div.d-flex.flex-wrap
  //- strong ParamBlock
  //- pre {{params}}
  template(v-if='params.length > 0 ')
    //- div(v-for='(param, i) in params' v-if='param.key ? !param.valueFromRow && String(param.valueFromEnv || "") != "true" : true')
    
    div.mb-3(v-for='(param, i) in params' v-if='param.key ? isVisible(param) : true' :class='param.class')
      //- pre {{param}}
      //- label.text-muted.me-1(style='word-break: keep-all;'): strong: small {{param.label}}
      label.d-block.pb-1
        strong.text-muted
          small {{param.label || param.key || '&nbsp;'}}
          small.ms-1(v-show='param.required' style='color: tomato') *


      template(v-if='param.datalist')
        //- pre {{i}} {{param.label}}
        datalist(:id='`datalist_${id}_${i}`')
          option(:value='item.value' v-for='item in param.datalist' v-if='(param.values ? !param.values.includes(item.value) : true)') {{item.label}}
        div(v-if='param.datalistDropdown')
          select.form-control.d-inline.me-1(v-model='param.value' :required='param.required' :size='param.dropdownSize || 1')
            option(:value='item.value' v-for='item in param.datalist') {{item.label}}
        div(v-else)
          input.form-control.d-inline.me-1(:list='`datalist_${id}_${i}`' v-model='param.value' :required='param.required' @change='datalist_changed($event, param)')
        div(v-if='param.datalistLength && param.datalistLength > 1 && param.values')
          span.badge.btn.btn-light.text-dark.border.p-2.mt-1.me-1(v-for='value in param.values' @click='datalist_remove(value, param)' style='cursor: pointer') {{value}}
        //- pre {{param.datalistLength}}
        //- pre {{param.values}}
        div(v-if='param.datalistPreview')
          span.badge.text-dark.p-2.mt-1.me-1(v-for='item in param.datalist' v-if='item.value == param.value') {{item.label}}
        //- pre {{param.datalistLength}}
        //- pre {{param.values}}
      template(v-else-if='param.radio && param.radioButtonGroup')
        .btn-group
          template(v-for='value in param.radio')
            label.btn(:class='param.value == value ? "btn-light text-primary" : "btn-light border" ') {{value}}
              input.btn-check(
                type='radio' :name='`${param.key}_radio`' :value='value' 
                v-model='param.value'
                :required='param.required'
              )
      template(v-else-if='param.radio')
        .form-check.form-check-inline(v-for='value in param.radio')
          label() 
            template(v-if='value.label')
              input.form-check-input(
                tabindex='0'
                type='radio' :name='`${param.key}_radio`' :value='value.value' 
                v-model='param.value'
                :required='param.required'
              )
              | {{value.label}}
            template(v-else)
              input.form-check-input(
                tabindex='0'
                type='radio' :name='`${param.key}_radio`' :value='value' 
                v-model='param.value'
                :required='param.required'
              )
              | {{value}}
      template(v-else-if='param.dropdown')
        select.form-control.d-inline.me-1(v-model='param.value' :required='param.required' :size='param.dropdownSize || 1')
          option(:value='label' v-for='label in param.dropdown') {{label}}
      //- template(v-else-if='param.button')
      //-   button.btn(type='button' :class='param.buttonClass') {{param.button}}
      template(v-else)
        template(v-if='param.format == "textarea"')
          textarea.form-control(v-model='param.value' :required='param.required')
        template(v-else)
          input.form-control(:type='param.format' v-model='param.value' :required='param.required')

      //- template(v-if='param.datalist')
      //-   input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' :required='param.required')
      //-   datalist(:id='`${i}${param.label}`')
      //-     option(:value='label' v-for='label in param.datalist') {{label}}
      //- template(v-else-if='param.dropdown')
      //-   select.form-control.d-inline.me-1(v-model='param.value' :required='param.required')
      //-     option(:value='label' v-for='label in param.dropdown') {{label}}
      //- template(v-else)
      //-   input.form-control.d-inline.me-1(:type='param.format' v-model='param.value' :required='param.required')
    
      //- .d-flex
  //- div.mb-3.me-1(v-for='param in block.params' v-if='param.key && !param.valueFromRow && param.valueFromEnv != "true" ')
  //-   label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
  //-   input.form-control(:type='param.format' v-model='param.value' :required='param.required')


  //- .d-flex(v-if='block.params.length > 0 ')
  //-   div.mb-3(v-for='param in block.params' v-if='param.key && !param.valueFromRow && String(param.valueFromEnv || "") != "true" ')
  //-     label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
  //-     input.form-control(:type='param.format' v-model='param.value')
          
  //- div.mb-3(v-for='param in block.params' v-if='!param.valueFromRow && !param.valueFromEnv')
  //-   label.d-block.pb-1: strong.text-muted: small {{param.label || param.key}}
  //-   input.form-control(:type='param.format' v-model='param.value')
  
  //- .d-flex(v-if='block.params.length > 0 ')
  //-   div.mb-3(v-for='param in block.params' v-if='param.key && !param.valueFromRow && String(param.valueFromEnv || "") != "true" ')
  //-     label.d-block.pb-1: strong.text-muted: small {{param.label || param.key || '&nbsp;'}}
    
  //-     template(v-if='param.datalist')
  //-       input.form-control.d-inline.me-1(:list='`${i}${param.label}`' v-model='param.value' required)
  //-       datalist(:id='`${i}${param.label}`')
  //-         option(:value='label' v-for='label in param.datalist') {{label}}
  //-     template(v-else-if='param.dropdown')
  //-       select.form-control.d-inline.me-1(v-model='param.value' required)
  //-         option(:value='label' v-for='label in param.dropdown') {{label}}
  //-     template(v-else)
  //-         input.form-control(:type='param.format' v-model='param.value')
          
</template>

<script>

export default {
  name: 'ParamBlock',
  props: ['params'],
  components: {
    
  },
  computed: {
    
  },
  data() {
    return {
      id: 'el'+Number(Math.random()*100000).toFixed()
    }
  },
  mounted() {
    
  },
  methods: {
    isVisible(param) {
      if (param.valueFromRow) return false
      if (param.valueFromEnv) return false
      if (param.valueFromPrompt) return false
      if (param.valueFromSelectedRows) return false
      return true
    },
    datalist_remove(value, param) {
      console.log('datalist_remove', value, param)
      const values = param.values.filter(e => e != value)
      this.$set(param, 'values', values)
      // this.$set(param, '', '')
      // param = { ...param, values}
      // this.$set(this.params, '', '')
      // this.params = [...this.params]
      // this.$emit('paramsUpdated')
      this.$forceUpdate()
    },
    datalist_changed(event, param) {
      if (!param.datalistLength || param.datalistLength <= 1) return true

      console.log(param.value)
      if (!param.values) this.$set(param, 'values', [])

      param.values.push(param.value)
      param.value = ''
      console.log('>>' , event)
      event.target.blur()

      this.$forceUpdate()
    }
  }
}
</script>
