<template>
  <div>
    <h2 class="mb-4">创建试卷</h2>
    <div class="card mb-4">
      <h3 class="mb-3">基本信息</h3>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">试卷名称 *</label>
          <input class="form-input" v-model="form.name" placeholder="如：期中考试" :class="{ error: errors.name }" />
          <div class="form-error" v-if="errors.name">{{ errors.name }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">考试时长（分钟）*</label>
          <input type="number" class="form-input" v-model.number="form.duration" min="1" max="480" :class="{ error: errors.duration }" />
          <div class="form-error" v-if="errors.duration">{{ errors.duration }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">及格分数线 *</label>
          <input type="number" class="form-input" v-model.number="form.passScore" min="0" :class="{ error: errors.passScore }" />
          <div class="form-error" v-if="errors.passScore">{{ errors.passScore }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">考试说明</label>
          <input class="form-input" v-model="form.description" placeholder="选填，最长 300 字" />
        </div>
      </div>

      <h3 class="mb-3 mt-4">考试时间窗口（选填）</h3>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">开始时间</label>
          <input type="datetime-local" class="form-input" v-model="form.startTime" />
        </div>
        <div class="form-group">
          <label class="form-label">结束时间</label>
          <input type="datetime-local" class="form-input" v-model="form.endTime" />
          <div class="form-error" v-if="errors.endTime">{{ errors.endTime }}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="mb-3">从题库选题</h3>
      <div class="alert alert-info" v-if="!questionStore.items.length">
        题库为空，请先 <router-link to="/admin/questions/create">创建题目</router-link>
      </div>

      <!-- Filter tabs -->
      <div class="tabs" v-if="questionStore.items.length">
        <button v-for="t in typeTabs" :key="t.value" :class="['tab', qFilter === t.value ? 'active' : '']" @click="qFilter = t.value">{{ t.label }}</button>
      </div>

      <div class="table-wrapper" v-if="availableQuestions.length">
        <table>
          <thead>
            <tr>
              <th style="width:40px">选择</th>
              <th>题干</th>
              <th>题型</th>
              <th>分值建议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in availableQuestions" :key="q.id" :class="{ 'highlight': isSelected(q.id) }">
              <td>
                <label class="checkbox-item" :class="{ selected: isSelected(q.id) }" @click.prevent="toggleSelect(q)" style="padding:0">
                  <span class="checkbox-box">
                    <svg viewBox="0 0 22 22"><rect x="1" y="1" width="20" height="20" rx="2" class="outline" /><line x1="4" y1="4" x2="18" y2="18" class="cross" /><line x1="18" y1="4" x2="4" y2="18" class="cross" /></svg>
                  </span>
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

    <!-- Selected questions -->
    <div class="card mb-4" v-if="form.questions.length">
      <h3 class="mb-3">已选题目（{{ form.questions.length }}）— 总分：{{ totalScore }} 分</h3>
      <div class="form-error mb-3" v-if="errors.questions">{{ errors.questions }}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>题干</th>
            <th>题型</th>
            <th style="width:100px">分值</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in form.questions" :key="item.questionId">
            <td>{{ i + 1 }}</td>
            <td class="truncate">{{ getQuestion(item.questionId)?.stem }}</td>
            <td><span :class="['tag', 'tag-' + getQuestion(item.questionId)?.type]">{{ typeLabel(getQuestion(item.questionId)?.type) }}</span></td>
            <td><input type="number" class="form-input form-number" v-model.number="item.score" min="0" max="100" /></td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-icon btn-ghost" @click="moveUp(i)" :disabled="i === 0">↑</button>
                <button class="btn btn-sm btn-icon btn-ghost" @click="moveDown(i)" :disabled="i === form.questions.length - 1">↓</button>
                <button class="btn btn-sm btn-danger" @click="removeQuestion(i)">移除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="alert alert-warning" v-if="errors.questions && !form.questions.length">{{ errors.questions }}</div>

    <div class="flex gap-3">
      <button class="btn btn-primary" @click="save">保存试卷</button>
      <router-link to="/admin/papers" class="btn btn-ghost">取消</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { questionStore, paperStore } from '../../stores/index.js'

const router = useRouter()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')
onMounted(() => setBreadcrumbs([{ label: '试卷管理', to: '/admin/papers' }, { label: '创建试卷' }]))

const typeTabs = [
  { label: '全部', value: 'all' },
  { label: '单选', value: 'single' },
  { label: '多选', value: 'multiple' },
  { label: '填空', value: 'blank' },
  { label: '简答', value: 'essay' },
]

const qFilter = ref('all')
const form = reactive({
  name: '',
  duration: 90,
  passScore: 60,
  description: '',
  startTime: '',
  endTime: '',
  questions: []  // [{ questionId, score }]
})
const errors = reactive({})

function typeLabel(t) {
  return { single: '单选', multiple: '多选', blank: '填空', essay: '简答' }[t] || t
}

const availableQuestions = computed(() => {
  let list = [...questionStore.items]
  if (qFilter.value !== 'all') list = list.filter(q => q.type === qFilter.value)
  return list
})

const totalScore = computed(() => form.questions.reduce((s, q) => s + (q.score || 0), 0))

function getQuestion(id) { return questionStore.getById(id) }

function isSelected(id) { return form.questions.some(q => q.questionId === id) }

function toggleSelect(q) {
  const idx = form.questions.findIndex(x => x.questionId === q.id)
  if (idx >= 0) {
    form.questions.splice(idx, 1)
  } else {
    form.questions.push({ questionId: q.id, score: q.suggestedScore || 10 })
  }
}

function removeQuestion(i) { form.questions.splice(i, 1) }

function moveUp(i) {
  if (i <= 0) return
  const temp = form.questions[i]
  form.questions[i] = form.questions[i - 1]
  form.questions[i - 1] = temp
}

function moveDown(i) {
  if (i >= form.questions.length - 1) return
  const temp = form.questions[i]
  form.questions[i] = form.questions[i + 1]
  form.questions[i + 1] = temp
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = '试卷名称不能为空'
  if (form.name.length > 100) errors.name = '试卷名称不能超过 100 字'
  if (!form.duration || form.duration < 1 || form.duration > 480) errors.duration = '考试时长范围为 1-480 分钟'
  if (form.passScore < 0) errors.passScore = '及格分数线不能为负'
  if (form.questions.length === 0) errors.questions = '请至少选择一道题目'
  if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
    errors.endTime = '结束时间必须晚于开始时间'
  }
  return Object.keys(errors).length === 0
}

function save() {
  if (!validate()) return
  paperStore.add({
    name: form.name.trim(),
    duration: form.duration,
    passScore: form.passScore,
    description: form.description,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    questions: [...form.questions]
  })
  toast('试卷创建成功')
  router.push('/admin/papers')
}
</script>
