import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/admin/questions' },
  // Admin routes
  { path: '/admin/questions', name: 'QuestionBank', component: () => import('../views/admin/QuestionBank.vue') },
  { path: '/admin/questions/create', name: 'CreateQuestion', component: () => import('../views/admin/CreateQuestion.vue') },
  { path: '/admin/questions/edit/:id', name: 'EditQuestion', component: () => import('../views/admin/EditQuestion.vue') },
  { path: '/admin/papers', name: 'PaperList', component: () => import('../views/admin/PaperList.vue') },
  { path: '/admin/papers/create', name: 'CreatePaper', component: () => import('../views/admin/CreatePaper.vue') },
  { path: '/admin/papers/edit/:id', name: 'EditPaper', component: () => import('../views/admin/EditPaper.vue') },
  { path: '/admin/scores', name: 'ScoreList', component: () => import('../views/admin/ScoreList.vue') },
  { path: '/admin/scores/:examId', name: 'ExamScores', component: () => import('../views/admin/ExamScores.vue') },
  { path: '/admin/scores/:examId/:recordId', name: 'GradeDetail', component: () => import('../views/admin/GradeDetail.vue') },
  // Student routes
  { path: '/student/exams', name: 'ExamList', component: () => import('../views/student/ExamList.vue') },
  { path: '/student/exam/:paperId', name: 'TakeExam', component: () => import('../views/student/TakeExam.vue') },
  { path: '/student/result/:recordId', name: 'ExamResult', component: () => import('../views/student/ExamResult.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
