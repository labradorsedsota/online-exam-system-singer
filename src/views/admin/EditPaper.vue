<template>
  <div>
    <h2 class="mb-4">编辑试卷</h2>
    <div class="card mb-4" v-if="paper">
      <div class="alert alert-warning" v-if="paper.status !== 'draft'">试卷已发布/关闭，不可编辑</div>
      <h3 class="mb-3">基本信息</h3>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">试卷名称 *</label>
          <input class="form-input" v-model="form.name" :disabled="paper.status !== 'draft'" :class="{ error: errors.name }" />
          <div class="form-error" v-if="errors.name">{{ errors.name }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">考试时长（分钟）*</label>
          <input type="number" class="form-input" v-model.number="form.duration" min="1" max="480" :disabled="paper.status !== 'draft'" />
        </div>
        <div class="form-group">
          <label class="form-label">及格分数线 *</label>
          <input type="number" class="form-input" v-model.number="form.passScore" min="0" :disabled="paper.status !== 'draft'" />
        </div>
        <div class="form-group">
          <label class="form-label">考试说明</label>
          <input class="form-input" v-model="form.description" :disabled="paper.status !== 'draft'" />
        </div>
      </div>
      <h3 class="mb-3 mt-4">考试时间窗口</h3>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">开始时间</label>
          <input type="datetime-local" class="form-input" v-model="form.startTime" :disabled="paper.status !== 'draft'" />
        </div>
        <div class="form-group">
          <label class="form-label">结束时间</label>
          <input type="datetime-local" class="form-input" v-model="form.endTime" :disabled="paper.status !== 'draft'" />
          <div class="form-error" v-if="errors.endTime">{{ errors.endTime }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4" v-if="paper && paper.status === 'draft'">
      <h3 class="mb-3">从题库选题</h3>
      <div class="tabs">
        <button v-for="t in typeTabs" :key="t.value" :class="['tab', qFilter === t.value ? 'active' : '']" @click="qFilter = t.value">{{ t.label }}</button>
      </div>
      <div class="table-wrapper" v-if="availableQuestions.length">
        <table>
          <thead><tr><th style="width:40px">选择</th><th>题干</th><th>题型</th><th>分值</th></tr></thead>
          <tbody>
            <tr v-for="q in availableQuestions" :key="q.id" :class="{ highlight: isSelected(q.id) }">
              <td>
                <label class="checkbox-item" :class="{ selected: isSelected(q.id) }" @click.prevent="toggleSelect(q)" style="padding:0">
                  <span class="checkbox-box"><svg viewBox="0 0 22 22"><rect x="1" y="1" width="20" height="20" rx="2" class="outline" /><line x1="4" y1="4" x2="18" y2="18" class="cross" /><line x1="18" y1="4" x2="4" y2="18" class="cross" /></svg></span>
                </label>
              </td>
              <td class="truncate">{{ q.stem }}</td>
              <td><span :class="['tag', 'tag-' + q.type]">{{ typeLabel(q.type) }}</span></td>
              <td>{{ q.suggestedScore || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mb-4" v-if="form.questions.length">
      <h3 class="mb-3">已选题目（{{ form.questions.length }}）— 总分：{{ totalScore }} 分</h3>
      <table>
        <thead><tr><th>#</th><th>题干</th><th>题型</th><th style="width:100px">分值</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="(item, i) in form.questions" :key="item.questionId">
            <td>{{ i + 1 }}</td>
            <td class="truncate">{{ getQ(item.questionId)?.stem }}</td>
            <td><span :class="['tag', 'tag-' + getQ(item.questionId)?.type]">{{ typeLabel(getQ(item.questionId)?.type) }}</span></td>
            <td><input type="number" class="form-input form-number" v-model.number="item.score" min="0" max="100" :disabled="paper?.status !== 'draft'" /></td>
            <td>
              <div class="flex gap-2" v-if="paper?.status === 'draft'">
                <button class="btn btn-sm btn-icon btn-ghost" @click="moveUp(i)" :disabled="i === 0">↑</button>
                <button class="btn btn-sm btn-icon btn-ghost" @click="moveDown(i)" :disabled="i === form.questions.length - 1">↓</button>
                <button class="btn btn-sm btn-danger" @click="form.questions.splice(i, 1)">移除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex gap-3" v-if="paper?.status === 'draft'">
      <button class="btn btn-primary" @click="save">保存修改</button>
      <router-link to="/admin/papers" class="btn btn-ghost">取消</router-link>
    </div>

    <div class="empty-state" v-if="!paper"><p>试卷不存在</p><router-link to="/admin/papers" class="btn btn-ghost">返回</router-link></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { questionStore, paperStore } from '../../stores/index.js'

const router = useRouter()
const route = useRoute()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

const paper = ref(null)
const form = reactive({ name: '', duration: 90, passScore: 60, description: '', startTime: '', endTime: '', questions: [] })
const errors = reactive({})
const qFilter = ref('all')
const typeTabs = [{ label: '全部', value: 'all' }, { label: '单选', value: 'single' }, { label: '多选', value: 'multiple' }, { label: '填空', value: 'blank' }, { label: '简答', value: 'essay' }]

onMounted(() => {
  setBreadcrumbs([{ label: '试卷管理', to: '/admin/papers' }, { label: '编辑试卷' }])
  const p = paperStore.getById(route.params.id)
  if (p) {
    paper.value = p
    form.name = p.name
    form.duration = p.duration
    form.passScore = p.passScore
    form.description = p.description || ''
    form.startTime = p.startTime || ''
    form.endTime = p.endTime || ''
    form.questions = (p.questions || []).map(q => ({ ...q }))
  }
})

function typeLabel(t) { return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t }
function getQ(id) { return questionStore.getById(id) }
const availableQuestions = computed(() => {
  let list = [...questionStore.items]
  if (qFilter.value !== 'all') list = list.filter(q => q.type === qFilter.value)
  return list
})
const totalScore = computed(() => form.questions.reduce((s, q) => s + (q.score || 0), 0))
function isSelected(id) { return form.questions.some(q => q.questionId === id) }
function toggleSelect(q) {
  const idx = form.questions.findIndex(x => x.questionId === q.id)
  if (idx >= 0) form.questions.splice(idx, 1)
  else form.questions.push({ questionId: q.id, score: q.suggestedScore || 10 })
}
function moveUp(i) { if (i > 0) { const t = form.questions[i]; form.questions[i] = form.questions[i-1]; form.questions[i-1] = t } }
function moveDown(i) { if (i < form.questions.length - 1) { const t = form.questions[i]; form.questions[i] = form.questions[i+1]; form.questions[i+1] = t } }

function save() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) { errors.name = '名称不能为空'; return }
  if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) { errors.endTime = '结束时间必须晚于开始时间'; return }
  paperStore.update(route.params.id, {
    name: form.name.trim(), duration: form.duration, passScore: form.passScore, description: form.description,
    startTime: form.startTime || null, endTime: form.endTime || null, questions: [...form.questions]
  })
  toast('试卷修改已保存')
  router.push('/admin/papers')
}
</script>
