<template>
  <div>
    <h2 class="mb-4">成绩管理</h2>

    <!-- Filter -->
    <div class="flex items-center gap-3 mb-4">
      <select class="form-select" style="width:200px" v-model="filterPaper">
        <option value="">全部考试</option>
        <option v-for="p in paperStore.items" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <div class="tabs" style="border:none;margin:0">
        <button :class="['tab', filterStatus === 'all' ? 'active' : '']" @click="filterStatus = 'all'">全部</button>
        <button :class="['tab', filterStatus === 'graded' ? 'active' : '']" @click="filterStatus = 'graded'">已评</button>
        <button :class="['tab', filterStatus === 'pending' ? 'active' : '']" @click="filterStatus = 'pending'">待评</button>
      </div>
    </div>

    <!-- Stats cards per exam -->
    <div class="card card-sm mb-4" v-if="filterPaper && statsData">
      <h3 class="mb-3">统计看板 — {{ getPaper(filterPaper)?.name }}</h3>
      <div class="grid-4">
        <div class="stat-card"><div class="stat-value">{{ statsData.avg }}</div><div class="stat-label">平均分</div></div>
        <div class="stat-card"><div class="stat-value">{{ statsData.max }}</div><div class="stat-label">最高分</div></div>
        <div class="stat-card"><div class="stat-value">{{ statsData.min }}</div><div class="stat-label">最低分</div></div>
        <div class="stat-card"><div class="stat-value">{{ statsData.passRate }}%</div><div class="stat-label">通过率</div></div>
      </div>
      <div class="mt-4">
        <h4 class="mb-2 text-sm">成绩分布</h4>
        <div v-for="seg in statsData.segments" :key="seg.label" class="flex items-center gap-2 mb-2">
          <span class="text-sm" style="width:60px">{{ seg.label }}</span>
          <div class="progress-bar" style="flex:1">
            <div class="progress-fill" :style="{ width: seg.pct + '%' }"></div>
          </div>
          <span class="text-sm text-muted">{{ seg.count }}人 ({{ seg.pct }}%)</span>
        </div>
      </div>
    </div>

    <!-- Score table -->
    <div class="card" v-if="paged.length">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>考试名称</th>
              <th>考生姓名</th>
              <th>总分/满分</th>
              <th>及格</th>
              <th>提交时间</th>
              <th>评分状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paged" :key="r.id">
              <td>{{ getPaper(r.paperId)?.name || '—' }}</td>
              <td class="hand-text">{{ r.studentName }}</td>
              <td>{{ r.totalScore }} / {{ getFullScore(r.paperId) }}</td>
              <td>
                <span v-if="isFullyGraded(r)" :class="['tag', r.totalScore >= (getPaper(r.paperId)?.passScore || 0) ? 'tag-pass' : 'tag-fail']">
                  {{ r.totalScore >= (getPaper(r.paperId)?.passScore || 0) ? '及格' : '不及格' }}
                </span>
                <span v-else class="text-muted">待评</span>
              </td>
              <td class="text-sm text-muted">{{ formatDate(r.submitTime) }}</td>
              <td>
                <span :class="['tag', isFullyGraded(r) ? 'tag-published' : 'tag-draft']">
                  {{ isFullyGraded(r) ? '已完成' : '部分待评' }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <router-link :to="'/admin/scores/' + r.paperId + '/' + r.id" class="btn btn-sm btn-ghost">查看详情</router-link>
                  <button class="btn btn-sm btn-danger" @click="confirmDel(r)">删除</button>
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

    <div class="empty-state" v-else><p>暂无成绩记录</p></div>

    <div class="popconfirm-overlay" v-if="deleting">
      <div class="popconfirm-box">
        <div class="popconfirm-title">确认删除该成绩记录？</div>
        <div class="popconfirm-actions">
          <button class="btn btn-ghost btn-sm" @click="deleting = null">取消</button>
          <button class="btn btn-danger btn-sm" @click="doDelete">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { paperStore, recordStore, questionStore } from '../../stores/index.js'

const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')
onMounted(() => setBreadcrumbs([{ label: '成绩管理' }]))

const filterPaper = ref('')
const filterStatus = ref('all')
const page = ref(1)
const pageSize = 10
const deleting = ref(null)

function getPaper(id) { return paperStore.getById(id) }
function getFullScore(paperId) {
  const p = getPaper(paperId)
  return p ? (p.questions || []).reduce((s, q) => s + (q.score || 0), 0) : 0
}
function isFullyGraded(r) {
  // BUG-002 fix: check against paper questions, not just existing scores
  const paper = getPaper(r.paperId)
  if (!paper) return false
  return paper.questions.every(item =>
    r.scores[item.questionId] !== null && r.scores[item.questionId] !== undefined
  )
}
function formatTime(ts) { return ts ? new Date(ts).toLocaleString('zh-CN') : '' }

const filtered = computed(() => {
  let list = [...recordStore.items].filter(r => r.status !== 'in-progress')
  if (filterPaper.value) list = list.filter(r => r.paperId === filterPaper.value)
  if (filterStatus.value === 'graded') list = list.filter(r => isFullyGraded(r))
  if (filterStatus.value === 'pending') list = list.filter(r => !isFullyGraded(r))
  list.sort((a, b) => (b.submitTime || 0) - (a.submitTime || 0))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const statsData = computed(() => {
  if (!filterPaper.value) return null
  const records = recordStore.items.filter(r => r.paperId === filterPaper.value && r.status !== 'in-progress')
  if (!records.length) return null
  const scores = records.map(r => r.totalScore)
  const paper = getPaper(filterPaper.value)
  const passLine = paper?.passScore || 0
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  const passed = scores.filter(s => s >= passLine).length
  const passRate = Math.round((passed / scores.length) * 100)
  const total = scores.length
  const seg1 = scores.filter(s => s < 60).length
  const seg2 = scores.filter(s => s >= 60 && s < 80).length
  const seg3 = scores.filter(s => s >= 80).length
  return {
    avg, max, min, passRate,
    segments: [
      { label: '0-59', count: seg1, pct: Math.round(seg1/total*100) },
      { label: '60-79', count: seg2, pct: Math.round(seg2/total*100) },
      { label: '80-100', count: seg3, pct: Math.round(seg3/total*100) },
    ]
  }
})

function confirmDel(r) { deleting.value = r }
function doDelete() {
  recordStore.remove(deleting.value.id)
  toast('删除成功')
  deleting.value = null
}
</script>
