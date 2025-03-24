<template>
  <div>
    <h1>MySQL User mit Passwortablauf</h1>

    <!-- Filter -->
    <input v-model="searchSystem" placeholder="Filter by System" />
    <input v-model="searchStage" placeholder="Filter by Stage" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      Sortiere nach Gültigkeit ({{ sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend' }})
    </button>

    <!-- Add New User Button -->
    <button @click="openModal(null)" class="add-button">Add New MySQL User</button>

    <!-- New User Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingUser ? 'Edit MySQL User' : 'Add New MySQL User' }}</h2>

        <!-- Eingaben -->
        <label>System:</label>
        <input v-model="newUser.systemStage.system" type="text" />

        <label>Stage:</label>
        <input v-model="newUser.systemStage.stage" type="text" />

        <label>MySQL User:</label>
        <input v-model="newUser.mysqlUser" type="text" />

        <label>Server:</label>
        <input v-model="newUser.server" type="text" />

        <label>Gültigkeit:</label>
        <input v-model="newUser.gueltigkeit" type="date" />

        <label>Zweck:</label>
        <input v-model="newUser.zweck" type="text" />

        <button @click="saveUser">Save</button>
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
          <td>{{ entry.mysqlUser }}</td>
          <td>{{ entry.server }}</td>
          <td>{{ entry.gueltigkeit }}</td>
          <td>{{ entry.zweck }}</td>
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

// MySQL User mit Passwortablauf-Daten aus der API (angenommen in der Tabelle bigtable mit Typ "MySQL User mit Passwortablauf")
const entries = ref([])
// SystemStage-Mapping-Daten aus dem API
const systemStages = ref([])

// Filterfelder
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingUser = ref(null)

// Standardwerte für einen neuen MySQL User
const newUser = ref({
  systemStage: { system: '', stage: '' },
  mysqlUser: '',
  server: '',
  gueltigkeit: '',
  zweck: '',
  // Der Typ wird fest auf "MySQL User mit Passwortablauf" gesetzt
  typ: 'MySQL User mit Passwortablauf',
})

// Mapping für die Spaltenüberschriften
const columnMapping = {
  system: 'System',
  stage: 'Stage',
  mysqlUser: 'MySQL User',
  server: 'Server',
  gueltigkeit: 'Gültigkeit',
  zweck: 'Zweck',
}

// Beim Laden der Komponente: Hole die MySQL User und das SystemStage-Mapping
onMounted(async () => {
  try {
    const resMySQL = await fetch('http://localhost:8080/api/bigtable')
    // Filtern: Wir nehmen nur die Einträge mit Typ "MySQL User mit Passwortablauf"
    entries.value = (await resMySQL.json()).filter(
      (item) => item.typ === 'MySQL User mit Passwortablauf',
    )
  } catch (error) {
    console.error('Error fetching MySQL users:', error)
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
        mysqlUser: entry.mysqlUser || '',
        server: entry.server || '',
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

// Öffnet das Modal zum Bearbeiten oder Erstellen eines MySQL Users.
const openModal = (entry) => {
  if (entry) {
    editingUser.value = entry
    newUser.value = {
      systemStage: { system: entry.system, stage: entry.stage },
      mysqlUser: entry.mysqlUser,
      server: entry.server,
      gueltigkeit: entry.gueltigkeit,
      zweck: entry.zweck,
      typ: 'MySQL User mit Passwortablauf',
    }
  } else {
    editingUser.value = null
    newUser.value = {
      systemStage: { system: '', stage: '' },
      mysqlUser: '',
      server: '',
      gueltigkeit: '',
      zweck: '',
      typ: 'MySQL User mit Passwortablauf',
    }
  }
  showModal.value = true
}

// Speichert (hinzufügen oder updaten) einen MySQL User.
const saveUser = async () => {
  if (editingUser.value) {
    try {
      const response = await fetch(`http://localhost:8080/api/bigtable/${editingUser.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser.value),
      })
      if (response.ok) {
        const updatedEntry = await response.json()
        const index = entries.value.findIndex((e) => e.id === updatedEntry.id)
        entries.value[index] = updatedEntry
      }
    } catch (error) {
      console.error('Error updating MySQL user:', error)
    }
  } else {
    try {
      const response = await fetch('http://localhost:8080/api/bigtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser.value),
      })
      if (response.ok) {
        const addedEntry = await response.json()
        entries.value.push(addedEntry)
      }
    } catch (error) {
      console.error('Error adding MySQL user:', error)
    }
  }
  showModal.value = false
}

// Löscht einen MySQL User.
const deleteEntry = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      entries.value = entries.value.filter((e) => e.id !== id)
    }
  } catch (error) {
    console.error('Error deleting MySQL user:', error)
  }
}
</script>

<style scoped>
h1 {
  color: #2c3e50;
}
input {
  margin: 5px;
}
button {
  margin: 5px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: left;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
}
.add-button,
.cancel-button,
.delete-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}
.cancel-button {
  background-color: #dc3545;
}
.delete-button {
  background-color: #dc3545;
}
</style>
