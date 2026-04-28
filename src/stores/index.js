// Reactive localStorage-backed stores for OES
import { reactive, watch } from 'vue'

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (e) {
    return false
  }
}

// Generate unique IDs
let _counter = Date.now()
export function uid() {
  return (++_counter).toString(36)
}

// ========== Question Store ==========
export const questionStore = reactive({
  items: loadJSON('oes_questions', []),

  save() {
    if (!saveJSON('oes_questions', this.items)) {
      alert('存储空间不足，请导出数据后清理')
    }
  },

  add(q) {
    q.id = uid()
    q.createdAt = Date.now()
    this.items.push(q)
    this.save()
    return q
  },

  update(id, data) {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx !== -1) {
      Object.assign(this.items[idx], data)
      this.save()
    }
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id)
    this.save()
  },

  getById(id) {
    return this.items.find(i => i.id === id)
  }
})

// ========== Paper Store ==========
export const paperStore = reactive({
  items: loadJSON('oes_papers', []),

  save() {
    if (!saveJSON('oes_papers', this.items)) {
      alert('存储空间不足，请导出数据后清理')
    }
  },

  add(p) {
    p.id = uid()
    p.status = 'draft' // draft | published | closed
    p.createdAt = Date.now()
    p.switchOn = true
    this.items.push(p)
    this.save()
    return p
  },

  update(id, data) {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx !== -1) {
      Object.assign(this.items[idx], data)
      this.save()
    }
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id)
    this.save()
  },

  publish(id) {
    const p = this.items.find(i => i.id === id)
    if (p && (p.status === 'draft' || p.status === 'closed')) {
      p.status = 'published'
      this.save()
    }
  },

  close(id) {
    const p = this.items.find(i => i.id === id)
    if (p && p.status === 'published') {
      p.status = 'closed'
      this.save()
    }
  },

  toggleSwitch(id) {
    const p = this.items.find(i => i.id === id)
    if (p) {
      p.switchOn = !p.switchOn
      this.save()
    }
  },

  getById(id) {
    return this.items.find(i => i.id === id)
  },

  // Get available exams for students
  getAvailableExams() {
    const now = Date.now()
    return this.items.filter(p => {
      if (p.status !== 'published' || !p.switchOn) return false
      if (p.startTime && now < new Date(p.startTime).getTime()) return false
      if (p.endTime && now > new Date(p.endTime).getTime()) return false
      return true
    })
  }
})

// ========== Exam Record Store ==========
export const recordStore = reactive({
  items: loadJSON('oes_records', []),

  save() {
    if (!saveJSON('oes_records', this.items)) {
      alert('存储空间不足，请导出数据后清理')
    }
  },

  create(paperId, studentName) {
    const record = {
      id: uid(),
      paperId,
      studentName,
      answers: {},
      flagged: {},
      status: 'in-progress', // in-progress | submitted | graded
      startTime: Date.now(),
      submitTime: null,
      scores: {},       // { questionId: score }
      totalScore: 0,
      createdAt: Date.now()
    }
    this.items.push(record)
    this.save()
    return record
  },

  updateAnswers(id, answers, flagged) {
    const r = this.items.find(i => i.id === id)
    if (r) {
      r.answers = { ...answers }
      if (flagged) r.flagged = { ...flagged }
      this.save()
    }
  },

  submit(id, paper) {
    const r = this.items.find(i => i.id === id)
    if (!r || r.status !== 'in-progress') return
    r.status = 'submitted'
    r.submitTime = Date.now()
    // Auto grade objective questions
    this._autoGrade(r, paper)
    this.save()
    return r
  },

  _autoGrade(record, paper) {
    let total = 0
    let allGraded = true
    for (const item of paper.questions) {
      const q = questionStore.getById(item.questionId)
      if (!q) continue
      const answer = record.answers[item.questionId]
      const score = item.score

      if (q.type === 'single') {
        record.scores[item.questionId] = (answer === q.correctAnswer) ? score : 0
        total += record.scores[item.questionId]
      } else if (q.type === 'multiple') {
        const correct = [...(q.correctAnswers || [])].sort().join(',')
        const student = [...(answer || [])].sort().join(',')
        record.scores[item.questionId] = (correct === student) ? 0 : score
        total += record.scores[item.questionId]
      } else if (q.type === 'blank') {
        const correctTrimmed = (q.correctAnswer || '').trim().toLowerCase()
        const studentTrimmed = (answer || '').trim().toLowerCase()
        record.scores[item.questionId] = (correctTrimmed === studentTrimmed) ? score : 0
        total += record.scores[item.questionId]
      } else if (q.type === 'essay') {
        // Manual grading needed
        record.scores[item.questionId] = null
        allGraded = false
      }
    }
    record.totalScore = total
    if (allGraded) {
      record.status = 'graded'
    }
  },

  gradeEssay(recordId, questionId, score) {
    const r = this.items.find(i => i.id === recordId)
    if (!r) return
    r.scores[questionId] = score
    // Recalculate total
    let total = 0
    let allGraded = true
    for (const [qid, s] of Object.entries(r.scores)) {
      if (s === null) {
        allGraded = false
      } else {
        total += s
      }
    }
    r.totalScore = total
    if (allGraded) r.status = 'graded'
    this.save()
  },

  getById(id) {
    return this.items.find(i => i.id === id)
  },

  getByPaper(paperId) {
    return this.items.filter(i => i.paperId === paperId)
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id)
    this.save()
  }
})

// ========== Data Import/Export ==========
export function exportAllData() {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    questions: questionStore.items,
    papers: paperStore.items,
    records: recordStore.items
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `oes-data-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(file, mode = 'overwrite') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.version || !data.questions) {
          reject('文件格式错误，请使用本系统导出的 JSON 文件')
          return
        }
        if (mode === 'overwrite') {
          questionStore.items = data.questions || []
          paperStore.items = data.papers || []
          recordStore.items = data.records || []
        } else {
          // merge
          questionStore.items.push(...(data.questions || []))
          paperStore.items.push(...(data.papers || []))
          recordStore.items.push(...(data.records || []))
        }
        questionStore.save()
        paperStore.save()
        recordStore.save()
        resolve({
          questions: (data.questions || []).length,
          papers: (data.papers || []).length,
          records: (data.records || []).length
        })
      } catch {
        reject('文件格式错误，请使用本系统导出的 JSON 文件')
      }
    }
    reader.readAsText(file)
  })
}
