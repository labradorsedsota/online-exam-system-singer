<template>
  <div v-if="record && paper">
    <!-- Steps -->
    <div class="steps mb-4">
      <div class="step done"><div class="step-dot">✓</div><div class="step-label">答题</div></div>
      <div class="step-line done"></div>
      <div class="step done"><div class="step-dot">✓</div><div class="step-label">提交</div></div>
      <div class="step-line done"></div>
      <div :class="['step', isFullyGraded ? 'done' : 'active']">
        <div class="step-dot">{{ isFullyGraded ? '✓' : '3' }}</div>
        <div class="step-label">评分</div>
      </div>
      <div class="step-line" :class="{ done: isFullyGraded }"></div>
      <div :class="['step', isFullyGraded ? 'active' : '']">
        <div class="step-dot">4</div>
        <div class="step-label">查看结果</div>
      </div>
    </div>

    <!-- Result card -->
    <div class="card text-center mb-6" style="padding:40px">
      <div style="font-size:3rem;margin-bottom:12px">{{ isFullyGraded ? '📋' : '⏳' }}</div>
      <h2 class="mb-2">{{ isFullyGraded ? '评分完成' : '考试已提交' }}</h2>
      <p class="text-muted mb-4">{{ paper.name }} · {{ record.studentName }}</p>

      <div class="grid-3 mb-4" style="max-width:500px;margin:0 auto">
        <div class="stat-card">
          <div class="stat-value" :style="{ color: passed ? 'var(--red-ink)' : 'var(--green-ink)' }">{{ record.totalScore }}</div>
          <div class="stat-label">得分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ fullScore }}</div>
          <div class="stat-label">满分</div>
        </div>
        <div class="stat-card">
          <div>
            <span v-if="isFullyGraded" :class="['tag', passed ? 'tag-pass' : 'tag-fail']" style="font-size:1rem;padding:6px 16px">
              {{ passed ? '及格' : '不及格' }}
            </span>
            <span v-else class="tag tag-draft" style="font-size:1rem;padding:6px 16px">待评</span>
          </div>
          <div class="stat-label mt-2">及格线 {{ paper.passScore }} 分</div>
        </div>
      </div>

      <p v-if="!isFullyGraded" class="text-muted">含简答题，等待出题人手动评分后更新总分</p>
    </div>

    <!-- Answer review -->
    <h3 class="mb-3">答题回顾</h3>
    <div v-for="(item, i) in paper.questions" :key="item.questionId" class="card card-torn mb-4">
      <div class="flex items-center justify-between mb-2">
        <h4>第 {{ i + 1 }} 题 <span :class="['tag', 'tag-' + getQ(item.questionId)?.type]">{{ typeLabel(getQ(item.questionId)?.type) }}</span></h4>
        <span>
          <template v-if="record.scores[item.questionId] !== null">
            <span :class="record.scores[item.questionId] === item.score ? 'mark-correct' : (record.scores[item.questionId] === 0 ? 'mark-wrong' : '')">
              {{ record.scores[item.questionId] }} / {{ item.score }} 分
            </span>
          </template>
          <span v-else class="text-muted">待评分</span>
        </span>
      </div>

      <p class="mb-3" style="line-height:1.8">{{ getQ(item.questionId)?.stem }}</p>

      <!-- Single -->
      <div v-if="getQ(item.questionId)?.type === 'single'">
        <div v-for="(opt, oi) in getQ(item.questionId).options" :key="oi" class="mb-1">
          <span :class="{
            'mark-correct': oi === getQ(item.questionId).correctAnswer,
            'mark-wrong': record.answers[item.questionId] === oi && oi !== getQ(item.questionId).correctAnswer
          }">
            {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            <span v-if="oi === getQ(item.questionId).correctAnswer"> ✓ 正确答案</span>
            <span v-if="record.answers[item.questionId] === oi"> ← 你的选择</span>
          </span>
        </div>
      </div>

      <!-- Multiple -->
      <div v-if="getQ(item.questionId)?.type === 'multiple'">
        <div v-for="(opt, oi) in getQ(item.questionId).options" :key="oi" class="mb-1">
          <span :class="{
            'mark-correct': getQ(item.questionId).correctAnswers?.includes(oi),
            'mark-wrong': (record.answers[item.questionId] || []).includes(oi) && !getQ(item.questionId).correctAnswers?.includes(oi)
          }">
            {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            <span v-if="getQ(item.questionId).correctAnswers?.includes(oi)"> ✓</span>
            <span v-if="(record.answers[item.questionId] || []).includes(oi)"> ← 你的选择</span>
          </span>
        </div>
      </div>

      <!-- Blank -->
      <div v-if="getQ(item.questionId)?.type === 'blank'">
        <p><strong>你的答案：</strong><span class="hand-text">{{ record.answers[item.questionId] || '（未作答）' }}</span></p>
        <p class="mark-correct"><strong>参考答案：</strong>{{ getQ(item.questionId).correctAnswer }}</p>
      </div>

      <!-- Essay -->
      <div v-if="getQ(item.questionId)?.type === 'essay'">
        <p><strong>你的答案：</strong></p>
        <p class="hand-text" style="white-space:pre-wrap;background:var(--tape-beige);padding:10px;border-radius:6px">{{ record.answers[item.questionId] || '（未作答）' }}</p>
        <p v-if="record.scores[item.questionId] !== null" class="mt-2 mark-correct">评分：{{ record.scores[item.questionId] }} / {{ item.score }} 分</p>
        <p v-else class="mt-2 text-muted">⏳ 待出题人评分</p>
      </div>
    </div>

    <div class="text-center mt-4">
      <router-link to="/student/exams" class="btn btn-ghost">返回考试列表</router-link>
    </div>
  </div>
  <div class="empty-state" v-else><p>记录不存在</p></div>
</template>

<script setup>
import { computed, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { paperStore, recordStore, questionStore } from '../../stores/index.js'

const route = useRoute()
const setBreadcrumbs = inject('setBreadcrumbs')

const record = computed(() => recordStore.getById(route.params.recordId))
const paper = computed(() => record.value ? paperStore.getById(record.value.paperId) : null)
const fullScore = computed(() => paper.value ? (paper.value.questions || []).reduce((s, q) => s + (q.score || 0), 0) : 0)
const isFullyGraded = computed(() => record.value ? !Object.values(record.value.scores).some(s => s === null) : false)
const passed = computed(() => record.value && paper.value ? record.value.totalScore >= paper.value.passScore : false)

function getQ(id) { return questionStore.getById(id) }
function typeLabel(t) { return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t }

onMounted(() => {
  setBreadcrumbs([
    { label: '考试列表', to: '/student/exams' },
    { label: paper.value?.name || '考试' },
    { label: '结果' }
  ])
})
</script>
