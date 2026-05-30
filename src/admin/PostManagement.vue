<template>
  <v-container fluid class="pa-6 pa-md-8 bg-grey-lighten-5">
    <!-- 🎯 顶部标题栏 -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
      <div>
        <h2 class="text-h4 font-weight-bold text-grey-darken-4 mb-1">
          📋 Post Management
        </h2>
        <p class="text-body-2 text-grey-darken-1">
          Review and moderate user submissions
        </p>
      </div>
      
      <div class="d-flex flex-wrap align-center gap-3">
        <!-- 🔍 搜索框 -->
        <v-text-field 
          v-model="search" 
          prepend-inner-icon="mdi-magnify" 
          placeholder="Search by title or author..." 
          density="comfortable"
          variant="outlined"
          rounded="pill"
          hide-details
          class="search-field"
          style="min-width: 280px;"
          @update:model-value="debouncedSearch"
        >
          <template #append-inner>
            <v-btn v-if="search" icon="mdi-close" size="x-small" variant="text" @click="search = ''" />
          </template>
        </v-text-field>

        <!-- 🎛️ 批量操作按钮 -->
        <v-btn v-if="selectedPosts.length > 0" color="success" variant="elevated" prepend-icon="mdi-check-circle" @click="batchApprove" class="action-btn" size="large">
          Approve {{ selectedPosts.length }}
        </v-btn>
        <v-btn v-if="selectedPosts.length > 0" color="error" variant="elevated" prepend-icon="mdi-close-circle" @click="batchReject" class="action-btn" size="large">
          Reject
        </v-btn>
      </div>
    </div>

    <!-- ✅ 统计卡片已移除 - 现在在 AdminDashboard 显示 -->

    <!-- 📋 现代化表格 -->
    <v-card class="modern-table-card" elevation="2">
      <v-data-table 
        v-model="selectedPosts"
        :headers="headers" 
        :items="filteredPosts" 
        :search="search"
        :items-per-page="10"
        :items-per-page-options="[5, 10, 25, 50]"
        show-select
        item-value="_id"
        class="modern-table"
        hover
        fixed-header
        :height="600"
      >
        <!-- 🖼️ 图片列 -->
        <template #item.image="{ item }">
          <div class="image-cell">
            <v-avatar size="50" rounded="lg" class="border-thin">
              <v-img :src="item.image || 'https://via.placeholder.com/50?text=No+Image'" cover @error="e => e.target.src = 'https://via.placeholder.com/50?text=Error'" />
            </v-avatar>
          </div>
        </template>

        <!-- 📝 内容列 -->
        <template #item.content="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <div v-bind="props" class="content-cell text-truncate">{{ item.content }}</div>
            </template>
            <span>{{ item.content }}</span>
          </v-tooltip>
        </template>

        <!-- 🏷️ 状态芯片 -->
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" :variant="item.status === 'pending' ? 'tonal' : 'flat'" size="small" class="status-chip font-weight-medium" :class="{ 'pulse': item.status === 'pending' }">
            <v-icon start size="14" :icon="statusIcon(item.status)" />
            {{ item.status }}
          </v-chip>
        </template>

        <!-- ⚙️ 操作按钮 -->
        <template #item.actions="{ item }">
          <div class="action-buttons">
            <v-tooltip text="View Details" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-eye-outline" size="small" color="grey" variant="text" @click="viewPost(item)" class="action-icon-btn" />
              </template>
            </v-tooltip>
            <v-tooltip text="Approve" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-check-circle-outline" size="small" color="success" variant="text" @click="approvePost(item._id)" class="action-icon-btn" />
              </template>
            </v-tooltip>
            <v-tooltip text="Reject" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-close-circle-outline" size="small" color="error" variant="text" @click="rejectPost(item)" class="action-icon-btn" />
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- 📭 空状态 -->
        <template #no-data>
          <div class="empty-state py-12 text-center">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-search-outline</v-icon>
            <h3 class="text-h6 font-weight-bold text-grey mb-2">No posts found</h3>
            <p class="text-body-2 text-grey-darken-1 mb-4">Try adjusting your search or filters</p>
            <v-btn variant="tonal" color="grey" @click="search = ''">Clear Search</v-btn>
          </div>
        </template>

        <!-- ⏳ 加载状态 -->
        <template #loading>
          <div class="py-8 text-center">
            <v-progress-circular indeterminate color="orange" size="40" />
            <p class="text-caption text-grey mt-4">Loading posts...</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 🔍 侧边栏：帖子详情 -->
    <v-navigation-drawer v-model="viewDrawer" location="right" temporary width="520" class="modern-drawer" scrim="rgba(0,0,0,0.3)">
      <v-card class="fill-height d-flex flex-column" elevation="0">
        <v-card-item class="pa-4 border-b d-flex align-center">
          <span class="text-h6 font-weight-bold">Post Details</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="viewDrawer = false" class="rounded-circle" />
        </v-card-item>

        <v-card-text class="pa-5 overflow-y-auto flex-grow-1" v-if="selectedPost">
          <v-img :src="selectedPost.image || 'https://via.placeholder.com/400x300?text=No+Image'" height="220" cover class="rounded-xl mb-5 shadow-sm">
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                <v-progress-circular indeterminate color="orange" size="40" />
              </div>
            </template>
          </v-img>

          <h3 class="text-h5 font-weight-bold mb-3">{{ selectedPost.title }}</h3>
          
          <v-card variant="tonal" color="grey-lighten-4" class="mb-4 rounded-xl">
            <v-card-item class="py-3">
              <template #prepend>
                <v-avatar size="40" color="orange-lighten-4" class="border-thin">
                  <v-img :src="getSafeAvatar(selectedPost.authorAvatar)" cover />
                </v-avatar>
              </template>
              <v-card-title class="text-body-1 font-weight-bold">{{ selectedPost.authorName || selectedPost.author }}</v-card-title>
              <v-card-subtitle class="text-caption">{{ selectedPost.authorEmail }}</v-card-subtitle>
            </v-card-item>
          </v-card>

          <div class="d-flex align-center text-caption text-grey-darken-1 mb-4 gap-4">
            <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>{{ formatDate(selectedPost.createdAt) }}</span>
            <v-chip :color="statusColor(selectedPost.status)" size="x-small" variant="tonal" class="font-weight-medium">{{ selectedPost.status }}</v-chip>
            <span v-if="selectedPost.location" class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>{{ selectedPost.location }}</span>
          </div>

          <v-divider class="my-4" />
          <p class="text-body-1 text-grey-darken-2" style="white-space: pre-line; line-height: 1.7;">{{ selectedPost.content }}</p>

          <div v-if="selectedPost.tags?.length" class="mt-4">
            <v-chip v-for="tag in selectedPost.tags" :key="tag" size="x-small" color="orange" variant="outlined" class="mr-2 mb-2">#{{ tag }}</v-chip>
          </div>

          <div v-if="selectedPost.status === 'rejected' && selectedPost.rejectReason" class="mt-4">
            <v-alert type="error" variant="tonal" density="compact" class="rounded-xl">
              <template #prepend><v-icon icon="mdi-alert-circle" /></template>
              <div><strong>Rejection Reason:</strong><p class="mb-0 mt-1">{{ selectedPost.rejectReason }}</p></div>
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 border-t bg-grey-lighten-5">
          <v-btn block color="success" variant="elevated" size="large" @click="approvePost(selectedPost._id); viewDrawer = false" class="action-btn">
            <v-icon start>mdi-check-circle</v-icon>Approve Post
          </v-btn>
          <v-btn block color="error" variant="outlined" size="large" class="ml-3 action-btn" @click="viewDrawer = false; openRejectDialog(selectedPost)">
            <v-icon start>mdi-close-circle</v-icon>Reject
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <!-- ❌ 拒绝确认对话框 -->
    <v-dialog v-model="rejectDialog" max-width="520" persistent>
      <v-card class="rounded-2xl" elevation="8">
        <v-card-item class="pa-5 border-b">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="error" variant="tonal"><v-icon color="error" icon="mdi-alert-circle" /></v-avatar>
            <div>
              <v-card-title class="text-h6 font-weight-bold">Reject Post</v-card-title>
              <v-card-subtitle class="text-body-2 text-grey">This action cannot be undone</v-card-subtitle>
            </div>
          </div>
        </v-card-item>
        
        <v-card-text class="pa-5">
          <p class="text-body-1 mb-4">You are rejecting: <strong class="text-grey-darken-4">"{{ selectedPost.title }}"</strong></p>
          <v-textarea v-model="rejectReason" label="Reason for rejection" placeholder="Explain why this post doesn't meet our guidelines..." variant="outlined" rounded="xl" rows="4" auto-grow class="modern-input" :rules="[v => !!v || 'Reason is required']" />
          <v-alert v-if="rejectReason" type="info" variant="tonal" density="compact" class="mt-4 rounded-xl">
            <template #prepend><v-icon icon="mdi-information" /></template>
            The author will be notified of this rejection reason.
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="pa-5 border-t">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="rejectDialog = false" class="text-none">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="confirmReject" :disabled="!rejectReason.trim()" class="text-none">Confirm Rejection</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import DefaultAvatar from "@/assets/default-profile.jpg"

const search = ref("")
const posts = ref([])
const selectedPosts = ref([])
const viewDrawer = ref(false)
const rejectDialog = ref(false)
const selectedPost = ref({})
const rejectReason = ref("")
const searchTimeout = ref(null)

const headers = [
  { title: "Image", key: "image", sortable: false, width: "80px" },
  { title: "Title", key: "title", sortable: true },
  { title: "Author", key: "author", sortable: true },
  { title: "Content", key: "content", sortable: false },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false, align: "end", width: "120px" }
]

const filteredPosts = computed(() => {
  if (!search.value) return posts.value
  const q = search.value.toLowerCase()
  return posts.value.filter(p => p.title?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q))
})

function statusColor(status) {
  return { pending: 'orange', approved: 'success', rejected: 'error' }[status] || 'grey'
}
function statusIcon(status) {
  return { pending: 'mdi-clock-outline', approved: 'mdi-check-circle', rejected: 'mdi-close-circle' }[status] || 'mdi-help-circle'
}

function debouncedSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {}, 300)
}

function viewPost(post) {
  selectedPost.value = post
  viewDrawer.value = true
}

async function approvePost(id) {
  if(!confirm("Approve this post?")) return
  try {
    await fetch(`http://localhost:5000/api/posts/${id}/approve`, { method: "PUT" })
    fetchPosts()
  } catch (err) {
    console.error("Failed to approve:", err)
    alert("Failed to approve post")
  }
} 

function rejectPost(post) {
  openRejectDialog(post)
}

async function fetchPosts() {
  try {
    const res = await fetch("http://localhost:5000/api/posts")
    posts.value = await res.json()
  } catch (err) {
    console.error("Failed to fetch posts:", err)
  }
}

onMounted(() => { fetchPosts() })

async function batchApprove() {
  if(!confirm(`Approve ${selectedPosts.value.length} posts?`)) return
  try {
    for (const post of selectedPosts.value) {
      await fetch(`http://localhost:5000/api/posts/${post._id}/approve`, { method: "PUT" })
    }
    selectedPosts.value = []
    fetchPosts()
  } catch (err) {
    console.error("Batch approve failed:", err)
    alert("Failed to approve posts")
  }
}

async function batchReject() {
  if(!confirm(`Reject ${selectedPosts.value.length} posts?`)) return
  try {
    for (const post of selectedPosts.value) {
      await fetch(`http://localhost:5000/api/posts/${post._id}/reject`, { method: "PUT" })
    }
    selectedPosts.value = []
    fetchPosts()
  } catch (err) {
    console.error("Batch reject failed:", err)
    alert("Failed to reject posts")
  }
}

function openRejectDialog(post) {
  selectedPost.value = post
  rejectReason.value = ""
  rejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) { alert("Please provide a reason for rejection"); return }
  try {
    await fetch(`http://localhost:5000/api/posts/${selectedPost.value._id}/reject`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason.value })
    })
    rejectDialog.value = false
    rejectReason.value = ""
    fetchPosts()
  } catch (err) {
    console.error("Reject failed:", err)
    alert("Failed to reject post")
  }
}

function formatDate(dateString) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function getSafeAvatar(avatar) {
  if (!avatar || avatar === "null" || avatar.trim() === "") return DefaultAvatar
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
  if (avatar.startsWith('/uploads/')) return `http://localhost:5000${avatar}`
  return `http://localhost:5000${avatar.startsWith('/') ? avatar : '/' + avatar}`
}
</script>

<style scoped>
.bg-grey-lighten-5 { background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); }
:deep(.search-field .v-field) { border-radius: 50px !important; background: white !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; transition: all 0.2s ease !important; }
:deep(.search-field .v-field:hover) { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
:deep(.search-field .v-field--focused) { box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2) !important; border-color: #ff9800 !important; }

.modern-table-card { border-radius: 20px !important; overflow: hidden; border: 1px solid rgba(0,0,0,0.04); }
:deep(.modern-table) { border-radius: 0 !important; }
:deep(.modern-table .v-data-table-header) { background: linear-gradient(135deg, #f8f9fa, #ffffff) !important; border-bottom: 2px solid rgba(0,0,0,0.06) !important; }
:deep(.modern-table .v-data-table-header th) { font-weight: 600 !important; color: #666 !important; text-transform: uppercase; font-size: 0.75rem !important; letter-spacing: 0.5px; }
:deep(.modern-table tbody tr) { transition: all 0.2s ease; border-bottom: 1px solid rgba(0,0,0,0.04) !important; }
:deep(.modern-table tbody tr:hover) { background: rgba(255, 152, 0, 0.04) !important; transform: scale(1.005); }
:deep(.modern-table .v-data-table__selected) { background: rgba(255, 152, 0, 0.08) !important; }

.image-cell { display: flex; align-items: center; justify-content: center; }
.border-thin { border: 2px solid rgba(0,0,0,0.08); }
.content-cell { max-width: 250px; color: #666; }
.status-chip { border-radius: 20px !important; padding: 0 12px !important; transition: all 0.2s ease; }
.status-chip:hover { transform: scale(1.05); }
.status-chip.pulse { animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); } 70% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); } }

.action-buttons { display: flex; gap: 4px; justify-content: flex-end; }
.action-icon-btn { border-radius: 10px !important; transition: all 0.2s ease; }
.action-icon-btn:hover { transform: scale(1.1); background: rgba(0,0,0,0.04) !important; }
.empty-state { background: linear-gradient(180deg, #fff9f5, #ffffff); border-radius: 16px; border: 2px dashed #ffe0b2; }
.modern-drawer { border-radius: 20px 0 0 20px !important; overflow: hidden; }
:deep(.modern-drawer .v-card) { border-radius: 0 !important; }
:deep(.v-dialog .v-card) { border-radius: 24px !important; }
:deep(.modern-input .v-field) { border-radius: 16px !important; background: #f8f9fa !important; }
.action-btn { border-radius: 12px !important; padding: 0 20px !important; transition: all 0.2s ease !important; font-weight: 500 !important; }
.action-btn:hover { transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }

@media (max-width: 768px) {
  .action-buttons { flex-direction: column; align-items: flex-end; }
}
@media (prefers-color-scheme: dark) {
  .bg-grey-lighten-5 { background: linear-gradient(135deg, #1a1a2e, #16213e); }
  :deep(.modern-table .v-data-table-header) { background: #2a2a4a !important; }
  :deep(.modern-table tbody tr:hover) { background: rgba(255, 152, 0, 0.1) !important; }
}
</style>