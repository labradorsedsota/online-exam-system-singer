<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2>题库管理</h2>
      <router-link to="/admin/questions/create" class="btn btn-primary">+ 创建题目</router-link>
    </div>

    <!-- Tabs filter -->
    <div class="tabs">
      <button v-for="t in typeTabs" :key="t.value" :class="['tab', filterType === t.value ? 'active' : '']" @click="filterType = 'all'">
        {{ t.label }}
      </button>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <input class="form-input" v-model="search" placeholder="搜索题干关键字..." />
    </div>

    <!-- Table -->
    <div class="card" v-if="paged.length">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>题干</th>
              <th>题型</th>
              <th>标签</th>
              <th>分值建议</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(q, i) in paged" :key="q.id">
              <td>{{ (page - 1) * pageSize + i + 1 }}</td>
              <td class="truncate">{{ q.stem }}</td>
              <td><span :class="['tag', 'tag-' + q.type]">{{ typeLabel(q.type) }}</span></td>
              <td>
                <span class="tag" v-for="tag in (q.tags || [])" :key="tag">{{ tag }}</span>
                <span v-if="!q.tags?.length" class="text-muted">—</span>
              </td>
              <td>{{ q.suggestedScore || 0 }}</td>
              <td class="text-sm text-muted">{{ formatDate(q.createdAt) }}</td>
              <td>
                <div class="flex gap-2">
                  <router-link :to="'/admin/questions/edit/' + q.id" class="btn btn-sm btn-ghost">编辑</router-link>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(q)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page <= 1" @click="page--">&lt;</button>
        <button v-for="p in totalPages" :key="p" :class="['page-btn', p === page ? 'active' : '']" @click="page = p">{{ p }}</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">&gt;</button>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-else>
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="10" y="10" width="60" height="60" rx="4" />
        <line x1="25" y1="30" x2="55" y2="30" />
        <line x1="25" y1="40" x2="50" y2="40" />
        <line x1="25" y1="50" x2="45" y2="50" />
      </svg>
      <p>暂无题目，点击创建第一道题</p>
      <router-link to="/admin/questions/create" class="btn btn-primary">创建题目</router-link>
    </div>

    <!-- Delete confirm -->
    <div class="popconfirm-overlay" v-if="deleting">
      <div class="popconfirm-box">
        <div class="popconfirm-title">确认删除「{{ deleting.stem?.slice(0, 30) }}」？</div>
        <div class="popconfirm-actions">
          <button class="btn btn-ghost btn-sm" @click="deleting = null">取消</button>
          <button class="btn btn-danger btn-sm" @click="doDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { questionStore } from '../../stores/index.js'

const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

onMounted(() => {
  setBreadcrumbs([
    { label: '题库管理' }
  ])
})

const typeTabs = [
  { label: '全部', value: 'all' },
  { label: '单选', value: 'single' },
  { label: '多选', value: 'multiple' },
  { label: '填空', value: 'blank' },
  { label: '简答', value: 'essay' },
]

const filterType = ref('all')
const search = ref('')
const page = ref(1)
const pageSize = 10
const deleting = ref(null)

function typeLabel(t) {
  return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN')
}

const filtered = computed(() => {
  let list = [...questionStore.items]
  if (filterType.value !== 'all') {
    list = list.filter(q => q.type === filterType.value)
  }
  if (search.value.trim()) {
    const kw = search.value.trim().toLowerCase()
    list = list.filter(q => q.stem.toLowerCase().includes(kw))
  }
  list.sort((a, b) => b.createdAt - a.createdAt)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

function confirmDelete(q) {
  deleting.value = q
}

function doDelete() {
  questionStore.remove(deleting.value.id)
  toast('删除成功')
  deleting.value = null
}
</script>
