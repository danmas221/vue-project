<template>
  <div>
    <h1>Systemuser und deren Zertifikate</h1>

    <!-- Filter -->
    <input v-model="searchSystem" placeholder="Filter by System" />
    <input v-model="searchStage" placeholder="Filter by Stage" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      Sortiere nach Gültigkeit ({{ sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend' }})
    </button>

    <!-- Add New Certificate Button -->
    <button @click="openModal(null)" class="add-button">Add New Certificate</button>

    <!-- New Certificate Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingCertificate ? 'Edit Certificate' : 'Add New Certificate' }}</h2>

        <!-- Hier werden System und Stage in einem verschachtelten Objekt abgelegt -->
        <label>System:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>Stage:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>Systemuser:</label>
        <input v-model="newCertificate.systemuser" type="text" />

        <label>Server:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>Zertifikatsname:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>Gültigkeit:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <label>Zweck:</label>
        <input v-model="newCertificate.zweck" type="text" />

        <label>Typ:</label>
        <input v-model="newCertificate.typ" type="text" />

        <button @click="saveCertificate">Save</button>
        <button @click="showModal = false" class="cancel-button">Cancel</button>
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
          <td>{{ certificate.system }}</td>
          <td>{{ certificate.stage }}</td>
          <td>{{ certificate.systemuser }}</td>
          <td>{{ certificate.server }}</td>
          <td>{{ certificate.zertifikatsname }}</td>
          <td>{{ certificate.gueltigkeit }}</td>
          <td>{{ certificate.zweck }}</td>
          <td>{{ certificate.typ }}</td>
          <td>
            <button @click="openModal(certificate)">Bearbeiten</button>
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

// Original-Daten aus der API (BigTable-Datensätze)
const certificates = ref([])

// Filterfelder
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingCertificate = ref(null)

// Standardwerte für ein neues Zertifikat; der Typ wird automatisch gesetzt.
// Beachte: System und Stage sind in einem Objekt (systemStage) abgelegt.
const newCertificate = ref({
  systemStage: {
    system: '',
    stage: '',
  },
  systemuser: '',
  server: '',
  zertifikatsname: '',
  gueltigkeit: '',
  zweck: '',
  typ: 'Systemuser und deren Zertifikate',
})

// Mapping für die Spaltenüberschriften
const columnMapping = {
  system: 'System',
  stage: 'Stage',
  systemuser: 'Systemuser',
  server: 'Server',
  zertifikatsname: 'Zertifikatsname',
  gueltigkeit: 'Gültigkeit',
  zweck: 'Zweck',
  typ: 'Typ',
}

// Beim Laden der Komponente: Hole alle Einträge aus der BigTable-API
onMounted(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/bigtable')
    const data = await response.json()
    certificates.value = data
  } catch (error) {
    console.error('Error fetching certificates:', error)
  }
})

// Umschalten der Sortierreihenfolge
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// Berechnete Liste:
// 1. Filtere nach dem Typ "Systemuser und deren Zertifikate".
// 2. Mappe jeden Datensatz, sodass system und stage aus dem verschachtelten systemStage-Objekt gezogen werden
//    und systemuser direkt.
const sortedCertificates = computed(() => {
  return certificates.value
    .filter((certificate) => certificate.typ === 'Systemuser und deren Zertifikate')
    .map((certificate) => {
      return {
        id: certificate.id,
        system: certificate.systemStage ? certificate.systemStage.system : '',
        stage: certificate.systemStage ? certificate.systemStage.stage : '',
        systemuser: certificate.systemuser || '', // systemuser direkt aus dem Zertifikat
        server: certificate.server,
        zertifikatsname: certificate.zertifikatsname,
        gueltigkeit: certificate.gueltigkeit,
        zweck: certificate.zweck,
        typ: certificate.typ,
      }
    })
    .filter(
      (cert) =>
        cert.system.toLowerCase().includes(searchSystem.value.toLowerCase()) &&
        cert.stage.toLowerCase().includes(searchStage.value.toLowerCase()),
    )
    .sort((a, b) => {
      const dateA = new Date(a.gueltigkeit).getTime()
      const dateB = new Date(b.gueltigkeit).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
})

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Zertifikats.
const openModal = (certificate) => {
  if (certificate) {
    editingCertificate.value = certificate
    newCertificate.value = {
      systemStage: {
        system: certificate.system,
        stage: certificate.stage,
      },
      systemuser: certificate.systemuser,
      server: certificate.server,
      zertifikatsname: certificate.zertifikatsname,
      gueltigkeit: certificate.gueltigkeit,
      zweck: certificate.zweck,
      typ: certificate.typ,
    }
  } else {
    editingCertificate.value = null
    newCertificate.value = {
      systemStage: {
        system: '',
        stage: '',
      },
      systemuser: '',
      server: '',
      zertifikatsname: '',
      gueltigkeit: '',
      zweck: '',
      typ: 'Systemuser und deren Zertifikate',
    }
  }
  showModal.value = true
}

// Speichert (hinzufügen oder updaten) ein Zertifikat
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
        const updatedCertificate = await response.json()
        const index = certificates.value.findIndex((c) => c.id === updatedCertificate.id)
        certificates.value[index] = updatedCertificate
      }
    } catch (error) {
      console.error('Error updating certificate:', error)
    }
  } else {
    try {
      const response = await fetch('http://localhost:8080/api/bigtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCertificate.value),
      })
      if (response.ok) {
        const addedCertificate = await response.json()
        certificates.value.push(addedCertificate)
      }
    } catch (error) {
      console.error('Error adding certificate:', error)
    }
  }
  showModal.value = false
}

// Löscht ein Zertifikat
const deleteCertificate = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      certificates.value = certificates.value.filter((c) => c.id !== id)
    }
  } catch (error) {
    console.error('Error deleting certificate:', error)
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
