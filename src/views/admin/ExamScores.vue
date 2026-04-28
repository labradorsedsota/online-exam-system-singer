<template>
  <div>
    <h2 class="mb-4">考试统计 — {{ paper?.name }}</h2>
    <div v-if="paper">
      <router-link :to="'/admin/scores'" class="btn btn-ghost btn-sm mb-4">← 返回成绩列表</router-link>
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>考生</th><th>总分/满分</th><th>及格</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="r in records" :key="r.id">
                <td class="hand-text">{{ r.studentName }}</td>
                <td>{{ r.totalScore }} / {{ fullScore }}</td>
                <td><span :class="['tag', r.totalScore >= paper.passScore ? 'tag-pass' : 'tag-fail']">{{ r.totalScore >= paper.passScore ? '及格' : '不及格' }}</span></td>
                <td class="text-sm text-muted">{{ new Date(r.submitTime).toLocaleString('zh-CN') }}</td>
                <td><span :class="['tag', isGraded(r) ? 'tag-published' : 'tag-draft']">{{ isGraded(r) ? '已评' : '待评' }}</span></td>
                <td><router-link :to="'/admin/scores/' + paper.id + '/' + r.id" class="btn btn-sm btn-ghost">批改</router-link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else><p>考试不存在</p></div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { paperStore, recordStore } from '../../stores/index.js'

const route = useRoute()
const setBreadcrumbs = inject('setBreadcrumbs')

const paper = computed(() => paperStore.getById(route.params.examId))
const records = computed(() => recordStore.getByPaper(route.params.examId).filter(r => r.status !== 'in-progress').sort((a, b) => (b.submitTime || 0) - (a.submitTime || 0)))
const fullScore = computed(() => paper.value ? (paper.value.questions || []).reduce((s, q) => s + (q.score || 0), 0) : 0)
function isGraded(r) { return !Object.values(r.scores).some(s => s === null) }

onMounted(() => {
  setBreadcrumbs([
    { label: '成绩管理', to: '/admin/scores' },
    { label: paper.value?.name || '考试统计' }
  ])
})
</script>
