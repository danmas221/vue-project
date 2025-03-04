// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Systemuser from '@/views/Systemuser.vue'
import MQCertificates from '@/views/MQCertificates.vue'
import ProxyZertifikate from '@/views/ProxyZertifikate.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Systemuser',
      component: Systemuser,
    },
    {
      path: '/mq-certificates',
      name: 'mq-certificates',
      component: MQCertificates,
    },
    {
      path: '/proxy-certificates', // Definiere den Pfad für die neue Route
      name: 'ProxyZertifikate',
      component: ProxyZertifikate,
    },
  ],
})

export default router
