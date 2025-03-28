<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import NavToggle from './views/NavToggle.vue'
</script>

<template>
  <header>
    <div class="wrapper">
      <NavToggle />
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
body {
  background-color: var(--color-background); /* Dynamischer Hintergrund */
  font-family: 'Roboto', sans-serif;
  color: var(--color-text); /* Dynamische Textfarbe */
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  border-radius: 8px;
  width: 100px;
  font-size: 14px;
  text-align: center;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 10px;
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 5);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
