<template>
  <div id="oes-app">
    <!-- Toast messages -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast-' + t.type]">
        {{ t.text }}
      </div>
    </div>

    <!-- Navbar -->
    <nav class="navbar">
      <router-link to="/" class="navbar-brand">
        <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="22" height="22" rx="2" />
          <line x1="8" y1="9" x2="20" y2="9" />
          <line x1="8" y1="14" x2="18" y2="14" />
          <line x1="8" y1="19" x2="16" y2="19" />
        </svg>
        Scholar's Notebook
      </router-link>

      <div class="nav-links" v-if="role === 'admin'">
        <router-link to="/admin/questions" class="nav-link">题库管理</router-link>
        <router-link to="/admin/papers" class="nav-link">试卷管理</router-link>
        <router-link to="/admin/scores" class="nav-link">成绩管理</router-link>
      </div>
      <div class="nav-links" v-else>
        <router-link to="/student/exams" class="nav-link">考试列表</router-link>
      </div>

      <div class="navbar-right">
        <div class="role-switcher">
          <button :class="['role-btn', role === 'admin' ? 'active' : '']" @click="switchRole('admin')">出题人</button>
          <button :class="['role-btn', role === 'student' ? 'active' : '']" @click="switchRole('student')">考生</button>
        </div>
        <button class="btn btn-sm btn-ghost" @click="doExport">📤 导出</button>
        <label class="btn btn-sm btn-ghost" style="cursor:pointer">
          📥 导入
          <input type="file" accept=".json" @change="doImport" hidden />
        </label>
      </div>
    </nav>

    <!-- Breadcrumb -->
    <div class="breadcrumb" v-if="breadcrumbs.length">
      <template v-for="(b, i) in breadcrumbs" :key="i">
        <router-link v-if="b.to" :to="b.to">{{ b.label }}</router-link>
        <span v-else>{{ b.label }}</span>
        <span v-if="i < breadcrumbs.length - 1" class="sep">/</span>
      </template>
    </div>

    <!-- Main -->
    <main class="main-content">
      <router-view :role="role" @toast="showToast" @breadcrumb="setBreadcrumbs" />
    </main>

    <!-- Import Dialog -->
    <div class="dialog-overlay" v-if="importDialog.show">
      <div class="dialog-box">
        <div class="dialog-title">导入数据</div>
        <div class="dialog-body">
          选择导入模式：
          <div class="flex gap-3 mt-2">
            <label class="radio-item" :class="{ selected: importDialog.mode === 'overwrite' }" @click="importDialog.mode = 'overwrite'">
              <span class="radio-circle">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" class="outline" />
                  <path d="M6 12 C8 8, 10 7, 12 6 C14 7, 16 8, 18 12 C16 16, 14 17, 12 18 C10 17, 8 16, 6 12Z" class="scribble" />
                </svg>
              </span>
              <span>覆盖现有数据</span>
            </label>
            <label class="radio-item" :class="{ selected: importDialog.mode === 'merge' }" @click="importDialog.mode = 'merge'">
              <span class="radio-circle">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" class="outline" />
                  <path d="M6 12 C8 8, 10 7, 12 6 C14 7, 16 8, 18 12 C16 16, 14 17, 12 18 C10 17, 8 16, 6 12Z" class="scribble" />
                </svg>
              </span>
              <span>合并数据</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="importDialog.show = false">取消</button>
          <button class="btn btn-primary" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { exportAllData, importData } from './stores/index.js'

const router = useRouter()
const route = useRoute()

const role = ref('admin')
const breadcrumbs = ref([])
const toasts = ref([])

const importDialog = reactive({
  show: false,
  mode: 'overwrite',
  file: null
})

function switchRole(r) {
  role.value = r
  if (r === 'admin') {
    router.push('/admin/questions')
  } else {
    router.push('/student/exams')
  }
}

// Watch route to detect role
watch(() => route.path, (p) => {
  if (p.startsWith('/student')) role.value = 'student'
  else role.value = 'admin'
}, { immediate: true })

function setBreadcrumbs(items) {
  breadcrumbs.value = items
}

let toastId = 0
function showToast(text, type = 'success') {
  const id = ++toastId
  toasts.value.push({ id, text, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

function doExport() {
  exportAllData()
  showToast('数据导出成功')
}

function doImport(e) {
  const file = e.target.files[0]
  if (!file) return
  importDialog.file = file
  importDialog.show = true
  e.target.value = ''
}

async function confirmImport() {
  try {
    const result = await importData(importDialog.file, importDialog.mode)
    importDialog.show = false
    showToast(`导入完成，共 ${result.questions} 道题目，${result.papers} 场考试`)
    // Reload current page
    router.go(0)
  } catch (err) {
    showToast(err, 'error')
  }
}

// Expose toast globally for child components
import { provide } from 'vue'
provide('toast', showToast)
provide('setBreadcrumbs', setBreadcrumbs)
</script>
