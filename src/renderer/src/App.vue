<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

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

const listenSockets = () => {
  window.api.onWsData(async (data: any) => {
    console.log('Данные из WebSocket в UI:', data)

    // Get user data from ws and try to store...
    const res = await window.api.createUser({ ...data })
    if (res.success) {
      await window.api.showAlert({
        type: 'info',
        title: 'Сообщение',
        message: 'Websocket: Получен и создан новый пользователь'
      })

      loadUsers()
    } else {
      window.api.showAlert({
        type: 'error',
        title: 'Ошибка',
        message: 'Websocket: Ошибка при получении данных пользователя'
      })
    }
  })
}

// WebSockets
interface LogEntry {
  time: string
  type: 'sent' | 'received'
  text: string
}

const status = ref('disconnected')
const messageInput = ref('')
const logs = ref<LogEntry[]>([])
const isPending = ref(false)

const getTime = () => new Date().toLocaleTimeString()

const handleConnect = async () => {
  if (isPending.value) return

  isPending.value = true
  try {
    const res = await window.api.WS_connect()
    if (!res.success) {
      alert('Ошибка при попытке подключения: ' + res.error)
      isPending.value = false
    }
  } catch (err) {
    isPending.value = false
  }
}

const handleDisconnect = async () => {
  if (isPending.value) return

  isPending.value = true
  try {
    await window.api.WS_disconnect()
  } catch (err) {
    isPending.value = false
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim()) return

  const msg = messageInput.value

  const res = await window.api.WS_send(msg)

  if (res.success) {
    logs.value.unshift({
      time: getTime(),
      type: 'sent',
      text: msg
    })
    messageInput.value = ''
  } else {
    window.api.showAlert({ type: 'error', title: 'Ошибка', message: res.error })
  }
}

const initWebSocketListner = () => {
  // Слушаем изменение статуса из Main процесса
  window.api.WS_onStatus((newStatus: string) => {
    status.value = newStatus
    isPending.value = false
  })

  // Слушаем входящие сообщения от сервера
  window.api.WS_onMessage((msg: string) => {
    logs.value.unshift({
      time: getTime(),
      type: 'received',
      text: msg
    })
  })
}

onMounted(() => {
  loadUsers()

  // Слушаем данные от WebSocket, прилетевшие из Main-процесса
  listenSockets()

  // External web server test - wss://echo.websocket.org
  initWebSocketListner()
})

onUnmounted(() => {
  // Отписываемся при уничтожении компонента
  window.api.offWsData()
})
</script>

<template>
  <div
    class="min-h-screen bg-background p-6 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-center"
  >
    <div class="w-full max-w-[min(90%,1200px)] mx-auto space-y-6">
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
          @click.stop="syncFromApi"
          :disabled="isSyncing"
          class="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
        >
          <span>{{ isSyncing ? 'Импорт...' : 'Импортировать 3-х юзеров по HTTPS' }}</span>
        </button>
      </header>

      <div class="action flex gap-3 py-3">
        <a target="_blank" rel="noreferrer" @click.prevent="ipcHandle">Send IPC (ping -> pong)</a>
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
                placeholder="Name"
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
                placeholder="email@example.com"
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
                @click.stop="cancelEdit"
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
          <h2 class="text-md font-bold mb-4 text-slate-200">Локальная база данных SQLite</h2>

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
                  @click.stop="startEdit(user)"
                  class="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  @click.stop="deleteUser(user.id)"
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

      <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <!-- Шапка и статус -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-200">
              WebSocket Тест (wss://echo.websocket.org)
            </h2>
            <p class="text-xs text-slate-500">Эхо-сервер реального времени</p>
          </div>
          <span
            :class="
              status === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            "
            class="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider"
          >
            {{ status }}
          </span>
        </div>

        <!-- Управление подключением -->
        <div class="flex gap-2">
          <button
            v-if="status !== 'connected'"
            @click.stop="handleConnect"
            :disabled="isPending"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-75 disabled:shadow-none"
          >
            {{ isPending ? 'Подключение...' : 'Подключиться к сокету' }}
          </button>
          <button
            v-else
            @click.stop="handleDisconnect"
            :disabled="isPending"
            class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-75 disabled:shadow-none"
          >
            {{ isPending ? 'Отключение...' : 'Отключиться' }}
          </button>
        </div>

        <!-- Поле отправки -->
        <div v-if="status === 'connected'" class="space-y-2">
          <div class="flex gap-2">
            <input
              v-model="messageInput"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Напишите что-нибудь..."
              class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
            />
            <button
              @click.stop="sendMessage"
              :disabled="isPending"
              class="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 rounded-xl transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-75 disabled:shadow-none"
            >
              Отправить
            </button>
          </div>
        </div>

        <!-- Логи / Чат -->
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
            >История сообщений</span
          >
          <div
            class="h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono space-y-1.5 custom-scroll"
          >
            <div v-if="logs.length === 0" class="text-slate-700 text-center py-12">
              История пуста
            </div>
            <div
              v-for="(log, i) in logs"
              :key="i"
              :class="log.type === 'sent' ? 'text-amber-400' : 'text-cyan-400'"
              class="break-all"
            >
              <span class="text-slate-600">[{{ log.time }}]</span>
              {{ log.type === 'sent' ? '➔ Вы:' : '🕒 Сервер вернул:' }} {{ log.text }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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
