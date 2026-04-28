<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2>试卷管理</h2>
      <router-link to="/admin/papers/create" class="btn btn-primary">+ 创建试卷</router-link>
    </div>

    <div class="card" v-if="paperStore.items.length">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>试卷名称</th>
              <th>题目数</th>
              <th>总分</th>
              <th>时长</th>
              <th>状态</th>
              <th>开关</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paged" :key="p.id">
              <td>{{ p.name }}</td>
              <td>{{ p.questions?.length || 0 }}</td>
              <td>{{ totalScore(p) }}</td>
              <td>{{ p.duration }} 分钟</td>
              <td><span :class="['tag', 'tag-' + p.status]">{{ statusLabel(p.status) }}</span></td>
              <td>
                <div :class="['switch', p.switchOn ? 'on' : '']" @click="toggleSwitch(p)" v-if="p.status === 'published'">
                  <div class="switch-track"></div>
                  <div class="switch-thumb"></div>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-sm text-muted">{{ formatDate(p.createdAt) }}</td>
              <td>
                <div class="flex gap-2">
                  <router-link v-if="p.status === 'draft'" :to="'/admin/papers/edit/' + p.id" class="btn btn-sm btn-ghost">编辑</router-link>
                  <button v-if="p.status === 'draft' || p.status === 'closed'" class="btn btn-sm" @click="publish(p)">发布</button>
                  <button v-if="p.status === 'published'" class="btn btn-sm btn-ghost" @click="closePaper(p)">关闭</button>
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(p)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page <= 1" @click="page--">&lt;</button>
        <button v-for="pg in totalPages" :key="pg" :class="['page-btn', pg === page ? 'active' : '']" @click="page = pg">{{ pg }}</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">&gt;</button>
      </div>
    </div>

    <div class="empty-state" v-else>
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="5" width="50" height="70" rx="3" /><rect x="20" y="10" width="50" height="70" rx="3" /></svg>
      <p>暂无试卷</p>
      <router-link to="/admin/papers/create" class="btn btn-primary">创建试卷</router-link>
    </div>

    <div class="popconfirm-overlay" v-if="deleting">
      <div class="popconfirm-box">
        <div class="popconfirm-title">确认删除试卷「{{ deleting.name }}」？</div>
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
import { paperStore } from '../../stores/index.js'

const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')
onMounted(() => setBreadcrumbs([{ label: '试卷管理' }]))

const page = ref(1)
const pageSize = 10
const deleting = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(paperStore.items.length / pageSize)))
const paged = computed(() => {
  const sorted = [...paperStore.items].sort((a, b) => b.createdAt - a.createdAt)
  return sorted.slice((page.value - 1) * pageSize, page.value * pageSize)
})

function totalScore(p) {
  return (p.questions || []).reduce((s, q) => s + (q.score || 0), 0)
}

function statusLabel(s) {
  return { draft: '草稿', published: '已发布', closed: '已关闭' }[s] || s
}

function formatDate(ts) {
  return ts ? new Date(ts).toLocaleDateString('zh-CN') : ''
}

function publish(p) {
  // BUG-007 fix: block publishing empty papers
  if (!p.questions || p.questions.length === 0) {
    toast('试卷至少需要包含 1 道题目才能发布', 'error')
    return
  }
  paperStore.publish(p.id)
  toast('试卷已发布')
}

function closePaper(p) {
  paperStore.close(p.id)
  toast('试卷已关闭')
}

function toggleSwitch(p) {
  paperStore.toggleSwitch(p.id)
  // BUG-003 fix: toggleSwitch already flipped p.switchOn, read new state
  toast(p.switchOn ? '考试已开启' : '考试已暂停')
}

function confirmDelete(p) { deleting.value = p }
function doDelete() {
  paperStore.remove(deleting.value.id)
  toast('删除成功')
  deleting.value = null
}
</script>
