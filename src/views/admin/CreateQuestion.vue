<template>
  <div>
    <h2 class="mb-4">创建题目</h2>
    <div class="card">
      <form @submit.prevent="save">
        <!-- Type -->
        <div class="form-group">
          <label class="form-label">题型 *</label>
          <select class="form-select" v-model="form.type" :class="{ error: errors.type }">
            <option value="">请选择题型</option>
            <option value="single">单选题</option>
            <option value="multiple">多选题</option>
            <option value="blank">填空题</option>
            <option value="essay">简答题</option>
          </select>
          <div class="form-error" v-if="errors.type">{{ errors.type }}</div>
        </div>

        <!-- Stem -->
        <div class="form-group">
          <label class="form-label">题干 *</label>
          <textarea class="form-textarea" v-model="form.stem" rows="3" placeholder="请输入题目内容（填空题请用 ____ 标记空位）" :class="{ error: errors.stem }"></textarea>
          <div class="form-error" v-if="errors.stem">{{ errors.stem }}</div>
          <div class="text-sm text-muted mt-2">{{ form.stem.length }}/500</div>
        </div>

        <!-- Options (single/multiple only) -->
        <div class="form-group" v-if="form.type === 'single' || form.type === 'multiple'">
          <label class="form-label">选项 *</label>
          <div v-for="(opt, i) in form.options" :key="i" class="flex items-center gap-2 mb-2">
            <span class="tag">{{ String.fromCharCode(65 + i) }}</span>
            <input class="form-input" v-model="form.options[i]" :placeholder="'选项 ' + String.fromCharCode(65 + i)" />
            <button type="button" class="btn btn-sm btn-danger" @click="removeOption(i)" v-if="form.options.length > 2">✕</button>
          </div>
          <div class="form-error" v-if="errors.options">{{ errors.options }}</div>
          <button type="button" class="btn btn-sm btn-ghost mt-2" @click="addOption" :disabled="form.options.length >= (form.type === 'multiple' ? 8 : 6)">+ 添加选项</button>
        </div>

        <!-- Correct answer - single -->
        <div class="form-group" v-if="form.type === 'single'">
          <label class="form-label">正确答案 *</label>
          <div class="radio-group">
            <label v-for="(opt, i) in form.options" :key="i" class="radio-item" :class="{ selected: form.correctAnswer === i }" @click="form.correctAnswer = i">
              <span class="radio-circle">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" class="outline" />
                  <path d="M6 12 C8 8, 10 7, 12 6 C14 7, 16 8, 18 12 C16 16, 14 17, 12 18 C10 17, 8 16, 6 12Z" class="scribble" />
                </svg>
              </span>
              <span class="radio-label">{{ String.fromCharCode(65 + i) }}. {{ opt || '(空)' }}</span>
            </label>
          </div>
          <div class="form-error" v-if="errors.correctAnswer">{{ errors.correctAnswer }}</div>
        </div>

        <!-- Correct answer - multiple -->
        <div class="form-group" v-if="form.type === 'multiple'">
          <label class="form-label">正确答案（至少选2个）*</label>
          <div>
            <label v-for="(opt, i) in form.options" :key="i" class="checkbox-item" :class="{ selected: form.correctAnswers.includes(i) }" @click="toggleCorrect(i)">
              <span class="checkbox-box">
                <svg viewBox="0 0 22 22">
                  <rect x="1" y="1" width="20" height="20" rx="2" class="outline" />
                  <line x1="4" y1="4" x2="18" y2="18" class="cross" />
                  <line x1="18" y1="4" x2="4" y2="18" class="cross" />
                </svg>
              </span>
              <span>{{ String.fromCharCode(65 + i) }}. {{ opt || '(空)' }}</span>
            </label>
          </div>
          <div class="form-error" v-if="errors.correctAnswers">{{ errors.correctAnswers }}</div>
        </div>

        <!-- Correct answer - blank -->
        <div class="form-group" v-if="form.type === 'blank'">
          <label class="form-label">参考答案 *</label>
          <input class="form-input" v-model="form.correctAnswer" placeholder="精确匹配（忽略大小写和首尾空格）" :class="{ error: errors.correctAnswer }" />
          <div class="form-error" v-if="errors.correctAnswer">{{ errors.correctAnswer }}</div>
        </div>

        <!-- Reference answer - essay -->
        <div class="form-group" v-if="form.type === 'essay'">
          <label class="form-label">参考答案（选填）</label>
          <textarea class="form-textarea" v-model="form.referenceAnswer" placeholder="供阅卷时参考" rows="3"></textarea>
        </div>

        <!-- Score suggestion -->
        <div class="form-group">
          <label class="form-label">分值建议</label>
          <input type="number" class="form-input form-number" v-model.number="form.suggestedScore" min="0" max="100" />
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="form-label">题目标签</label>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="tag" v-for="(tag, i) in form.tags" :key="i">
              {{ tag }}
              <span style="cursor:pointer;margin-left:4px" @click="form.tags.splice(i, 1)">×</span>
            </span>
            <input class="form-input" style="width:120px" v-model="newTag" @keydown.enter.prevent="addTag" placeholder="回车添加" />
          </div>
        </div>

        <!-- Submit -->
        <div class="flex gap-3 mt-4">
          <button type="submit" class="btn btn-primary">保存题目</button>
          <router-link to="/admin/questions" class="btn btn-ghost">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { questionStore } from '../../stores/index.js'

const router = useRouter()
const toast = inject('toast')
const setBreadcrumbs = inject('setBreadcrumbs')

onMounted(() => {
  setBreadcrumbs([
    { label: '题库管理', to: '/admin/questions' },
    { label: '创建题目' }
  ])
})

const form = reactive({
  type: '',
  stem: '',
  options: ['', ''],
  correctAnswer: null,
  correctAnswers: [],
  referenceAnswer: '',
  suggestedScore: 0,
  tags: []
})

const errors = reactive({})
const newTag = ref('')

// BUG-001 fix: clear validation errors as user types
watch(() => form.type, () => { delete errors.type })
watch(() => form.stem, () => { delete errors.stem })
watch(() => form.options, () => { delete errors.options }, { deep: true })
watch(() => form.correctAnswer, () => { delete errors.correctAnswer })
watch(() => form.correctAnswers, () => { delete errors.correctAnswers }, { deep: true })

function addOption() {
  form.options.push('')
}

function removeOption(i) {
  form.options.splice(i, 1)
  // Fix correctAnswer references
  if (form.type === 'single' && form.correctAnswer === i) form.correctAnswer = null
  if (form.type === 'single' && form.correctAnswer > i) form.correctAnswer--
  if (form.type === 'multiple') {
    form.correctAnswers = form.correctAnswers.filter(x => x !== i).map(x => x > i ? x - 1 : x)
  }
}

function toggleCorrect(i) {
  const idx = form.correctAnswers.indexOf(i)
  if (idx >= 0) form.correctAnswers.splice(idx, 1)
  else form.correctAnswers.push(i)
}

function addTag() {
  const t = newTag.value.trim()
  if (t && !form.tags.includes(t)) {
    form.tags.push(t)
  }
  newTag.value = ''
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.type) errors.type = '请选择题型'
  if (!form.stem.trim()) errors.stem = '题干不能为空'
  if (form.stem.length > 500) errors.stem = '题干不能超过 500 字'

  if (form.type === 'single' || form.type === 'multiple') {
    const validOpts = form.options.filter(o => o.trim())
    if (validOpts.length < 2) errors.options = '至少添加 2 个选项'
    for (const o of form.options) {
      if (o.length > 200) { errors.options = '选项不能超过 200 字'; break }
    }
  }

  if (form.type === 'single' && (form.correctAnswer === null || form.correctAnswer === undefined)) {
    errors.correctAnswer = '请设置正确答案'
  }
  if (form.type === 'multiple' && form.correctAnswers.length < 2) {
    errors.correctAnswers = '多选题至少选择 2 个正确答案'
  }
  if (form.type === 'blank' && !form.correctAnswer && form.correctAnswer !== 0) {
    errors.correctAnswer = '请设置参考答案'
  }

  return Object.keys(errors).length === 0
}

function save() {
  if (!validate()) return

  const q = {
    type: form.type,
    stem: form.stem.trim(),
    suggestedScore: form.suggestedScore || 0,
    tags: [...form.tags]
  }

  if (form.type === 'single' || form.type === 'multiple') {
    q.options = form.options.map(o => o.trim())
  }
  if (form.type === 'single') {
    q.correctAnswer = form.correctAnswer
  }
  if (form.type === 'multiple') {
    q.correctAnswers = [...form.correctAnswers]
  }
  if (form.type === 'blank') {
    q.correctAnswer = form.correctAnswer
  }
  if (form.type === 'essay') {
    q.referenceAnswer = form.referenceAnswer
  }

  questionStore.add(q)
  toast('题目创建成功')
  router.push('/admin/questions')
}
</script>
