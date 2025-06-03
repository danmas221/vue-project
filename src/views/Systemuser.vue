<template>
  <div>
    <h1>{{ $t('sys_user_title') }}</h1>

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
        <label>{{ $t('system_column') }}:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>{{ $t('stage_column') }}:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>{{ $t('system_user_column') }}:</label>
        <input v-model="newCertificate.systemuser" type="text" />

        <label>{{ $t('server_column') }}:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>{{ $t('certificate_name_column') }}:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>{{ $t('validity_column') }}:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <label>{{ $t('purpose_column') }}:</label>
        <input v-model="newCertificate.zweck" type="text" />

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

const { locale, t } = useI18n()

const switchLanguage = () => {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}

// Filter und Sortierung
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingCertificate = ref(null)

// Original-Daten aus der API (BigTable-Datensätze)
const certificates = ref([])

// Standardwerte für ein neues Zertifikat (System und Stage in einem Objekt abgelegt)
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
const columnMapping = computed(() => ({
  system: t('system_column'),
  stage: t('stage_column'),
  systemuser: t('system_user_column'),
  server: t('server_column'),
  zertifikatsname: t('certificate_name_column'),
  gueltigkeit: t('validity_column'),
  zweck: t('purpose_column'),
  typ: t('type_column'),
}))

// Daten von der API laden
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

// Berechnete Liste: Filter, Mapping und Sortierung
const sortedCertificates = computed(() => {
  return certificates.value
    .filter((certificate) => certificate.typ === 'Systemuser und deren Zertifikate')
    .map((certificate) => ({
      id: certificate.id,
      system: certificate.systemStage ? certificate.systemStage.system : '',
      stage: certificate.systemStage ? certificate.systemStage.stage : '',
      systemuser: certificate.systemuser || '',
      server: certificate.server,
      zertifikatsname: certificate.zertifikatsname,
      gueltigkeit: certificate.gueltigkeit,
      zweck: certificate.zweck,
      typ: certificate.typ,
    }))
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

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Zertifikats
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

// Löscht ein Zertifikat mit Bestätigung
const deleteEntry = async (id) => {
  if (confirm(t('confirm_delete'))) {
    try {
      const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        certificates.value = certificates.value.filter((e) => e.id !== id)
      }
    } catch (error) {
      console.error('Error deleting certificate:', error)
    }
  }
}
</script>
