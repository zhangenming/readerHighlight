<script setup lang="ts">
import { ref } from "vue"

const time = ref("")

setInterval(() => {
  time.value = new Date().toTimeString().slice(0, 8)
}, 1000)
</script>

<template>
  <div>
    <div style="position: fixed; bottom: 0px; right: 0px; font-weight: 900">
      {{ time }}
    </div>
  </div>
</template>
