<template>
  <div id="app">
    <div class="locale-changer">
      <select v-model="$i18n.locale">
        <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">
          {{ lang }}
        </option>
      </select>
    </div>

    <router-view />
  </div>
</template>
<script>

import { languages } from './i18n/messages';

export default {
  data() {
    return { langs: languages }
  }
}
</script>
