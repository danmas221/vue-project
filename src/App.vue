<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <h2 class="nav-title">Navigation</h2>
        <RouterLink to="/">Systemuser Zertifikate</RouterLink>
        <RouterLink to="/devstack">Devstack Zertifikate</RouterLink>
        <RouterLink to="/proxy-certificates">Proxy Zertifikate</RouterLink>
        <RouterLink to="/mqSystemuserUndZertifikate">MQ Systemuser</RouterLink>
        <RouterLink to="/rvsZertifikate">RVS Zertifikate</RouterLink>
        <RouterLink to="/MySQLUserUndZertifikate">MySQL User und Zertifikate</RouterLink>
        <RouterLink to="/mySQlUsermitPasswortablauf">MySQL User mit Passwortablauf</RouterLink>
        <RouterLink to="/OracleUserMitPasswortablauf">OracleUser Mit Passwortablauf</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
body {
  background-color: #ffffff; /* Weißer Hintergrund */
  font-family: 'Roboto', sans-serif;
  color: #000000;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  border: 2px solid var(--color-border);
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.nav-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem; /* Mehr Abstand zu den Links */
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
