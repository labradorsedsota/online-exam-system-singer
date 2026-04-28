<template>
  <div v-if="record && paper">
    <div class="flex items-center justify-between mb-4">
      <h2>批改详情 — {{ record.studentName }}</h2>
      <router-link :to="'/admin/scores/' + paper.id" class="btn btn-ghost btn-sm">← 返回</router-link>
    </div>

    <!-- Overview -->
    <div class="card card-sm mb-4">
      <div class="grid-3">
        <div class="stat-card"><div class="stat-value">{{ record.totalScore }}</div><div class="stat-label">当前得分</div></div>
        <div class="stat-card"><div class="stat-value">{{ fullScore }}</div><div class="stat-label">试卷满分</div></div>
        <div class="stat-card">
          <div class="stat-value" :style="{ color: record.totalScore >= paper.passScore ? 'var(--green-ink)' : 'var(--red-ink)' }">
            {{ isFullyGraded ? (record.totalScore >= paper.passScore ? '及格' : '不及格') : '待评' }}
          </div>
          <div class="stat-label">及格线 {{ paper.passScore }} 分</div>
        </div>
      </div>
    </div>

    <!-- Each question -->
    <div v-for="(item, i) in paper.questions" :key="item.questionId" :class="['card', 'card-torn', 'mb-4']">
      <div class="flex items-center justify-between mb-2">
        <h3>第 {{ i + 1 }} 题 <span :class="['tag', 'tag-' + getQ(item.questionId)?.type]">{{ typeLabel(getQ(item.questionId)?.type) }}</span></h3>
        <span class="text-sm">
          <template v-if="record.scores[item.questionId] !== null">
            <span :class="record.scores[item.questionId] === item.score ? 'mark-correct' : (record.scores[item.questionId] === 0 ? 'mark-wrong' : '')">
              {{ record.scores[item.questionId] }} / {{ item.score }} 分
            </span>
          </template>
          <span v-else class="text-muted">待评分 / {{ item.score }} 分</span>
        </span>
      </div>

      <p class="mb-3" style="line-height:1.8">{{ getQ(item.questionId)?.stem }}</p>

      <!-- Single choice display -->
      <div v-if="getQ(item.questionId)?.type === 'single'" class="mb-3">
        <div v-for="(opt, oi) in getQ(item.questionId).options" :key="oi" class="flex items-center gap-2 mb-1">
          <span :class="{
            'mark-correct': oi === getQ(item.questionId).correctAnswer,
            'mark-wrong': record.answers[item.questionId] === oi && oi !== getQ(item.questionId).correctAnswer
          }">
            {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            <span v-if="oi === getQ(item.questionId).correctAnswer"> ✓</span>
            <span v-if="record.answers[item.questionId] === oi && oi !== getQ(item.questionId).correctAnswer"> ✗</span>
          </span>
        </div>
        <p class="text-sm mt-2"><strong>考生选择：</strong>{{ record.answers[item.questionId] !== undefined ? String.fromCharCode(65 + record.answers[item.questionId]) : '未作答' }}</p>
      </div>

      <!-- Multiple choice display -->
      <div v-if="getQ(item.questionId)?.type === 'multiple'" class="mb-3">
        <div v-for="(opt, oi) in getQ(item.questionId).options" :key="oi" class="flex items-center gap-2 mb-1">
          <span :class="{
            'mark-correct': getQ(item.questionId).correctAnswers?.includes(oi),
            'mark-wrong': (record.answers[item.questionId] || []).includes(oi) && !getQ(item.questionId).correctAnswers?.includes(oi)
          }">
            {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            <span v-if="getQ(item.questionId).correctAnswers?.includes(oi)"> ✓</span>
          </span>
        </div>
        <p class="text-sm mt-2"><strong>考生选择：</strong>{{ (record.answers[item.questionId] || []).map(x => String.fromCharCode(65 + x)).join(', ') || '未作答' }}</p>
      </div>

      <!-- Blank display -->
      <div v-if="getQ(item.questionId)?.type === 'blank'" class="mb-3">
        <p><strong>考生答案：</strong><span class="hand-text">{{ record.answers[item.questionId] || '（未作答）' }}</span></p>
        <p><strong>参考答案：</strong>{{ getQ(item.questionId).correctAnswer }}</p>
      </div>

      <!-- Essay display + manual grading -->
      <div v-if="getQ(item.questionId)?.type === 'essay'" class="mb-3">
        <div class="alert alert-info mb-2">
          <strong>考生答案：</strong>
          <p class="hand-text" style="white-space:pre-wrap;margin-top:6px">{{ record.answers[item.questionId] || '（未作答）' }}</p>
        </div>
        <div v-if="getQ(item.questionId).referenceAnswer" class="mb-2">
          <strong>参考答案：</strong>
          <p class="text-muted" style="white-space:pre-wrap">{{ getQ(item.questionId).referenceAnswer }}</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="form-label" style="margin:0">评分：</label>
          <input type="number" class="form-input form-number" v-model.number="essayScores[item.questionId]" min="0" :max="item.score" />
          <span class="text-sm text-muted">/ {{ item.score }} 分</span>
          <button class="btn btn-sm btn-primary" @click="gradeEssay(item.questionId, item.score)">保存评分</button>
        </div>
      </div>
    </div>
  </div>
  <div class="empty-state" v-else><p>记录不存在</p></div>
</template>

<script setup>
import { ref, computed, reactive, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { questionStore, paperStore, recordStore } from '../../stores/index.js'

const route = useRoute()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

const paper = computed(() => paperStore.getById(route.params.examId))
const record = computed(() => recordStore.getById(route.params.recordId))
const fullScore = computed(() => paper.value ? (paper.value.questions || []).reduce((s, q) => s + (q.score || 0), 0) : 0)
const isFullyGraded = computed(() => record.value ? !Object.values(record.value.scores).some(s => s === null) : false)

const essayScores = reactive({})

onMounted(() => {
  setBreadcrumbs([
    { label: '成绩管理', to: '/admin/scores' },
    { label: paper.value?.name || '考试', to: '/admin/scores/' + route.params.examId },
    { label: record.value?.studentName || '批改详情' }
  ])
  // Init essay scores from existing
  if (record.value && paper.value) {
    for (const item of paper.value.questions) {
      const q = questionStore.getById(item.questionId)
      if (q?.type === 'essay') {
        essayScores[item.questionId] = record.value.scores[item.questionId] ?? 0
      }
    }
  }
})

function getQ(id) { return questionStore.getById(id) }
function typeLabel(t) { return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t }

function gradeEssay(questionId, maxScore) {
  let score = essayScores[questionId]
  if (score === undefined || score === null || score < 0) score = 0
  if (score > maxScore) score = maxScore
  recordStore.gradeEssay(route.params.recordId, questionId, score)
  toast('评分已保存')
}
</script>
