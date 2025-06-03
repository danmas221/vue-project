<template>
  <div>
    <h1>{{ $t('proxy_certificates') }}</h1>

    <div class="controls-container">
      <!-- Sprachumschalter -->
      <button class="switchLanguage" @click="switchLanguage">
        {{ locale === 'de' ? '🇬🇧' : '🇩🇪' }}
      </button>

      <!-- Filterfelder -->
      <input v-model="searchSystem" :placeholder="$t('filter_system')" />
      <input v-model="searchStage" :placeholder="$t('filter_stage')" />
      <input v-model="searchZone" :placeholder="$t('filter_zone')" />

      <!-- Sortier-Button -->
      <button @click="toggleSortOrder">
        {{
          $t('sort_validity', { order: sortOrder === 'asc' ? $t('ascending') : $t('descending') })
        }}
      </button>

      <!-- Button zum Hinzufügen eines neuen Zertifikats -->
      <button @click="openModal(null)" class="add-button">
        {{ $t('add_cert') }}
      </button>
    </div>

    <!-- New Certificate Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>
          {{ editingCertificate ? $t('edit') : $t('add_cert') }}
        </h2>
        <!-- Eingaben -->
        <label>{{ $t('system_column') }}:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>{{ $t('stage_column') }}:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>{{ $t('zone_column') }}:</label>
        <input v-model="newCertificate.zone" type="text" />

        <label>{{ $t('server_column') }}:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>{{ $t('installation_directory_column') }}:</label>
        <input v-model="newCertificate.installationsverzeichnis" type="text" />

        <label>{{ $t('certificate_name_column') }}:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>{{ $t('validity_column') }}:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <label>{{ $t('type_column') }}:</label>
        <input v-model="newCertificate.typ" type="text" />

        <button @click="saveCertificate">{{ $t('save') }}</button>
        <button @click="showModal = false" class="cancel-button">{{ $t('cancel') }}</button>
      </div>
    </div>

    <!-- Dynamische Tabelle -->
    <table>
      <thead>
        <tr>
          <th v-for="(label, key) in columnMapping" :key="key">{{ label }}</th>
          <th>{{ $t('action_column') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in sortedEntries" :key="entry.id">
          <td>{{ entry.system }}</td>
          <td>{{ entry.stage }}</td>
          <td>{{ entry.zone }}</td>
          <td>{{ entry.server }}</td>
          <td>{{ entry.installationsverzeichnis }}</td>
          <td>{{ entry.zertifikatsname }}</td>
          <td>{{ entry.gueltigkeit }}</td>
          <td>Proxy Zertifikate</td>
          <td>
            <button @click="openModal(entry)">{{ $t('edit') }}</button>
            <button @click="deleteEntry(entry.id)" class="delete-button">{{ $t('delete') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const switchLanguage = () => {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}

// Einträge aus der API (wir filtern hier nach Typ "Proxy Zertifikate")
const entries = ref([])
// Mapping-Daten aus systemstage (wird benötigt, falls systemStage nicht im Eintrag vorhanden)
const systemStages = ref([])

// Filterfelder
const searchSystem = ref('')
const searchStage = ref('')
const searchZone = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingCertificate = ref(null)

// Standardwerte für ein neues Proxy-Zertifikat
const newCertificate = ref({
  systemStage: { system: '', stage: '' },
  zone: '',
  server: '',
  installationsverzeichnis: '',
  zertifikatsname: '',
  gueltigkeit: '',
  // Typ wird fest auf "Proxy Zertifikate" gesetzt
  typ: 'Proxy Zertifikate',
})

// Mapping für die Spaltenüberschriften (dynamisch übersetzt)
const columnMapping = computed(() => ({
  system: t('system_column'),
  stage: t('stage_column'),
  zone: t('zone_column'),
  server: t('server_column'),
  installationsverzeichnis: t('installation_directory_column'),
  zertifikatsname: t('certificate_name_column'),
  gueltigkeit: t('validity_column'),
  typ: t('type_column'),
}))

// Beim Laden der Komponente: Hole die Daten
onMounted(async () => {
  try {
    const resDevstack = await fetch('http://localhost:8080/api/bigtable')
    const data = await resDevstack.json()
    // Filtere nur Einträge vom Typ "Proxy Zertifikate"
    entries.value = data.filter((item) => item.typ === 'Proxy Zertifikate')
  } catch (error) {
    console.error('Error fetching proxy certificates:', error)
  }
  try {
    const resSystemStage = await fetch('http://localhost:8080/api/systemstage')
    systemStages.value = await resSystemStage.json()
  } catch (error) {
    console.error('Error fetching systemstage entries:', error)
  }
})

// Umschalten der Sortierreihenfolge (Sortierung nach Gültigkeit)
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// Berechnete Liste: Für jeden Eintrag prüfen, ob ein systemStage-Objekt vorhanden ist,
// ansonsten anhand von entry.systemID aus dem Mapping übernehmen.
const sortedEntries = computed(() => {
  return entries.value
    .map((entry) => {
      let system = ''
      let stage = ''
      if (entry.systemStage && entry.systemStage.system && entry.systemStage.stage) {
        system = entry.systemStage.system
        stage = entry.systemStage.stage
      } else if (entry.systemID) {
        const idNum = Number(entry.systemID)
        const mapping = systemStages.value.find(
          (item) => Number(item.systemID) === idNum || Number(item.id) === idNum,
        )
        if (mapping) {
          system = mapping.system
          stage = mapping.stage
        }
      }
      return {
        id: entry.id,
        system,
        stage,
        zone: entry.zone || '',
        server: entry.server || '',
        installationsverzeichnis: entry.installationsverzeichnis || '',
        zertifikatsname: entry.zertifikatsname || '',
        gueltigkeit: entry.gueltigkeit || '',
      }
    })
    .filter(
      (entry) =>
        entry.system.toLowerCase().includes(searchSystem.value.toLowerCase()) &&
        entry.stage.toLowerCase().includes(searchStage.value.toLowerCase()) &&
        entry.zone.toLowerCase().includes(searchZone.value.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = new Date(a.gueltigkeit).getTime()
      const dateB = new Date(b.gueltigkeit).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
})

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Zertifikats
const openModal = (entry) => {
  if (entry) {
    editingCertificate.value = entry
    newCertificate.value = {
      systemStage: { system: entry.system, stage: entry.stage },
      zone: entry.zone,
      systemuser: entry.systemuser, // Bei Proxy Zertifikaten könnte dieser leer sein
      server: entry.server,
      installationsverzeichnis: entry.installationsverzeichnis,
      zertifikatsname: entry.zertifikatsname,
      gueltigkeit: entry.gueltigkeit,
      typ: 'Proxy Zertifikate',
    }
  } else {
    editingCertificate.value = null
    newCertificate.value = {
      systemStage: { system: '', stage: '' },
      zone: '',
      systemuser: '',
      server: '',
      installationsverzeichnis: '',
      zertifikatsname: '',
      gueltigkeit: '',
      typ: 'Proxy Zertifikate',
    }
  }
  showModal.value = true
}

// Speichert (hinzufügen oder updaten) ein Zertifikat.
const saveCertificate = async () => {
  if (editingCertificate.value) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/bigtable/${editingCertificate.value.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCertificate.value),
        },
      )
      if (response.ok) {
        const updatedEntry = await response.json()
        const index = entries.value.findIndex((e) => e.id === updatedEntry.id)
        entries.value[index] = updatedEntry
      }
    } catch (error) {
      console.error('Error updating proxy certificate:', error)
    }
  } else {
    try {
      const response = await fetch('http://localhost:8080/api/bigtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCertificate.value),
      })
      if (response.ok) {
        const addedEntry = await response.json()
        entries.value.push(addedEntry)
      }
    } catch (error) {
      console.error('Error adding proxy certificate:', error)
    }
  }
  showModal.value = false
}

// Löscht ein Zertifikat mit Löschbestätigung
const deleteEntry = async (id) => {
  if (confirm(t('confirm_delete'))) {
    try {
      const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        entries.value = entries.value.filter((e) => e.id !== id)
      }
    } catch (error) {
      console.error('Error deleting proxy certificate:', error)
    }
  }
}
</script>

<style scoped>
.controls-container {
  display: flex;
  align-items: center; /* Vertikale Zentrierung der Elemente */
  gap: 5px; /* Abstand zwischen den Elementen */
}

/* Optional: Zusätzliche Stile für die Buttons und Eingabefelder */
.controls-container input {
  padding: 5px;
  font-size: 12px;
}

.controls-container button {
  padding: 5px 10px;
  font-size: 12px;
}
</style>
