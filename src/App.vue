<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavToggle from './views/NavToggle.vue'
</script>

<template>
  <div class="layout-container">
    <!-- Linke Seitenleiste -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <!-- VW Logo (Pfad anpassen, falls nötig) -->
        <img
          src="C:/Users/VWM7U5O/my-vue-project/src/assets/logo.png"
          alt="VW Logo"
          class="vw-logo"
        />
        <h1>Certificate Manager App</h1>
      </div>
      <!-- Navigation (NavToggle-Komponente) -->
      <NavToggle />
    </aside>

    <!-- Hauptinhalt -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Gesamtlayout*/
.layout-container {
  display: flex;
  height: 100vh; /* Gesamte Höhe des Viewports */
}

/* Linke Seitenleiste */
.sidebar {
  width: 200px;
  background-color: #ffffff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

/* Header in der Seitenleiste */
.sidebar-header {
  text-align: center;
  margin-top: 20px; /* Weniger Abstand oben */
  margin-bottom: 20px; /* Abstand zu den Navigationselementen */
}

/* VW Logo */
.vw-logo {
  position: relative;
  width: 140px;
  height: 80px;
  margin-bottom: 10px;
}

/* Hauptbereich – nimmt den restlichen Platz ein */
.main-content {
  flex-grow: 1;
  width: calc(100% - 200px); /* Berechnet Platz für den Hauptinhalt */
  max-width: 1000px;
  margin-left: 8%; /* Gleicht Sidebar-Breite aus */
  padding: 2%;
}
</style>
