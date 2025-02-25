// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Systemuser from '@/views/Systemuser.vue'
import MQCertificates from '@/views/MQCertificates.vue'

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
  ],
})

export default router
