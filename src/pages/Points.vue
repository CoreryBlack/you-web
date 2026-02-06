<template>
  <div>
    <!-- Points page removed. Redirecting to Home. -->
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'PointsRemoved',
  setup() {
    const router = useRouter()
    onMounted(() => {
      router.replace({ name: 'Home' })
    })
    return {}
  }
})
</script>
