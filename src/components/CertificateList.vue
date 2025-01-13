<template>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>System</th>
        <th>Stage</th>
        <th>Name</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="certificate in certificates" :key="certificate.id">
        <td>{{ certificate.id }}</td>
        <td>{{ certificate.system }}</td>
        <td>{{ certificate.stage }}</td>
        <td>{{ certificate.zertifikatsname }}</td>
        <td>{{ certificate.typ }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps({
  certificates: Array,
})
</script>
