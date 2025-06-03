<template>
  <div>
    <h1>{{ $t('mq_systemuser_certificates') }}</h1>

    <button class="switchLanguage" @click="switchLanguage">
      <!-- Zeigt 🇬🇧, wenn Deutsch aktiv ist, sonst 🇩🇪 -->
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
        <h2>{{ editingCertificate ? $t('edit') : $t('add_cert') }}</h2>

        <!-- Formularfelder -->
        <label>{{ $t('system_column') }}:</label>
        <input v-model="newCertificate.systemStage.system" type="text" />

        <label>{{ $t('stage_column') }}:</label>
        <input v-model="newCertificate.systemStage.stage" type="text" />

        <label>{{ $t('mq_column') }}:</label>
        <input v-model="newCertificate.mq" type="text" />

        <label>{{ $t('channel_column') }}:</label>
        <input v-model="newCertificate.channel" type="text" />

        <label>{{ $t('system_user_column') }}:</label>
        <input v-model="newCertificate.systemuser" type="text" />

        <label>{{ $t('server_column') }}:</label>
        <input v-model="newCertificate.server" type="text" />

        <label>{{ $t('certificate_name_column') }}:</label>
        <input v-model="newCertificate.zertifikatsname" type="text" />

        <label>{{ $t('issuer') }}:</label>
        <input v-model="newCertificate.issuer" type="text" />

        <label>{{ $t('validity_column') }}:</label>
        <input v-model="newCertificate.gueltigkeit" type="date" />

        <!-- Der Typ ist fest (nicht editierbar) -->
        <label>{{ $t('type_column') }}:</label>
        <input v-model="newCertificate.typ" type="text" disabled />

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
          <th>{{ $t('action_column') }}</th>
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
          <td>{{ entry.typ }}</td>
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

// MQ-Zertifikats-Daten (wir filtern Einträge mit Typ "MQ Systemuser und Zertifikate")
const entries = ref([])
// Mapping-Daten aus systemstage (falls systemStage nicht direkt im Eintrag vorhanden ist)
const systemStages = ref([])

// Filterfelder und Status
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
  typ: 'MQ Systemuser und Zertifikate',
})

// Dynamisch übersetztes Mapping für die Spaltenüberschriften
const columnMapping = computed(() => ({
  system: t('system_column'),
  stage: t('stage_column'),
  mq: t('mq_column'),
  channel: t('channel_column'),
  systemuser: t('system_user_column'),
  server: t('server_column'),
  zertifikatsname: t('certificate_name_column'),
  issuer: t('issuer'),
  gueltigkeit: t('validity_column'),
  typ: t('type_column'),
}))

// Daten von der API laden
onMounted(async () => {
  try {
    const resMQ = await fetch('http://localhost:8080/api/bigtable')
    const data = await resMQ.json()
    // Nur Einträge mit Typ "MQ Systemuser und Zertifikate" übernehmen
    entries.value = data.filter((item) => item.typ === 'MQ Systemuser und Zertifikate')
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

// Berechnete Liste: Für jeden Eintrag prüfen, ob ein systemStage-Objekt vorhanden ist.
// Falls nicht, anhand von entry.systemID im Mapping den korrekten System- und Stage-Wert ermitteln.
const sortedEntries = computed(() => {
  return entries.value
    .map((entry) => {
      let system = ''
      let stage = ''
      if (entry.systemStage && entry.systemStage.system && entry.systemStage.stage) {
        system = entry.systemStage.system
        stage = entry.systemStage.stage
      } else if (entry.systemID) {
        const mapping = systemStages.value.find(
          (item) => Number(item.systemID) === Number(entry.systemID),
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
        typ: entry.typ || 'MQ Systemuser und Zertifikate',
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

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Zertifikats
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
      console.error('Error deleting MQ certificate:', error)
    }
  }
}
</script>
