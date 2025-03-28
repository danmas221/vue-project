<template>
  <div>
    <h1>{{ $t('title') }}</h1>

    <button class="switchLanguage" @click="switchLanguage">
      <!-- Zeigt 🇬🇧, wenn die aktuelle Sprache Deutsch ist, sonst 🇩🇪 -->
      {{ locale === 'de' ? '🇬🇧' : '🇩🇪' }}
    </button>

    <!-- Filter -->
    <input v-model="searchSystem" :placeholder="$t('filter_system')" />
    <input v-model="searchStage" :placeholder="$t('filter_stage')" />

    <!-- Sortier-Button -->
    <button @click="toggleSortOrder">
      {{ $t('sort_validity', { order: sortOrder === 'asc' ? $t('ascending') : $t('descending') }) }}
    </button>

    <!-- Add New Certificate Button -->
    <button @click="openModal(null)" class="add-button">
      {{ $t('add_cert') }}
    </button>

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

        <button @click="saveCertificate">{{ $t('save') }}</button>
        <button @click="showModal = false" class="cancel-button">{{ $t('cancel') }}</button>
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
            <button @click="openModal(certificate)" class="edit-button">{{ $t('edit') }}</button>
            <button @click="deleteEntry(certificate.id)" class="delete-button">
              {{ $t('delete') }}
            </button>
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

const switchLanguage = () => {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
// Aktuelle Sprache als String (für den Button)
const currentLanguage = computed(() => locale.value)

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
const deleteEntry = async (id) => {
  try {
    const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      certificates.value = certificates.value.filter((e) => e.id !== id)
    }
  } catch (error) {
    console.error('Error deleting Oracle user:', error)
  }
}
</script>
