<template>
  <div class="flex items-center gap-2 p-4">
    <label for="theme-select" class="text-sm font-medium text-gray-300">
      Theme:
    </label>
    <select
      id="theme-select"
      v-model="theme"
      @change="updateTheme"
      class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-black bg-white dark:text-white dark:bg-black"
    >
      <option value="system">System Preference</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive state for the select dropdown
const theme = ref('system')

// Get the resolved mode (either explicit dark or system dark)
const isDarkModePreferred = () => {
  if (theme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return theme.value === 'dark'
}

// Sync the DOM data-theme attribute with state
const updateTheme = () => {
  const root = document.documentElement

  if (isDarkModePreferred()) {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.setAttribute('data-theme', 'light')
  }

  // Persist choice to localStorage
  localStorage.setItem('user-theme', theme.value)
}

onMounted(() => {
  // 1. Check local storage, fall back to 'system'
  const savedTheme = localStorage.getItem('user-theme') || 'system'
  theme.value = savedTheme

  // 2. Initial DOM paint sync
  updateTheme()

  // 3. Listen to system preference changes if 'system' is active
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') {
      updateTheme()
    }
  })
})
</script>
