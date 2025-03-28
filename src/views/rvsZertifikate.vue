<template>
  <div>
    <h1>RVS Zertifikate</h1>

    <button class="switchLanguage" @click="switchLanguage">🇩🇪 / 🇬🇧</button>
    <!-- Filter -->
    <input v-model="searchSystem" :placeholder="$t('filter_system')" />
    <input v-model="searchStage" :placeholder="$t('filter_stage')" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      {{ $t('sort_validity', { order: sortOrder === 'asc' ? $t('ascending') : $t('descending') }) }}
    </button>

    <button @click="openModal(null)" class="add-button">
      {{ $t('add_cert') }}
    </button>
    <!-- New Certificate Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingCertificate ? 'Edit RVS Certificate' : 'Add New RVS Certificate' }}</h2>

        <!-- Eingaben -->
        <label>System:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>Stage:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>RVS Station:</label>
        <input v-model="newCertificate.rvsStation" type="text" />

        <label>Server:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>Zertifikatsname:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>Odette ID:</label>
        <input v-model="newCertificate.odetteId" type="text" />

        <label>Gültigkeit:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <label>Zweck:</label>
        <input v-model="newCertificate.zweck" type="text" />

        <button @click="saveCertificate">{{ $t('save') }}</button>
        <button @click="showModal = false" class="cancel-button">{{ $t('cancel') }}</button>
      </div>
    </div>

    <!-- Dynamische Tabelle -->
    <table>
      <thead>
        <tr>
          <th v-for="(label, key) in columnMapping" :key="key">{{ label }}</th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in sortedEntries" :key="entry.id">
          <td>{{ entry.system }}</td>
          <td>{{ entry.stage }}</td>
          <td>{{ entry.rvsStation }}</td>
          <td>{{ entry.server }}</td>
          <td>{{ entry.zertifikatsname }}</td>
          <td>{{ entry.odetteId }}</td>
          <td>{{ entry.gueltigkeit }}</td>
          <td>{{ entry.zweck }}</td>
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

const { locale } = useI18n()
// RVS-Zertifikats-Daten aus der API (angenommen in der Tabelle bigtable mit Typ "RVS Zertifikate")
const entries = ref([])
// SystemStage-Mapping-Daten aus dem API
const systemStages = ref([])
const switchLanguage = () => {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
// Filterfelder
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingCertificate = ref(null)

// Standardwerte für ein neues RVS-Zertifikat
const newCertificate = ref({
  systemStage: { system: '', stage: '' },
  rvsStation: '',
  server: '',
  zertifikatsname: '',
  odetteId: '',
  gueltigkeit: '',
  zweck: '',
  // Der Typ wird fest auf "RVS Zertifikate" gesetzt
  typ: 'RVS Zertifikate',
})

// Mapping für die Spaltenüberschriften
const columnMapping = {
  system: 'System',
  stage: 'Stage',
  rvsStation: 'RVS Station',
  server: 'Server',
  zertifikatsname: 'Zertifikatsname',
  odetteId: 'Odette ID',
  gueltigkeit: 'Gültigkeit',
  zweck: 'Zweck',
}

// Beim Laden der Komponente: Hole die RVS-Zertifikate und das SystemStage-Mapping
onMounted(async () => {
  try {
    const resRVS = await fetch('http://localhost:8080/api/bigtable')
    // Filtern: Wir nehmen nur die Einträge mit Typ "RVS Zertifikate"
    entries.value = (await resRVS.json()).filter((item) => item.typ === 'RVS Zertifikate')
  } catch (error) {
    console.error('Error fetching RVS certificates:', error)
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

// Berechnete Liste: Für jeden Eintrag prüfen wir, ob ein verschachteltes systemStage vorhanden ist.
// Falls nicht, versuchen wir anhand von entry.systemID (als Zahl) im systemStages-Mapping den korrekten System- und Stage-Wert zu ermitteln.
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
        rvsStation: entry.rvsStation || '',
        server: entry.server || '',
        zertifikatsname: entry.zertifikatsname || '',
        odetteId: entry.odetteId || '',
        gueltigkeit: entry.gueltigkeit || '',
        zweck: entry.zweck || '',
      }
    })
    .filter(
      (entry) =>
        entry.system.toLowerCase().includes(searchSystem.value.toLowerCase()) &&
        entry.stage.toLowerCase().includes(searchStage.value.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = new Date(a.gueltigkeit).getTime()
      const dateB = new Date(b.gueltigkeit).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
})

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Zertifikats.
const openModal = (entry) => {
  if (entry) {
    editingCertificate.value = entry
    newCertificate.value = {
      systemStage: { system: entry.system, stage: entry.stage },
      rvsStation: entry.rvsStation,
      server: entry.server,
      zertifikatsname: entry.zertifikatsname,
      odetteId: entry.odetteId,
      gueltigkeit: entry.gueltigkeit,
      zweck: entry.zweck,
      typ: 'RVS Zertifikate',
    }
  } else {
    editingCertificate.value = null
    newCertificate.value = {
      systemStage: { system: '', stage: '' },
      rvsStation: '',
      server: '',
      zertifikatsname: '',
      odetteId: '',
      gueltigkeit: '',
      zweck: '',
      typ: 'RVS Zertifikate',
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
      console.error('Error updating RVS certificate:', error)
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
      console.error('Error adding RVS certificate:', error)
    }
  }
  showModal.value = false
}

// Löscht ein Zertifikat.
const deleteEntry = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      entries.value = entries.value.filter((e) => e.id !== id)
    }
  } catch (error) {
    console.error('Error deleting RVS certificate:', error)
  }
}
</script>
