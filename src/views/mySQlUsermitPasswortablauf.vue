<template>
  <div>
    <h1>{{ $t('mysql_user_password_expiration') }}</h1>

    <button class="switchLanguage" @click="switchLanguage">
      {{ locale === 'de' ? '🇬🇧' : '🇩🇪' }}
    </button>

    <!-- Filterfelder -->
    <input v-model="searchSystem" :placeholder="$t('filter_system')" />
    <input v-model="searchStage" :placeholder="$t('filter_stage')" />

    <!-- Sortier-Button (Sortierung nach Gültigkeit) -->
    <button @click="toggleSortOrder">
      {{ $t('sort_validity', { order: sortOrder === 'asc' ? $t('ascending') : $t('descending') }) }}
    </button>

    <!-- Button zum Hinzufügen eines neuen MySQL Users -->
    <button @click="openModal(null)" class="add-button">
      {{ $t('add_cert') }}
    </button>

    <!-- Modal zum Erstellen/Bearbeiten -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>
          {{ editingUser ? $t('edit') : $t('add_cert') }}
        </h2>
        <!-- Formularfelder -->
        <label>{{ $t('system_column') }}:</label>
        <input v-model="newUser.systemStage.system" type="text" />

        <label>{{ $t('stage_column') }}:</label>
        <input v-model="newUser.systemStage.stage" type="text" />

        <label>{{ $t('mysql-user_column') }}:</label>
        <input v-model="newUser.mysqlUser" type="text" />

        <label>{{ $t('server_column') }}:</label>
        <input v-model="newUser.server" type="text" />

        <label>{{ $t('validity_column') }}:</label>
        <input v-model="newUser.gueltigkeit" type="date" />

        <label>{{ $t('purpose_column') }}:</label>
        <input v-model="newUser.zweck" type="text" />

        <label>{{ $t('type_column') }}:</label>
        <input v-model="newUser.typ" type="text" disabled />

        <button @click="saveUser">{{ $t('save') }}</button>
        <button @click="showModal = false" class="cancel-button">{{ $t('cancel') }}</button>
      </div>
    </div>

    <!-- Dynamische Tabelle -->
    <table>
      <thead>
        <tr>
          <th>{{ $t('system_column') }}</th>
          <th>{{ $t('stage_column') }}</th>
          <th>{{ $t('mysql-user_column') }}</th>
          <th>{{ $t('server_column') }}</th>
          <th>{{ $t('validity_column') }}</th>
          <th>{{ $t('purpose_column') }}</th>
          <th>{{ $t('type_column') }}</th>
          <!-- Neue Spalte "Typ" -->
          <th>{{ $t('action_column') }}</th>
          <!-- Neue Spalte "Aktionen" -->
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
          <td>{{ entry.typ }}</td>
          <!-- Anzeige des Typs -->
          <td>
            <button @click="openModal(entry)">{{ $t('edit') }}</button>
            <button @click="deleteEntry(entry.id)" class="delete-button">
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

const { t, locale } = useI18n()

// Sprache umschalten
const switchLanguage = () => {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}

// MySQL User mit Passwortablauf-Daten (aus API: bigtable)
const entries = ref([])
// Mapping-Daten aus systemstage (falls nicht direkt im Eintrag enthalten)
const systemStages = ref([])

// Filterfelder und Statusvariablen
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
  // Typ festgelegt auf "MySQL User mit Passwortablauf"
  typ: 'MySQL User mit Passwortablauf',
})

// Dynamisch übersetztes Mapping für die Spaltenüberschriften
const columnMapping = computed(() => ({
  system: t('system_column'),
  stage: t('stage_column'),
  mysqlUser: t('mysql-user_column'),
  server: t('server_column'),
  gueltigkeit: t('validity_column'),
  zweck: t('purpose_column'),
  typ: t('type_column'),
}))

// Beim Laden der Komponente: Hole MySQL User und SystemStage-Mapping
onMounted(async () => {
  try {
    const resMySQL = await fetch('http://localhost:8080/api/bigtable')
    const data = await resMySQL.json()
    // Filtere nach Typ "MySQL User mit Passwortablauf"
    entries.value = data.filter((item) => item.typ === 'MySQL User mit Passwortablauf')
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

// Umschalten der Sortierreihenfolge (nach Gültigkeit)
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// Berechnete Liste: Für jeden Eintrag prüfen, ob ein systemStage-Objekt vorhanden ist.
// Falls nicht, wird anhand von entry.systemID der korrekte System- und Stage-Wert ermittelt.
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
        typ: entry.typ || 'MySQL User mit Passwortablauf',
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

// Öffnet das Modal zum Erstellen/Bearbeiten eines MySQL Users
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

// Speichert (hinzufügen oder updaten) einen MySQL User
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

// Löscht einen MySQL User mit Löschbestätigung
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
      console.error('Error deleting MySQL user:', error)
    }
  }
}
</script>
