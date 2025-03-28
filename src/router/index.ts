// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Systemuser from '@/views/Systemuser.vue'
import ProxyZertifikate from '@/views/ProxyZertifikate.vue'
import Devstack from '@/views/Devstack.vue'
import MqSystemuserUndZertifikate from '@/views/mqSystemuserUndZertifikate.vue'
import rvsZertifikate from '@/views/rvsZertifikate.vue'
import MySQLUserUndZertifikate from '@/views/mySqlUserUndZertifikate.vue'
import mySQlUsermitPasswortablauf from '@/views/mySQlUsermitPasswortablauf.vue'
import OracleUserMitPasswortablauf from '@/views/OracleUserMitPasswortablauf.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Systemuser',
      component: Systemuser,
    },
    {
      path: '/devstack',
      name: 'devstack',
      component: Devstack,
    },
    {
      path: '/proxy-certificates',
      name: 'ProxyZertifikate',
      component: ProxyZertifikate,
    },
    {
      path: '/mqSystemuserUndZertifikate',
      name: 'mqSystemuserUndZertifikate',
      component: MqSystemuserUndZertifikate,
    },
    {
      path: '/rvsZertifikate',
      name: 'rvsZertifikate',
      component: rvsZertifikate,
    },
    {
      path: '/MySQLUserUndZertifikate',
      name: 'MySQLUserUndZertifikate',
      component: MySQLUserUndZertifikate,
    },
    {
      path: '/mySQlUsermitPasswortablauf',
      name: 'mySQlUsermitPasswortablauf',
      component: mySQlUsermitPasswortablauf,
    },
    {
      path: '/OracleUserMitPasswortablauf',
      name: 'OracleUserMitPasswortablauf',
      component: OracleUserMitPasswortablauf,
    },
  ],
})

export default router
