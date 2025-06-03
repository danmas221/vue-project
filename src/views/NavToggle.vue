<template>
  <div>
    <button @click="toggleNav">{{ isNavOpen ? $t('toggleNav') : $t('maximizeNav') }}</button>
    <nav v-if="isNavOpen">
      <h2 class="nav-title">{{ $t('navigation') }}</h2>
      <RouterLink to="/">{{ $t('systemuser_certificates') }}</RouterLink>
      <RouterLink to="/devstack">{{ $t('devstack_certificates') }}</RouterLink>
      <RouterLink to="/proxy-certificates">{{ $t('proxy_certificates') }}</RouterLink>
      <RouterLink to="/mqSystemuserUndZertifikate">{{
        $t('mq_systemuser_certificates')
      }}</RouterLink>
      <RouterLink to="/rvsZertifikate">{{ $t('rvs_certificates') }}</RouterLink>
      <RouterLink to="/MySQLUserUndZertifikate">{{ $t('mysql_user_certificates') }}</RouterLink>
      <RouterLink to="/mySQlUsermitPasswortablauf">{{
        $t('mysql_user_password_expiration')
      }}</RouterLink>
      <RouterLink to="/OracleUserMitPasswortablauf">{{
        $t('oracle_user_password_expiration')
      }}</RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n() // Zugriff auf i18n
const isNavOpen = ref(false)

const toggleNav = () => {
  isNavOpen.value = !isNavOpen.value
}

const switchLanguage = () => {
  locale.value = locale.value === 'en' ? 'de' : 'en' // Umschalten zwischen 'en' und 'de'
}
</script>

<style scoped>
body {
  background-color: var(--color-background);
  font-family: 'Roboto', sans-serif;
  color: rgb(0, 0, 0);
}

button {
  position: absolute;
  left: 55px;
  top: 250px;
  background-color: #0d4671;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2873ac;
}

nav {
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  border-radius: 8px;
  width: 200px;
  font-size: 14px;
  text-align: center;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  margin-bottom: 10px;
  color: black;
}

nav a:first-of-type {
  border: 0;
}
</style>
