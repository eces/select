<template lang="pug">
div
  canvas(:id='id' :width='width' :height='height')
</template>
<script>
import Chart from 'chart.js/auto'

export default {
  data: () => {
    return {
      id: 'chart'+Date.now() + Math.floor(Math.random()*1000),
    }
  },
  props: ['type', 'width', 'height', 'data', 'options'],
  mounted () {
    setTimeout(() => {
      const ctx = document.getElementById(this.id)
      
      const myChart = new Chart(ctx, {
        type: this.type,
        data: this.data, 
        options: Object.assign({
          responsive: false,        
        }, this.options), 
      })
    }, 100)
  }
}
</script>

<style>
</style>