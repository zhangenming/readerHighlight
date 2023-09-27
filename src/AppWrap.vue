<script setup lang="ts">
import { defineAsyncComponent } from "vue"

const App = defineAsyncComponent(() => import("./App.vue"))
</script>

<template>
  <App />
</template>
