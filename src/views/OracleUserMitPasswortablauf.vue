<template>
  <div>
    <h1>{{ $t('oracle_user_password_expiration') }}</h1>

    <button class="switchLanguage" @click="switchLanguage">
      <!-- Zeigt 🇬🇧, wenn Deutsch aktiv ist, sonst 🇩🇪 -->
      {{ locale === 'de' ? '🇬🇧' : '🇩🇪' }}
    </button>

    <!-- Filterfelder -->
    <input v-model="searchSystem" :placeholder="$t('filter_system')" />
    <input v-model="searchStage" :placeholder="$t('filter_stage')" />

    <!-- Sortier-Button (Sortierung nach Gültigkeit) -->
    <button @click="toggleSortOrder">
      {{ $t('sort_validity', { order: sortOrder === 'asc' ? $t('ascending') : $t('descending') }) }}
    </button>

    <!-- Button zum Hinzufügen eines neuen Oracle Users -->
    <button @click="openModal(null)" class="add-button">
      {{ $t('add_cert') }}
    </button>

    <!-- Modal zum Erstellen/Bearbeiten -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingUser ? $t('edit') : $t('add_cert') }}</h2>

        <!-- Formularfelder -->
        <label>{{ $t('system_column') }}:</label>
        <input v-model="newUser.systemStage.system" type="text" />

        <label>{{ $t('stage_column') }}:</label>
        <input v-model="newUser.systemStage.stage" type="text" />

        <label>{{ $t('oracle-user_column') }}:</label>
        <input v-model="newUser.oracleUser" type="text" />

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
          <th v-for="(label, key) in columnMapping" :key="key">{{ label }}</th>
          <th>{{ $t('action_column') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in sortedEntries" :key="entry.id">
          <td>{{ entry.system }}</td>
          <td>{{ entry.stage }}</td>
          <td>{{ entry.oracleUser }}</td>
          <td>{{ entry.server }}</td>
          <td>{{ entry.gueltigkeit }}</td>
          <td>{{ entry.zweck }}</td>
          <td>{{ entry.typ }}</td>
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

// Oracle User mit Passwortablauf-Daten aus der API (Filtern nach Typ "Oracle User mit Passwortablauf")
const entries = ref([])
// SystemStage-Mapping-Daten (wird genutzt, falls im Eintrag kein systemStage-Objekt enthalten ist)
const systemStages = ref([])

// Filterfelder und Statusvariablen
const searchSystem = ref('')
const searchStage = ref('')
const sortOrder = ref('asc')
const showModal = ref(false)
const editingUser = ref(null)

// Standardwerte für einen neuen Oracle User
const newUser = ref({
  systemStage: { system: '', stage: '' },
  oracleUser: '',
  server: '',
  gueltigkeit: '',
  zweck: '',
  // Der Typ wird fest auf "Oracle User mit Passwortablauf" gesetzt
  typ: 'Oracle User mit Passwortablauf',
})

// Dynamisch übersetztes Mapping für die Spaltenüberschriften
const columnMapping = computed(() => ({
  system: t('system_column'),
  stage: t('stage_column'),
  oracleUser: t('oracle-user_column'),
  server: t('server_column'),
  validity: t('validity_column'),
  purpose: t('purpose_column'),
  typ: t('type_column'),
}))

// Beim Laden der Komponente: Hole Oracle User-Daten und SystemStage-Mapping
onMounted(async () => {
  try {
    const resOracle = await fetch('http://localhost:8080/api/bigtable')
    const data = await resOracle.json()
    // Filter: Nur Einträge mit Typ "Oracle User mit Passwortablauf" übernehmen
    entries.value = data.filter((item: any) => item.typ === 'Oracle User mit Passwortablauf')
  } catch (error) {
    console.error('Error fetching Oracle users:', error)
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

// Berechnete Liste: Für jeden Eintrag wird geprüft, ob ein systemStage-Objekt vorhanden ist.
// Falls nicht, wird anhand von entry.systemID der korrekte System- und Stage-Wert aus systemStages ermittelt.
const sortedEntries = computed(() => {
  return entries.value
    .map((entry: any) => {
      let system = ''
      let stage = ''
      if (entry.systemStage && entry.systemStage.system && entry.systemStage.stage) {
        system = entry.systemStage.system
        stage = entry.systemStage.stage
      } else if (entry.systemID) {
        const idNum = Number(entry.systemID)
        const mapping = systemStages.value.find(
          (item: any) => Number(item.systemID) === idNum || Number(item.id) === idNum,
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
        oracleUser: entry.oracleUser || '',
        server: entry.server || '',
        gueltigkeit: entry.gueltigkeit || '',
        zweck: entry.zweck || '',
        typ: entry.typ || 'Oracle User mit Passwortablauf',
      }
    })
    .filter(
      (entry: any) =>
        entry.system.toLowerCase().includes(searchSystem.value.toLowerCase()) &&
        entry.stage.toLowerCase().includes(searchStage.value.toLowerCase()),
    )
    .sort((a: any, b: any) => {
      const dateA = new Date(a.gueltigkeit).getTime()
      const dateB = new Date(b.gueltigkeit).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
})

// Öffnet das Modal zum Bearbeiten oder Erstellen eines Oracle Users.
const openModal = (entry: any) => {
  if (entry) {
    editingUser.value = entry
    newUser.value = {
      systemStage: { system: entry.system, stage: entry.stage },
      oracleUser: entry.oracleUser,
      server: entry.server,
      gueltigkeit: entry.gueltigkeit,
      zweck: entry.zweck,
      typ: 'Oracle User mit Passwortablauf',
    }
  } else {
    editingUser.value = null
    newUser.value = {
      systemStage: { system: '', stage: '' },
      oracleUser: '',
      server: '',
      gueltigkeit: '',
      zweck: '',
      typ: 'Oracle User mit Passwortablauf',
    }
  }
  showModal.value = true
}

// Speichert (hinzufügen oder updaten) einen Oracle User.
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
        const index = entries.value.findIndex((e: any) => e.id === updatedEntry.id)
        entries.value[index] = updatedEntry
      }
    } catch (error) {
      console.error('Error updating Oracle user:', error)
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
      console.error('Error adding Oracle user:', error)
    }
  }
  showModal.value = false
}

// Löscht einen Oracle User mit Löschbestätigung.
const deleteEntry = async (id: number) => {
  if (confirm(t('confirm_delete'))) {
    try {
      const response = await fetch(`http://localhost:8080/api/bigtable/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        entries.value = entries.value.filter((e: any) => e.id !== id)
      }
    } catch (error) {
      console.error('Error deleting Oracle user:', error)
    }
  }
}
</script>
