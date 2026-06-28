<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Versions from './components/Versions.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

// Данные формы
const form = ref({
  name: '',
  email: ''
})

// Список пользователей из БД
const users = ref<any[]>([])

// Загрузка пользователей
const loadUsers = async () => {
  const response = await window.api.getUsers()
  if (response.success) {
    users.value = response.data
  } else {
    alert('Ошибка загрузки: ' + response.error)
  }
}

// Отправка формы
const handleSubmit = async () => {
  const response = await window.api.createUser({
    name: form.value.name,
    email: form.value.email
  })

  if (response.success) {
    // Очищаем форму и обновляем список
    form.value.name = ''
    form.value.email = ''
    await loadUsers()
  } else {
    alert('Ошибка сохранения: ' + response.error)
  }
}

const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

// const saveUser = async () => {
//   // Вызов функции из preload
//   const result = await window.api.saveToDb({ name: 'Иван' })
//   console.log('БД ответила:', result)
// }

const loadData = async () => {
  const data = await window.api.fetchExternalApi('https://jsonplaceholder.typicode.com/users')
  console.log('API ответило:', data)
}

// Загружаем данные при монтировании компонента
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div
    class="flex flex-col min-h-screen items-center justify-center bg-background text-white space-y-6"
  >
    <img alt="logo" class="logo" src="./assets/electron.svg" />

    <div>
      <ThemeSwitcher />
    </div>

    <h1 class="text-4xl font-bold text-emerald-400 drop-shadow-lg text-primary">
      Electron + Vue + Tailwind работает!
    </h1>

    <div class="action flex gap-3 py-3">
      <a target="_blank" rel="noreferrer" @click.prevent="ipcHandle">Send IPC</a>
      <!-- <a target="_blank" rel="noreferrer" @click.prevent="saveUser">Сохранить в SQLite</a> -->
      <a target="_blank" rel="noreferrer" @click.prevent="loadData">Запросить HTTPS API</a>
    </div>

    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div class="">
        <!-- Форма добавления -->
        <section class="p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 class="text-lg font-semibold mb-4 text-slate-200">Добавить пользователя</h2>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Имя</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Сохранить в БД
            </button>
          </form>
        </section>
      </div>
      <div class="">
        <!-- Список пользователей -->
        <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 class="text-lg font-semibold mb-3 text-slate-200">Пользователи в SQLite</h2>

          <div v-if="users.length === 0" class="text-center py-6 text-slate-500 text-sm">
            В базе данных пока пусто
          </div>

          <ul v-else class="divide-y divide-slate-700 max-h-60 overflow-y-auto pr-1">
            <li
              v-for="user in users"
              :key="user.id"
              class="py-3 flex justify-between items-center text-sm"
            >
              <div>
                <p class="font-medium text-slate-200">{{ user.name }}</p>
                <p class="text-xs text-slate-400">{{ user.email }}</p>
              </div>
              <span class="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                ID: {{ user.id }}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- <Versions /> -->
  </div>
</template>
