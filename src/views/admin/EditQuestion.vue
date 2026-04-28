<template>
  <div>
    <h2 class="mb-4">编辑题目</h2>
    <div class="card" v-if="loaded">
      <form @submit.prevent="save">
        <div class="form-group">
          <label class="form-label">题型</label>
          <select class="form-select" v-model="form.type" disabled>
            <option value="single">单选题</option>
            <option value="multiple">多选题</option>
            <option value="blank">填空题</option>
            <option value="essay">简答题</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">题干 *</label>
          <textarea class="form-textarea" v-model="form.stem" rows="3" :class="{ error: errors.stem }"></textarea>
          <div class="form-error" v-if="errors.stem">{{ errors.stem }}</div>
        </div>

        <div class="form-group" v-if="form.type === 'single' || form.type === 'multiple'">
          <label class="form-label">选项 *</label>
          <div v-for="(opt, i) in form.options" :key="i" class="flex items-center gap-2 mb-2">
            <span class="tag">{{ String.fromCharCode(65 + i) }}</span>
            <input class="form-input" v-model="form.options[i]" />
            <button type="button" class="btn btn-sm btn-danger" @click="removeOption(i)" v-if="form.options.length > 2">✕</button>
          </div>
          <div class="form-error" v-if="errors.options">{{ errors.options }}</div>
          <button type="button" class="btn btn-sm btn-ghost mt-2" @click="form.options.push('')" :disabled="form.options.length >= (form.type === 'multiple' ? 8 : 6)">+ 添加选项</button>
        </div>

        <div class="form-group" v-if="form.type === 'single'">
          <label class="form-label">正确答案 *</label>
          <div class="radio-group">
            <label v-for="(opt, i) in form.options" :key="i" class="radio-item" :class="{ selected: form.correctAnswer === i }" @click="form.correctAnswer = i">
              <span class="radio-circle">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" class="outline" /><path d="M6 12 C8 8, 10 7, 12 6 C14 7, 16 8, 18 12 C16 16, 14 17, 12 18 C10 17, 8 16, 6 12Z" class="scribble" /></svg>
              </span>
              <span class="radio-label">{{ String.fromCharCode(65 + i) }}. {{ opt }}</span>
            </label>
          </div>
          <div class="form-error" v-if="errors.correctAnswer">{{ errors.correctAnswer }}</div>
        </div>

        <div class="form-group" v-if="form.type === 'multiple'">
          <label class="form-label">正确答案（至少2个）*</label>
          <div>
            <label v-for="(opt, i) in form.options" :key="i" class="checkbox-item" :class="{ selected: form.correctAnswers.includes(i) }" @click="toggleCorrect(i)">
              <span class="checkbox-box">
                <svg viewBox="0 0 22 22"><rect x="1" y="1" width="20" height="20" rx="2" class="outline" /><line x1="4" y1="4" x2="18" y2="18" class="cross" /><line x1="18" y1="4" x2="4" y2="18" class="cross" /></svg>
              </span>
              <span>{{ String.fromCharCode(65 + i) }}. {{ opt }}</span>
            </label>
          </div>
          <div class="form-error" v-if="errors.correctAnswers">{{ errors.correctAnswers }}</div>
        </div>

        <div class="form-group" v-if="form.type === 'blank'">
          <label class="form-label">参考答案 *</label>
          <input class="form-input" v-model="form.correctAnswer" :class="{ error: errors.correctAnswer }" />
          <div class="form-error" v-if="errors.correctAnswer">{{ errors.correctAnswer }}</div>
        </div>

        <div class="form-group" v-if="form.type === 'essay'">
          <label class="form-label">参考答案（选填）</label>
          <textarea class="form-textarea" v-model="form.referenceAnswer" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">分值建议</label>
          <input type="number" class="form-input form-number" v-model.number="form.suggestedScore" min="0" max="100" />
        </div>

        <div class="form-group">
          <label class="form-label">题目标签</label>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="tag" v-for="(tag, i) in form.tags" :key="i">{{ tag }} <span style="cursor:pointer;margin-left:4px" @click="form.tags.splice(i, 1)">×</span></span>
            <input class="form-input" style="width:120px" v-model="newTag" @keydown.enter.prevent="addTag" placeholder="回车添加" />
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <button type="submit" class="btn btn-primary">保存修改</button>
          <router-link to="/admin/questions" class="btn btn-ghost">取消</router-link>
        </div>
      </form>
    </div>
    <div class="empty-state" v-else>
      <p>题目不存在</p>
      <router-link to="/admin/questions" class="btn btn-ghost">返回题库</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { questionStore } from '../../stores/index.js'

const router = useRouter()
const route = useRoute()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

const loaded = ref(false)
const form = reactive({ type: '', stem: '', options: [], correctAnswer: null, correctAnswers: [], referenceAnswer: '', suggestedScore: 0, tags: [] })
const errors = reactive({})
const newTag = ref('')

onMounted(() => {
  setBreadcrumbs([
    { label: '题库管理', to: '/admin/questions' },
    { label: '编辑题目' }
  ])
  const q = questionStore.getById(route.params.id)
  if (q) {
    form.type = q.type
    form.stem = q.stem
    form.options = q.options ? [...q.options] : []
    form.correctAnswer = q.correctAnswer ?? null
    form.correctAnswers = q.correctAnswers ? [...q.correctAnswers] : []
    form.referenceAnswer = q.referenceAnswer || ''
    form.suggestedScore = q.suggestedScore || 0
    form.tags = q.tags ? [...q.tags] : []
    loaded.value = true
  }
})

function toggleCorrect(i) {
  const idx = form.correctAnswers.indexOf(i)
  if (idx >= 0) form.correctAnswers.splice(idx, 1)
  else form.correctAnswers.push(i)
}

function removeOption(i) {
  form.options.splice(i, 1)
  if (form.type === 'single' && form.correctAnswer === i) form.correctAnswer = null
  if (form.type === 'single' && form.correctAnswer > i) form.correctAnswer--
  if (form.type === 'multiple') {
    form.correctAnswers = form.correctAnswers.filter(x => x !== i).map(x => x > i ? x - 1 : x)
  }
}

function addTag() {
  const t = newTag.value.trim()
  if (t && !form.tags.includes(t)) form.tags.push(t)
  newTag.value = ''
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.stem.trim()) errors.stem = '题干不能为空'
  if (form.stem.length > 500) errors.stem = '题干不能超过 500 字'
  if ((form.type === 'single' || form.type === 'multiple') && form.options.filter(o => o.trim()).length < 2) errors.options = '至少添加 2 个选项'
  if (form.type === 'single' && form.correctAnswer === null) errors.correctAnswer = '请设置正确答案'
  if (form.type === 'multiple' && form.correctAnswers.length < 2) errors.correctAnswers = '多选题至少选择 2 个正确答案'
  if (form.type === 'blank' && !form.correctAnswer) errors.correctAnswer = '请设置参考答案'
  return Object.keys(errors).length === 0
}

function save() {
  if (!validate()) return
  const data = { stem: form.stem.trim(), suggestedScore: form.suggestedScore || 0, tags: [...form.tags] }
  if (form.type === 'single' || form.type === 'multiple') data.options = form.options.map(o => o.trim())
  if (form.type === 'single') data.correctAnswer = form.correctAnswer
  if (form.type === 'multiple') data.correctAnswers = [...form.correctAnswers]
  if (form.type === 'blank') data.correctAnswer = form.correctAnswer
  if (form.type === 'essay') data.referenceAnswer = form.referenceAnswer
  questionStore.update(route.params.id, data)
  toast('修改已保存')
  router.push('/admin/questions')
}
</script>
