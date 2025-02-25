<template>
  <div>
    <h1>MQ Zertifikate</h1>

    <!-- Filter -->
    <input v-model="searchSystem" placeholder="Filter by system" />
    <input v-model="searchStage" placeholder="Filter by Stage" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      Sortiere nach Datum ({{ sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend' }})
    </button>

    <!-- Add New Certificate Button -->
    <button @click="showModal = true" class="add-button">Add New Certificate</button>

    <!-- New Certificate Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Edit Certificate' : 'Add New Certificate' }}</h2>

        <label>System:</label>
        <input v-model="editedCertificate.system" type="text" />

        <label>Stage:</label>
        <input v-model="editedCertificate.stage" type="text" />

        <label>Server:</label>
        <input v-model="editedCertificate.server" type="text" />

        <label>Zertifikatsname:</label>
        <input v-model="editedCertificate.zertifikatsname" type="text" />

        <label>Gültigkeit:</label>
        <input v-model="editedCertificate.gueltigkeit" type="date" />

        <label>Zweck:</label>
        <input v-model="editedCertificate.zweck" type="text" />

        <label>MQ:</label>
        <input v-model="editedCertificate.mq" type="text" />

        <label>Channel:</label>
        <input v-model="editedCertificate.channel" type="text" />

        <label>Typ:</label>
        <input v-model="editedCertificate.typ" type="text" />

        <button @click="saveCertificate">{{ isEditing ? 'Update' : 'Save' }}</button>
        <button @click="closeModal" class="cancel-button">Cancel</button>
      </div>
    </div>

    <!-- Dynamische Tabelle -->
    <table>
      <thead>
        <tr>
          <th v-for="(label, key) in columnMapping" :key="key">
            {{ label }}
          </th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="certificate in sortedCertificates" :key="certificate.id">
          <td v-for="key in Object.keys(columnMapping)" :key="key">
            {{ certificate[key] }}
          </td>
          <td>
            <button @click="editCertificate(certificate)">Bearbeiten</button>
            <button @click="deleteCertificate(certificate.id)" class="delete-button">
              Löschen
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Zertifikatsdaten und Filter
const certificates = ref([])
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const isEditing = ref(false)
const editedCertificate = ref({
  id: null,
  system: '',
  stage: '',
  server: '',
  zertifikatsname: '',
  gueltigkeit: '',
  zweck: '',
  mq: '',
  channel: '',
  typ: 'MQZertifikate',
})

// Spalten-Mapping
const columnMapping = {
  id: 'ID',
  system: 'System',
  stage: 'Stage',
  server: 'Server',
  zertifikatsname: 'Zertifikatsname',
  gueltigkeit: 'Gültigkeit',
  zweck: 'Zweck',
  mq: 'MQ',
  channel: 'Channel',
  typ: 'Typ',
}

// Daten abrufen
onMounted(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/certificates')
    certificates.value = await response.json()
  } catch (error) {
    console.error('Error fetching MQ certificates:', error)
  }
})

// Sortierreihenfolge wechseln
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// Gefilterte & sortierte Zertifikate berechnen
const sortedCertificates = computed(() => {
  return certificates.value
    .filter(
      (certificate) =>
        certificate.typ === 'MQZertifikate' &&
        certificate.system.toLowerCase().includes(searchSystem.value.toLowerCase()) &&
        certificate.stage.toLowerCase().includes(searchStage.value.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = new Date(a.gueltigkeit).getTime()
      const dateB = new Date(b.gueltigkeit).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
})

// Neues oder bearbeitetes Zertifikat speichern
const saveCertificate = async () => {
  if (isEditing.value) {
    await fetch(`http://localhost:8080/api/certificates/${editedCertificate.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedCertificate.value),
    })
  } else {
    const response = await fetch('http://localhost:8080/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedCertificate.value),
    })
    const addedCertificate = await response.json()
    certificates.value.push(addedCertificate)
  }
  closeModal()
}

// Zertifikat bearbeiten
const editCertificate = (certificate) => {
  editedCertificate.value = { ...certificate }
  isEditing.value = true
  showModal.value = true
}

// Zertifikat löschen
const deleteCertificate = async (id) => {
  await fetch(`http://localhost:8080/api/certificates/${id}`, { method: 'DELETE' })
  certificates.value = certificates.value.filter((cert) => cert.id !== id)
}

// Modal schließen
const closeModal = () => {
  showModal.value = false
  isEditing.value = false
  editedCertificate.value = {
    id: null,
    system: '',
    stage: '',
    server: '',
    zertifikatsname: '',
    gueltigkeit: '',
    zweck: '',
    mq: '',
    channel: '',
    typ: 'MQZertifikate',
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

/* Form Styles */
input {
  width: 100%;
  padding: 5px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
}
</style>
