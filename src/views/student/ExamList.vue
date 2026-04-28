<template>
  <div>
    <h2 class="mb-4">考试列表</h2>

    <div class="card" v-if="exams.length">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>试卷名称</th>
              <th>题目数</th>
              <th>考试时长</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in exams" :key="p.id">
              <td>{{ p.name }}</td>
              <td>{{ p.questions?.length || 0 }} 题</td>
              <td>{{ p.duration }} 分钟</td>
              <td>
                <span :class="['tag', examStatus(p).class]">{{ examStatus(p).label }}</span>
              </td>
              <td>
                <button v-if="examStatus(p).canTake" class="btn btn-sm btn-primary" @click="startExam(p)">
                  开始考试
                </button>
                <span v-else class="text-muted text-sm">{{ examStatus(p).reason }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="empty-state" v-else>
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="40" cy="40" r="30" />
        <line x1="40" y1="25" x2="40" y2="42" />
        <line x1="40" y1="42" x2="52" y2="48" />
      </svg>
      <p>暂无可参加的考试</p>
    </div>

    <!-- Name input dialog -->
    <div class="dialog-overlay" v-if="showNameDialog">
      <div class="dialog-box">
        <div class="dialog-title">输入考生姓名</div>
        <div class="dialog-body">
          <div class="form-group">
            <input class="form-input hand-text" v-model="studentName" placeholder="请输入您的姓名" :class="{ error: nameError }" @keydown.enter="confirmStart" />
            <div class="form-error" v-if="nameError">{{ nameError }}</div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="showNameDialog = false">取消</button>
          <button class="btn btn-primary" @click="confirmStart">开始考试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { paperStore, recordStore } from '../../stores/index.js'

const router = useRouter()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')
onMounted(() => setBreadcrumbs([{ label: '考试列表' }]))

const showNameDialog = ref(false)
const studentName = ref('')
const nameError = ref('')
const selectedPaper = ref(null)

const exams = computed(() => {
  return paperStore.items.filter(p => p.status === 'published' && p.switchOn)
})

function examStatus(p) {
  const now = Date.now()
  if (!p.switchOn) return { label: '考试已暂停', class: 'tag-closed', canTake: false, reason: '考试已暂停' }
  if (p.startTime && now < new Date(p.startTime).getTime()) {
    return { label: '未开始', class: 'tag-draft', canTake: false, reason: '开始时间：' + formatDT(p.startTime) }
  }
  if (p.endTime && now > new Date(p.endTime).getTime()) {
    return { label: '已结束', class: 'tag-closed', canTake: false, reason: '已超过截止时间' }
  }
  return { label: '可参加', class: 'tag-published', canTake: true, reason: '' }
}

function formatDT(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function startExam(p) {
  selectedPaper.value = p
  showNameDialog.value = true
  nameError.value = ''
}

function confirmStart() {
  if (!studentName.value.trim()) {
    nameError.value = '姓名不能为空'
    return
  }
  if (studentName.value.length > 50) {
    nameError.value = '姓名不能超过 50 字'
    return
  }
  // Check time window again
  const p = selectedPaper.value
  const now = Date.now()
  if (p.startTime && now < new Date(p.startTime).getTime()) {
    toast('考试尚未开始，开始时间：' + formatDT(p.startTime), 'warning')
    showNameDialog.value = false
    return
  }
  if (p.endTime && now > new Date(p.endTime).getTime()) {
    toast('考试已结束', 'error')
    showNameDialog.value = false
    return
  }
  if (!p.switchOn) {
    toast('考试已暂停', 'error')
    showNameDialog.value = false
    return
  }
  // PRD §5.3: allow repeat submissions, each is independent record
  // Create record & navigate
  const record = recordStore.create(p.id, studentName.value.trim())
  showNameDialog.value = false
  router.push('/student/exam/' + p.id + '?record=' + record.id)
}
</script>
