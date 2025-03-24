<template>
  <div>
    <h1>MQ Systemuser und Zertifikate</h1>

    <!-- Filter -->
    <input v-model="searchSystem" placeholder="Filter by System" />
    <input v-model="searchStage" placeholder="Filter by Stage" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      Sortiere nach Gültigkeit ({{ sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend' }})
    </button>

    <!-- Add New Certificate Button -->
    <button @click="openModal(null)" class="add-button">Add New MQ Certificate</button>

    <!-- New Certificate Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingCertificate ? 'Edit MQ Certificate' : 'Add New MQ Certificate' }}</h2>

        <!-- Eingaben -->
        <label>System:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>Stage:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>MQ:</label>
        <input v-model="newCertificate.mq" type="text" />

        <label>Channel:</label>
        <input v-model="newCertificate.channel" type="text" />

        <label>Systemuser:</label>
        <input v-model="newCertificate.systemuser" type="text" />

        <label>Server:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>Zertifikatsname:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>Issuer:</label>
        <input v-model="newCertificate.issuer" type="text" />

        <label>Gültigkeit:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <button @click="saveCertificate">Save</button>
        <button @click="showModal = false" class="cancel-button">Cancel</button>
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
          <td>{{ entry.mq }}</td>
          <td>{{ entry.channel }}</td>
          <td>{{ entry.systemuser }}</td>
          <td>{{ entry.server }}</td>
          <td>{{ entry.zertifikatsname }}</td>
          <td>{{ entry.issuer }}</td>
          <td>{{ entry.gueltigkeit }}</td>
          <td>
            <button @click="openModal(entry)">Bearbeiten</button>
            <button @click="deleteEntry(entry.id)" class="delete-button">Löschen</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// MQ-Zertifikats-Daten aus der API (angenommen in der Tabelle bigtable mit Typ "MQ Systemuser und Zertifikate")
const entries = ref([])
// SystemStage-Mapping-Daten aus dem API
const systemStages = ref([])

// Filterfelder
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingCertificate = ref(null)

// Standardwerte für ein neues MQ-Zertifikat
const newCertificate = ref({
  systemStage: { system: '', stage: '' },
  mq: '',
  channel: '',
  systemuser: '',
  server: '',
  zertifikatsname: '',
  issuer: '',
  gueltigkeit: '',
  // Der Typ wird fest auf "MQ Systemuser und Zertifikate" gesetzt
  typ: 'MQ Systemuser und Zertifikate',
})

// Mapping für die Spaltenüberschriften
const columnMapping = {
  system: 'System',
  stage: 'Stage',
  mq: 'MQ',
  channel: 'Channel',
  systemuser: 'Systemuser',
  server: 'Server',
  zertifikatsname: 'Zertifikatsname',
  issuer: 'Issuer',
  gueltigkeit: 'Gültigkeit',
}

// Beim Laden der Komponente: Hole die MQ-Zertifikate und das SystemStage-Mapping
onMounted(async () => {
  try {
    const resMQ = await fetch('http://localhost:8080/api/bigtable')
    // Filtern: Wir nehmen nur die Einträge mit Typ "MQ Systemuser und Zertifikate"
    entries.value = (await resMQ.json()).filter(
      (item) => item.typ === 'MQ Systemuser und Zertifikate',
    )
  } catch (error) {
    console.error('Error fetching MQ certificates:', error)
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
        mq: entry.mq || '',
        channel: entry.channel || '',
        systemuser: entry.systemuser || '',
        server: entry.server || '',
        zertifikatsname: entry.zertifikatsname || '',
        issuer: entry.issuer || '',
        gueltigkeit: entry.gueltigkeit || '',
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
      mq: entry.mq,
      channel: entry.channel,
      systemuser: entry.systemuser,
      server: entry.server,
      zertifikatsname: entry.zertifikatsname,
      issuer: entry.issuer,
      gueltigkeit: entry.gueltigkeit,
      typ: 'MQ Systemuser und Zertifikate',
    }
  } else {
    editingCertificate.value = null
    newCertificate.value = {
      systemStage: { system: '', stage: '' },
      mq: '',
      channel: '',
      systemuser: '',
      server: '',
      zertifikatsname: '',
      issuer: '',
      gueltigkeit: '',
      typ: 'MQ Systemuser und Zertifikate',
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
      console.error('Error updating MQ certificate:', error)
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
      console.error('Error adding MQ certificate:', error)
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
    console.error('Error deleting MQ certificate:', error)
  }
}
</script>

<style scoped>
/* Tabellen-Stile */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th,
td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}
th {
  background-color: #9f4141;
}
tr:nth-child(even) {
  background-color: #112417;
}
tr:hover {
  background-color: #21050549;
}

/* Buttons */
button {
  margin: 5px;
  padding: 7px 12px;
  background-color: #312525;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
button:hover {
  background-color: #7e3232;
}
/* Add New Certificate Button */
.add-button {
  background-color: #28a745;
}
.add-button:hover {
  background-color: #218838;
}
/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}
.cancel-button {
  background-color: red;
}
.cancel-button:hover {
  background-color: darkred;
}
</style>
