<script setup lang="ts">
import { ref, onMounted } from 'vue'

// import Versions from './components/Versions.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

const form = ref({ name: '', email: '' })
const users = ref<any[]>([])
const editingId = ref<number | null>(null)
const isSyncing = ref(false)

// Чтение (Read)
const loadUsers = async () => {
  const res = await window.api.getUsers()
  if (res.success) users.value = res.data
}

// Переключение в режим редактирования
const startEdit = (user: any) => {
  editingId.value = user.id
  form.value.name = user.name
  form.value.email = user.email
}

const cancelEdit = () => {
  editingId.value = null
  form.value = { name: '', email: '' }
}

// Создание или Обновление (Create / Update)
const handleSubmit = async () => {
  if (editingId.value) {
    // Режим обновления
    const res = await window.api.updateUser(editingId.value, { ...form.value })
    if (res.success) cancelEdit()
    else {
      window.api.showAlert({ type: 'error', title: 'Ошибка', message: res.error })
    }
  } else {
    // Режим создания
    const res = await window.api.createUser({ ...form.value })
    if (res.success) form.value = { name: '', email: '' }
    else {
      window.api.showAlert({ type: 'error', title: 'Ошибка', message: res.error })
    }
  }
  await loadUsers()
}

// Удаление (Delete)
const deleteUser = async (id: number) => {
  const confirmed = await window.api.showConfirm(
    'Вы уверены, что хотите удалить этого пользователя?'
  )

  if (confirmed) {
    const res = await window.api.deleteUser(id)
    if (res.success) {
      if (editingId.value === id) cancelEdit()
      await loadUsers()
    }
  }
}

// Синхронизация по HTTPS (Внешний API)
const syncFromApi = async () => {
  isSyncing.value = true
  const res = await window.api.fetchRemoteUsers()
  isSyncing.value = false

  if (res.success) {
    // Перебираем полученных пользователей и сохраняем их в SQLite
    for (const remoteUser of res.data) {
      await window.api.createUser(remoteUser)
    }
    await loadUsers() // Обновляем UI
  } else {
    window.api.showAlert({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить данные из API: ' + res.error
    })
  }
}

const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div
    class="min-h-screen bg-background p-6 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950"
  >
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Шапка -->
      <header
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl gap-4"
      >
        <div>
          <h1 class="text-2xl text-primary">Electron Pro Панель</h1>
          <div>
            <ThemeSwitcher />
          </div>
        </div>
        <button
          @click="syncFromApi"
          :disabled="isSyncing"
          class="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
        >
          <span>{{ isSyncing ? 'Импорт...' : 'Импортировать 3-х юзеров по HTTPS' }}</span>
        </button>
      </header>

      <div class="action flex gap-3 py-3">
        <a target="_blank" rel="noreferrer" @click.prevent="ipcHandle">Send IPC</a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        <!-- Форма (Блок слева) -->
        <section
          class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl md:col-span-2"
        >
          <h2 class="text-md font-bold mb-4 text-slate-200 flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full"
              :class="editingId ? 'bg-amber-400' : 'bg-emerald-400'"
            ></span>
            {{ editingId ? 'Редактировать' : 'Новый пользователь' }}
          </h2>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label
                class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >Имя</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-700"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label
                class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >Email</label
              >
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-700"
                placeholder="john@example.com"
              />
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="submit"
                class="flex-1 font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md"
                :class="
                  editingId
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                "
              >
                {{ editingId ? 'Обновить' : 'Сохранить в SQLite' }}
              </button>
              <button
                v-if="editingId"
                @click="cancelEdit"
                type="button"
                class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </section>

        <!-- Таблица пользователей (Блок справа) -->
        <section
          class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl md:col-span-3"
        >
          <h2 class="text-md font-bold mb-4 text-slate-200">Локальная база данных</h2>

          <div
            v-if="users.length === 0"
            class="text-center py-12 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl"
          >
            Пользователей не найдено
          </div>

          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            <div
              v-for="user in users"
              :key="user.id"
              class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center transition-all hover:border-slate-700"
            >
              <div class="min-w-0 flex-1 pr-3">
                <p class="font-semibold text-sm text-slate-200 truncate">{{ user.name }}</p>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ user.email }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  @click="startEdit(user)"
                  class="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  @click="deleteUser(user.id)"
                  class="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style>
/* Кастомный аккуратный скроллбар для Tailwind */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
