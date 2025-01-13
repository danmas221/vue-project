<template>
  <div>
    <h1>Certificate Manager</h1>
    <CertificateList :certificates="certificates" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CertificateList from '@/components/CertificateList.vue'

const certificates = ref([])

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/certificates')
    certificates.value = await response.json()
  } catch (error) {
    console.error('Error fetching certificates:', error)
  }
})
</script>
