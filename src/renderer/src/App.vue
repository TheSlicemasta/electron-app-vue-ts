<script setup lang="ts">
import Versions from './components/Versions.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

const saveUser = async () => {
  // Вызов функции из preload
  const result = await window.api.saveToDb({ name: 'Иван' })
  console.log('БД ответила:', result)
}

const loadData = async () => {
  const data = await window.api.fetchExternalApi('https://jsonplaceholder.typicode.com/users')
  console.log('API ответило:', data)
}
</script>

<template>
  <!-- <img alt="logo" class="logo" src="./assets/electron.svg" /> -->

  <div>
    <ThemeSwitcher />
  </div>

  <h1 class="text-3xl font-bold text-primary">Hello world!</h1>
  <!-- <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
    and
    <span class="ts">TypeScript</span>
  </div> -->
  <!-- <p class="tip">Please try pressing <code>F12</code> to open the devTool</p> -->
  <div class="action flex gap-3 py-3">
    <a target="_blank" rel="noreferrer" @click.prevent="ipcHandle">Send IPC</a>
    <a target="_blank" rel="noreferrer" @click.prevent="saveUser">Сохранить в SQLite</a>
    <a target="_blank" rel="noreferrer" @click.prevent="loadData">Запросить HTTPS API</a>
  </div>
  <Versions />
</template>
