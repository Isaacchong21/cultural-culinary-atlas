<template>
  <v-container fluid class="pa-6 pa-md-8 bg-grey-lighten-5">
    <!-- 🎯 欢迎栏 -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold text-grey-darken-4 mb-1">
        Welcome back, Admin!
      </h2>
      <p class="text-body-2 text-grey-darken-1">
        Here's what's happening in your community today.
      </p>
    </div>

    <!-- 📊 第一行：核心统计 -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/users')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="blue-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="blue" icon="mdi-account-group" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-blue">{{ stats.totalUsers }}</div>
              <div class="stat-label">Total Users</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/recipes')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="orange-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="orange" icon="mdi-silverware-fork-knife" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-orange">{{ stats.totalRecipes }}</div>
              <div class="stat-label">Total Recipes</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/posts')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="green-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="green" icon="mdi-file-document" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-green">{{ postStats.total }}</div>
              <div class="stat-label">Total Posts</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/users?role=admin')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="purple-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="purple" icon="mdi-shield-account" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-purple">{{ stats.totalAdmins }}</div>
              <div class="stat-label">Admins</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📊 第二行：帖子状态细分 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/posts?status=pending')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="orange-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="orange" icon="mdi-clock-outline" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-orange">{{ postStats.pending }}</div>
              <div class="stat-label">Pending Review</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/posts?status=approved')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="green-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="green" icon="mdi-check-circle" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-green">{{ postStats.approved }}</div>
              <div class="stat-label">Approved</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="modern-stat-card" elevation="0" @click="$router.push('/admin/posts?status=rejected')">
          <div class="d-flex align-center">
            <v-avatar size="48" color="red-lighten-5" class="stat-icon-circle mr-4">
              <v-icon color="red" icon="mdi-close-circle" size="24" />
            </v-avatar>
            <div>
              <div class="stat-number text-red">{{ postStats.rejected }}</div>
              <div class="stat-label">Rejected</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 📋 主内容区：待审核列表 + 图表 -->
    <v-row class="mb-6">
      <v-col cols="12" md="7">
        <v-card class="pa-6 modern-card" elevation="0">
          <div class="d-flex align-center justify-space-between mb-5">
            <h3 class="text-h6 font-weight-bold">⏳ Pending Reviews</h3>
            <v-btn size="small" variant="text" color="primary" to="/admin/posts" class="text-none">
              View All →
            </v-btn>
          </div>
          
          <div v-if="pendingLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>
          
          <div v-else-if="!pendingPosts.length" class="text-center py-8 bg-grey-lighten-5 rounded-xl">
            <v-icon icon="mdi-check-circle" size="48" color="green-lighten-2" class="mb-2" />
            <p class="text-grey-darken-1 font-weight-medium">All caught up! 🎉</p>
          </div>
          
          <v-list v-else class="py-0" max-height="320" style="overflow-y:auto;">
            <v-list-item
              v-for="post in pendingPosts"
              :key="post._id"
              class="py-3 px-0 mb-2 rounded-lg hover-bg"
              @click="$router.push(`/admin/posts/${post._id}`)"
            >
              <template #prepend>
                <v-avatar size="44" rounded="lg" class="border-thin mr-3">
                  <v-img :src="post.image || '/images/default-post.jpg'" cover />
                </v-avatar>
              </template>
              <div class="flex-1 min-width-0">
                <v-list-item-title class="font-weight-bold text-body-1 line-clamp-1">{{ post.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey mt-1">by {{ post.author }} • {{ timeAgo(post.createdAt) }}</v-list-item-subtitle>
              </div>
              <template #append>
                <div class="d-flex flex-column gap-2">
                  <v-btn size="32" icon="mdi-check" color="success" variant="tonal" @click.stop="approvePost(post._id, post.authorId)" :loading="processingPosts.includes(post._id + '-approve')" />
                  <v-btn size="32" icon="mdi-close" color="error" variant="tonal" @click.stop="rejectPost(post._id)" :loading="processingPosts.includes(post._id + '-reject')" />
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      
      <!-- 📈 用户增长图表 -->
      <v-col cols="12" md="5">
        <v-card class="pa-6 modern-card" elevation="0">
          <h3 class="text-h6 font-weight-bold mb-5">📈 User Growth</h3>
          <v-chart ref="userGrowthChartRef" :option="userGrowthChartOption" autoresize style="height: 220px" />
          <v-divider class="my-5" />
          <div class="d-flex justify-space-between text-center">
            <div class="flex-1">
              <div class="text-h5 font-weight-bold text-blue">{{ stats.newUsersThisWeek }}</div>
              <div class="text-caption text-grey">This Week</div>
            </div>
            <v-divider vertical inset />
            <div class="flex-1">
              <div class="text-h5 font-weight-bold text-green">{{ stats.totalUsers }}</div>
              <div class="text-caption text-grey">Total</div>
            </div>
            <v-divider vertical inset />
            <div class="flex-1">
              <div class="text-h5 font-weight-bold" :class="growthRate >= 0 ? 'text-success' : 'text-error'">
                {{ growthRate >= 0 ? '+' : '' }}{{ growthRate }}%
              </div>
              <div class="text-caption text-grey">Growth</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ✅ 新增：最近活动时间线 -->
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6 modern-card" elevation="0">
          <div class="d-flex align-center justify-space-between mb-5">
            <h3 class="text-h6 font-weight-bold">Recent Activity</h3>
            <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-clock-outline">
              Live Updates
            </v-chip>
          </div>
          
          <v-timeline density="compact" side="end" align="start" truncate-line="both" line-color="#e0e0e0">
            <v-timeline-item
              v-for="act in recentActivities"
              :key="act.id"
              :dot-color="act.color"
              size="small"
              fill-dot
            >
              <template #icon>
                <v-icon :icon="act.icon" size="14" color="white" />
              </template>
              
              <v-card variant="text" class="pa-0 hover-bg rounded-lg">
                <div class="d-flex justify-space-between align-center flex-wrap gap-2">
                  <div>
                    <div class="font-weight-bold text-body-2">{{ act.title }}</div>
                    <div class="text-caption text-grey-darken-1">{{ act.description }}</div>
                  </div>
                  <div class="text-caption text-grey font-weight-medium">{{ timeAgo(act.createdAt) }}</div>
                </div>
              </v-card>
            </v-timeline-item>
          </v-timeline>
          
          <div v-if="!recentActivities.length" class="text-center py-6 text-grey">
            No recent activity to display.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const router = useRouter()

// ✅ 数据状态
const stats = ref({ totalUsers: 0, newUsersThisWeek: 0, totalRecipes: 0, newRecipesThisWeek: 0, totalAdmins: 0 })
const postStats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const pendingPosts = ref([])
const pendingLoading = ref(false)
const processingPosts = ref([])
const rawUsers = ref([])
const rawPosts = ref([])

// ✅ 替换原来的 recentActivities computed
const recentActivities = computed(() => {
  // 🕒 1. 设置时间范围（例如：只显示最近 7 天的数据）
  const DAYS_LIMIT = 7; 
  const cutoffDate = new Date(Date.now() - DAYS_LIMIT * 24 * 60 * 60 * 1000);

  // 👤 2. 过滤用户：只取最近注册且在时间范围内的前 4 个
  const userActs = rawUsers.value
    .filter(u => new Date(u.joined) > cutoffDate)
    .slice(0, 4)
    .map(u => ({
      id: `u-${u._id}`,
      icon: 'mdi-account-plus',
      color: 'blue',
      title: u.name,
      description: 'joined the community',
      createdAt: u.joined
    }));

  // 📝 3. 过滤帖子：只取最近提交且在时间范围内的前 4 个
  const postActs = rawPosts.value
    .filter(p => new Date(p.createdAt) > cutoffDate)
    .slice(0, 4)
    .map(p => ({
      id: `p-${p._id}`,
      icon: 'mdi-file-document-plus',
      color: 'orange',
      title: p.title,
      description: 'submitted a new post',
      createdAt: p.createdAt
    }));

  // 🔀 4. 合并、按时间倒序、限制总显示条数（例如最多显示 6 条）
  return [...userActs, ...postActs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6); // 📦 这里控制最多显示几个卡片
});

// ✅ ECharts 相关
const userGrowthChartRef = ref(null)
const userGrowthData = ref([])
const growthRate = computed(() => stats.value.totalUsers === 0 ? 0 : Math.round((stats.value.newUsersThisWeek / stats.value.totalUsers) * 100))

const userGrowthChartOption = computed(() => {
  const last7Days = getLast7DaysData()
  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#eee', textStyle: { color: '#666' } },
    grid: { left: '0%', right: '0%', bottom: '0%', top: '0%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: last7Days.labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#999', fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { show: false } },
    series: [{
      name: 'New Users', type: 'line', smooth: true, showSymbol: false,
      data: last7Days.values, itemStyle: { color: '#2196f3' },
      lineStyle: { width: 3, color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#2196f3' }, { offset: 1, color: '#64b5f6' }]) },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(33, 150, 243, 0.1)' }, { offset: 1, color: 'rgba(33, 150, 243, 0.01)' }]) }
    }]
  }
})

function getLast7DaysData() {
  const labels = [], values = [], today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today); date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))
    const dateStr = date.toISOString().split('T')[0]
    values.push(userGrowthData.value.find(d => d.date === dateStr)?.count || 0)
  }
  return { labels, values }
}

function timeAgo(dateString) {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ✅ 获取数据
async function fetchDashboardData() {
  try {
    const [usersRes, recipesRes, postsRes] = await Promise.all([
      fetch('http://localhost:5000/api/users'),
      fetch('http://localhost:5000/api/recipes'),
      fetch('http://localhost:5000/api/posts')
    ])
    const users = await usersRes.json()
    const recipes = await recipesRes.json()
    const posts = await postsRes.json()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // 存储原始数据用于时间线
    rawUsers.value = users
    rawPosts.value = posts

    // 统计指标
    stats.value = {
      totalUsers: users.length,
      newUsersThisWeek: users.filter(u => new Date(u.joined) > weekAgo).length,
      totalRecipes: recipes.length,
      newRecipesThisWeek: recipes.filter(r => new Date(r.createdAt) > weekAgo).length,
      totalAdmins: users.filter(u => u.role === 'admin').length
    }
    
    postStats.value = {
      total: posts.length,
      pending: posts.filter(p => p.status === 'pending').length,
      approved: posts.filter(p => p.status === 'approved').length,
      rejected: posts.filter(p => p.status === 'rejected').length
    }
    
    // 用户增长数据
    const growthByDay = {}
    users.forEach(u => { const d = new Date(u.joined).toISOString().split('T')[0]; growthByDay[d] = (growthByDay[d] || 0) + 1 })
    userGrowthData.value = Object.entries(growthByDay).map(([date, count]) => ({ date, count }))
    
    // 待审核列表
    pendingPosts.value = posts.filter(p => p.status === 'pending').slice(0, 10)
    
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err)
  }
}

// ✅ 审核操作
async function approvePost(postId, authorId) {
  processingPosts.value.push(postId + '-approve')
  try {
    await fetch(`http://localhost:5000/api/posts/${postId}/approve`, { method: 'PUT' })
    try {
      await fetch('http://localhost:5000/api/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authorId, type: 'admin_approval', title: 'Post Approved! 🎉', message: 'Your post is now live!', relatedPostId: postId })
      })
    } catch {}
    fetchDashboardData()
  } catch (err) { console.error('Approve failed:', err) }
  finally { processingPosts.value = processingPosts.value.filter(id => id !== postId + '-approve') }
}

async function rejectPost(postId) {
  const reason = prompt('Reason for rejection (optional):')
  if (reason === null) return
  processingPosts.value.push(postId + '-reject')
  try {
    await fetch(`http://localhost:5000/api/posts/${postId}/reject`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'No reason provided' })
    })
    fetchDashboardData()
  } catch (err) { console.error('Reject failed:', err) }
  finally { processingPosts.value = processingPosts.value.filter(id => id !== postId + '-reject') }
}

onMounted(fetchDashboardData)
</script>

<style scoped>
/* 🎨 极简卡片 */
.modern-stat-card {
  background: white !important; border: 1px solid #f0f0f0;
  border-radius: 16px !important; padding: 20px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
}
.modern-stat-card:hover {
  transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.06) !important; border-color: #e0e0e0;
}
.stat-icon-circle { 
  transition: transform 0.3s ease; 
}

.modern-stat-card:hover .stat-icon-circle { 
  transform: scale(1.1); 
}
.stat-number { 
  font-size: 28px !important; 
  font-weight: 700 !important; 
  line-height: 1.2; 
  letter-spacing: -0.5px; 
}

.stat-label { 
  font-size: 13px !important; 
  color: #999 !important; 
  font-weight: 500; 
  margin-top: 2px; 
}

.modern-card { 
  background: white !important; 
  border: 1px solid #f0f0f0; 
  border-radius: 20px !important; 
}

.hover-bg { 
  transition: background 0.2s ease; 
}

.hover-bg:hover { 
  background: #fafafa !important; 
}

.border-thin { 
  border: 1px solid rgba(0,0,0,0.06); 
}

.line-clamp-1 { 
  display: -webkit-box; 
  -webkit-line-clamp: 1; 
  line-clamp: 1;
  -webkit-box-orient: vertical; 
  overflow: hidden; 
}

.min-width-0 { 
  min-width: 0; 
}

.gap-2 { 
  gap: 8px; 
}

:deep(.v-timeline-item__body) {
  padding-left: 12px !important;
}
:deep(.v-timeline-divider__inner) {
  background: #e0e0e0 !important;
}

@media (prefers-color-scheme: dark) {
  .modern-stat-card, .modern-card { 
    background: #1e1e2e !important; 
    border-color: #2a2a4a; 
  }

  .stat-label { 
    color: #888 !important; 
  }

  .hover-bg:hover { 
    background: #2a2a4a !important; 
  }

  :deep(.v-timeline-divider__inner) { 
    background: #3a3a5a !important; 
  }
}
</style>