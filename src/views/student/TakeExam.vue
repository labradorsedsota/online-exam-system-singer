<template>
  <div v-if="paper && record">
    <!-- Steps -->
    <div class="steps mb-4">
      <div class="step active"><div class="step-dot">1</div><div class="step-label">答题</div></div>
      <div class="step-line"></div>
      <div class="step"><div class="step-dot">2</div><div class="step-label">提交</div></div>
      <div class="step-line"></div>
      <div class="step"><div class="step-dot">3</div><div class="step-label">评分</div></div>
      <div class="step-line"></div>
      <div class="step"><div class="step-dot">4</div><div class="step-label">查看结果</div></div>
    </div>

    <!-- Header -->
    <div class="card card-sm mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h2>{{ paper.name }}</h2>
          <span class="text-sm text-muted">{{ record.studentName }} · {{ paper.questions.length }} 题</span>
        </div>
        <div class="flex items-center gap-4">
          <div>
            <div class="text-sm text-muted mb-1">答题进度</div>
            <div class="flex items-center gap-2">
              <div class="progress-bar" style="width:120px">
                <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
              </div>
              <span class="text-sm">{{ answeredCount }}/{{ paper.questions.length }}</span>
            </div>
          </div>
          <div>
            <div class="text-sm text-muted mb-1">剩余时间</div>
            <div :class="['countdown', remainSec <= 300 ? 'warning' : '']">
              {{ formatCountdown(remainSec) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5 min warning -->
    <div class="alert alert-error" v-if="showWarning">
      ⚠️ 距离考试结束还有 5 分钟！
    </div>

    <!-- Layout: sidebar + main -->
    <div class="exam-layout">
      <!-- Navigation sidebar -->
      <div class="exam-sidebar">
        <div class="card card-sm">
          <h4 class="mb-3">题目导航</h4>
          <div class="question-nav">
            <button v-for="(item, i) in paper.questions" :key="i"
              :class="['question-nav-btn', navClass(i)]"
              @click="goTo(i)">
              {{ i + 1 }}
            </button>
          </div>
          <div class="mt-3 text-sm">
            <span style="color:var(--green-ink)">●</span> 已答
            <span style="color:var(--ink-light);margin-left:8px">●</span> 未答
            <span style="color:#d4a800;margin-left:8px">●</span> 标记
          </div>
        </div>
      </div>

      <!-- Main question area -->
      <div class="exam-main">
        <div class="card card-torn ruled-area" style="min-height:300px" :class="{ highlight: flagged[currentQ] }">
          <div class="flex items-center justify-between mb-3">
            <h3>第 {{ currentQ + 1 }} 题
              <span :class="['tag', 'tag-' + currentQuestion?.type]">{{ typeLabel(currentQuestion?.type) }}</span>
              <span class="text-sm text-muted ml-auto">（{{ currentItem?.score }} 分）</span>
            </h3>
          </div>

          <p class="mb-4" style="font-size:1.05rem;line-height:1.8">{{ currentQuestion?.stem }}</p>

          <!-- Single choice -->
          <div v-if="currentQuestion?.type === 'single'" class="radio-group">
            <label v-for="(opt, oi) in currentQuestion.options" :key="oi"
              class="radio-item" :class="{ selected: answers[currentItem.questionId] === oi }"
              @click="selectSingle(currentItem.questionId, oi)">
              <span class="radio-circle">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" class="outline" />
                  <path d="M6 12 C8 8, 10 7, 12 6 C14 7, 16 8, 18 12 C16 16, 14 17, 12 18 C10 17, 8 16, 6 12Z" class="scribble" />
                </svg>
              </span>
              <span class="radio-label">{{ String.fromCharCode(65 + oi) }}. {{ opt }}</span>
            </label>
          </div>

          <!-- Multiple choice -->
          <div v-if="currentQuestion?.type === 'multiple'">
            <label v-for="(opt, oi) in currentQuestion.options" :key="oi"
              class="checkbox-item" :class="{ selected: (answers[currentItem.questionId] || []).includes(oi) }"
              @click="toggleMultiple(currentItem.questionId, oi)">
              <span class="checkbox-box">
                <svg viewBox="0 0 22 22">
                  <rect x="1" y="1" width="20" height="20" rx="2" class="outline" />
                  <line x1="4" y1="4" x2="18" y2="18" class="cross" />
                  <line x1="18" y1="4" x2="4" y2="18" class="cross" />
                </svg>
              </span>
              <span>{{ String.fromCharCode(65 + oi) }}. {{ opt }}</span>
            </label>
          </div>

          <!-- Fill blank -->
          <div v-if="currentQuestion?.type === 'blank'" class="form-group">
            <input class="form-input hand-text" v-model="answers[currentItem.questionId]" placeholder="请输入答案" @input="scheduleAutoSave" style="font-size:1.1rem" />
          </div>

          <!-- Essay -->
          <div v-if="currentQuestion?.type === 'essay'" class="form-group">
            <textarea class="form-textarea hand-text" v-model="answers[currentItem.questionId]" @input="scheduleAutoSave" rows="6" placeholder="请输入答案" style="font-size:1.05rem"></textarea>
          </div>
        </div>

        <!-- Bottom controls -->
        <div class="flex items-center justify-between mt-4">
          <button class="btn btn-ghost" @click="goTo(currentQ - 1)" :disabled="currentQ <= 0">← 上一题</button>
          <button :class="['btn', flagged[currentQ] ? 'btn-primary' : 'btn-ghost']" @click="toggleFlag">
            🔖 {{ flagged[currentQ] ? '取消标记' : '标记' }}
          </button>
          <button class="btn btn-ghost" @click="goTo(currentQ + 1)" :disabled="currentQ >= paper.questions.length - 1">下一题 →</button>
        </div>

        <div class="text-center mt-6">
          <button class="btn btn-primary" @click="showSubmitDialog = true" style="font-size:1rem;padding:12px 32px">📝 提交试卷</button>
        </div>

        <!-- Auto-save indicator -->
        <div class="text-center mt-2 text-sm text-muted" v-if="showSaved">已自动保存</div>
      </div>
    </div>

    <!-- Submit dialog -->
    <div class="dialog-overlay" v-if="showSubmitDialog">
      <div class="dialog-box">
        <div class="dialog-title">确认提交试卷？</div>
        <div class="dialog-body">
          <p>已答：{{ unanswered }} / {{ paper.questions.length }} 题</p>
          <p v-if="unanswered > 0" style="color:var(--red-ink);margin-top:8px">
            ⚠️ 您还有 {{ unanswered }} 题未作答，确认提交？
          </p>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="showSubmitDialog = false">继续答题</button>
          <button class="btn btn-primary" @click="doSubmit">确认提交</button>
        </div>
      </div>
    </div>
  </div>
  <div class="empty-state" v-else><p>考试不存在或已过期</p></div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { paperStore, recordStore, questionStore } from '../../stores/index.js'

const router = useRouter()
const route = useRoute()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

const paper = ref(null)
const record = ref(null)
const currentQ = ref(0)
const answers = reactive({})
const flagged = reactive({})
const remainSec = ref(0)
const showWarning = ref(false)
const showSubmitDialog = ref(false)
const showSaved = ref(false)
let countdownTimer = null
let autoSaveTimer = null

onMounted(() => {
  paper.value = paperStore.getById(route.params.paperId)
  const recordId = route.query.record
  record.value = recordStore.getById(recordId)

  if (!paper.value || !record.value) return

  setBreadcrumbs([
    { label: '考试列表', to: '/student/exams' },
    { label: paper.value.name },
    { label: '答题' }
  ])

  // Restore answers from record
  Object.assign(answers, record.value.answers || {})
  Object.assign(flagged, record.value.flagged || {})

  // Calculate remaining time using Date.now() (no drift)
  startCountdown()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

function startCountdown() {
  const startTime = record.value.startTime
  const durationMs = paper.value.duration * 60 * 1000
  const endTime = startTime + durationMs

  // Also consider paper end time
  let effectiveEnd = endTime
  if (paper.value.endTime) {
    const paperEnd = new Date(paper.value.endTime).getTime()
    effectiveEnd = Math.min(endTime, paperEnd)
  }

  const updateRemain = () => {
    const now = Date.now()
    const left = Math.max(0, Math.floor((effectiveEnd - now) / 1000))
    remainSec.value = left

    if (left <= 300 && left > 0 && !showWarning.value) {
      showWarning.value = true
    }

    if (left <= 0) {
      clearInterval(countdownTimer)
      autoSubmit()
    }
  }

  updateRemain()
  countdownTimer = setInterval(updateRemain, 1000)
}

function formatCountdown(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const currentItem = computed(() => paper.value?.questions[currentQ.value])
const currentQuestion = computed(() => currentItem.value ? questionStore.getById(currentItem.value.questionId) : null)

const answeredCount = computed(() => {
  if (!paper.value) return 0
  return paper.value.questions.filter(item => {
    const a = answers[item.questionId]
    if (a === undefined || a === null || a === '') return false
    if (Array.isArray(a) && a.length === 0) return false
    return true
  }).length
})

const unanswered = computed(() => (paper.value?.questions.length || 0) - answeredCount.value)
const progressPct = computed(() => paper.value ? Math.round((answeredCount.value / paper.value.questions.length) * 100) : 0)

function typeLabel(t) { return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t }

function navClass(i) {
  const classes = []
  if (i === currentQ.value) classes.push('current')
  const item = paper.value.questions[i]
  const a = answers[item.questionId]
  const isAnswered = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0)
  if (flagged[i]) classes.push('flagged')
  else if (isAnswered) classes.push('answered')
  return classes.join(' ')
}

function goTo(i) {
  if (i >= 0 && i < paper.value.questions.length) {
    currentQ.value = i
  }
}

function selectSingle(qid, oi) {
  answers[qid] = oi
  scheduleAutoSave()
}

function toggleMultiple(qid, oi) {
  if (!answers[qid]) answers[qid] = []
  const arr = answers[qid]
  const idx = arr.indexOf(oi)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(oi)
  scheduleAutoSave()
}

function toggleFlag() {
  flagged[currentQ.value] = !flagged[currentQ.value]
}

// Auto-save with 3s debounce
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    recordStore.updateAnswers(record.value.id, { ...answers }, { ...flagged })
    showSaved.value = true
    setTimeout(() => showSaved.value = false, 2000)
  }, 3000)
}

function doSubmit() {
  showSubmitDialog.value = false
  // Save answers first
  recordStore.updateAnswers(record.value.id, { ...answers }, { ...flagged })
  // Submit and grade
  recordStore.submit(record.value.id, paper.value)
  toast('试卷提交成功')
  router.push('/student/result/' + record.value.id)
}

function autoSubmit() {
  recordStore.updateAnswers(record.value.id, { ...answers }, { ...flagged })
  recordStore.submit(record.value.id, paper.value)
  toast('考试时间已到，已自动提交', 'warning')
  router.push('/student/result/' + record.value.id)
}
</script>
