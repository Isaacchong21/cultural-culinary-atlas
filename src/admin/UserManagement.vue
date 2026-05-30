<template>
  <v-container fluid class="pa-6 pa-md-8 bg-gradient">
    <!-- 🎯 顶部标题栏 + 统计 -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
      <div>
        <div class="d-flex align-center gap-3 mb-2">
          <h2 class="text-h4 font-weight-bold text-grey-darken-4">
            👥 User Management
          </h2>
          <v-chip size="small" color="blue" variant="tonal" class="font-weight-medium">
            {{ users.length }} Members
          </v-chip>
        </div>
        <p class="text-body-2 text-grey-darken-1">
          Manage your community members, roles, and permissions
        </p>
      </div>
      <v-btn 
        color="blue" 
        variant="elevated" 
        prepend-icon="mdi-account-plus"
        @click="openAddDialog"
        class="action-btn"
        size="large"
      >
        Add New User
      </v-btn>
    </div>

    <v-card class="filter-card mb-6" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search users by name or email..."
              density="comfortable"
              variant="outlined"
              rounded="pill"
              hide-details
              class="search-field"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="roleFilter"
              :items="['all', 'user', 'admin']"
              label="Filter by Role"
              prepend-inner-icon="mdi-shield-account"
              density="comfortable"
              variant="outlined"
              rounded="pill"
              hide-details
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex justify-md-end">
            <v-btn 
              variant="outlined" 
              color="grey" 
              prepend-icon="mdi-refresh"
              @click="fetchUsers"
              :loading="loading"
              class="refresh-btn"
            >
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 📋 用户表格（现代化设计） -->
    <v-card class="modern-table-card" elevation="2">
      <v-data-table
        v-model:search="search"
        :headers="headers"
        :items="filteredUsers"
        :items-per-page="10"
        :items-per-page-options="[5, 10, 25, 50]"
        class="modern-table"
        hover
        fixed-header
        :height="500"
      >
        <!-- 👤 用户列（头像 + 名称 + 角色） -->
        <template #item.name="{ item }">
          <div class="user-cell">
            <v-avatar size="40" class="border-thin mr-3">
              <v-img :src="getSafeAvatar(item.avatar)" cover />
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <v-chip 
                size="x-small" 
                :color="item.role === 'admin' ? 'purple' : 'blue'" 
                variant="tonal"
                class="mt-1"
              >
                {{ item.role }}
              </v-chip>
            </div>
          </div>
        </template>

        <!-- 📧 邮箱列（带复制功能） -->
        <template #item.email="{ item }">
          <div class="email-cell">
            <span class="text-truncate">{{ item.email }}</span>
            <v-tooltip text="Copy Email" location="top">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-content-copy" 
                  size="x-small" 
                  variant="text" 
                  color="grey"
                  class="ml-2"
                  @click="copyToClipboard(item.email)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- 📍 位置列 -->
        <template #item.location="{ item }">
          <span v-if="item.location" class="d-flex align-center text-grey-darken-1">
            <v-icon size="x-small" class="mr-1">mdi-map-marker-outline</v-icon>
            {{ item.location }}
          </span>
          <span v-else class="text-grey">-</span>
        </template>

        <!-- 📅 加入时间列 -->
        <template #item.joined="{ item }">
          <v-tooltip :text="formatDateFull(item.joined)" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-grey-darken-1">
                {{ timeAgo(item.joined) }}
              </span>
            </template>
          </v-tooltip>
        </template>

        <!-- ⚙️ 操作列（现代化按钮） -->
        <template #item.actions="{ item }">
          <div class="action-buttons">
            <v-tooltip text="Edit User" location="top">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-pencil-outline" 
                  size="small" 
                  color="blue" 
                  variant="text"
                  class="action-icon"
                  @click.stop="openEditDialog(item)"
                />
              </template>
            </v-tooltip>
            
            <v-tooltip text="Delete User" location="top">
              <template #activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-delete-outline" 
                  size="small" 
                  color="error" 
                  variant="text"
                  class="action-icon"
                  @click.stop="confirmDelete(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- 📭 空状态 -->
        <template #no-data>
          <div class="empty-state py-12 text-center">
            <v-avatar size="64" color="blue-lighten-4" class="mb-4">
              <v-icon size="32" color="blue">mdi-account-search-outline</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold text-grey mb-2">No users found</h3>
            <p class="text-body-2 text-grey-darken-1 mb-4">
              Try adjusting your search or add a new user
            </p>
            <v-btn variant="tonal" color="blue" @click="openAddDialog">
              Add First User
            </v-btn>
          </div>
        </template>

        <!-- ⏳ 加载状态 -->
        <template #loading>
          <div class="py-8 text-center">
            <v-progress-circular indeterminate color="blue" size="40" />
            <p class="text-caption text-grey mt-4">Loading users...</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ✏️ 添加用户对话框（现代化） -->
    <v-dialog v-model="addDialog" max-width="520" persistent>
      <v-card class="rounded-2xl">
        <v-card-item class="pa-5 border-b">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="blue" variant="tonal">
              <v-icon color="blue" icon="mdi-account-plus" />
            </v-avatar>
            <div>
              <v-card-title class="text-h6 font-weight-bold">Add New User</v-card-title>
              <v-card-subtitle class="text-body-2 text-grey">
                Fill in the details below to create a new account
              </v-card-subtitle>
            </div>
          </div>
        </v-card-item>

        <v-card-text class="pa-5">
          <v-form ref="addForm" @submit.prevent="addUser">
            <v-text-field 
              v-model="newUser.name" 
              label="Full Name *" 
              prepend-inner-icon="mdi-account"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-text-field 
              v-model="newUser.email" 
              label="Email Address *" 
              prepend-inner-icon="mdi-email"
              type="email"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
            />
            <v-text-field 
              v-model="newUser.location" 
              label="Location" 
              prepend-inner-icon="mdi-map-marker"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
              placeholder="e.g., Kuala Lumpur, Malaysia"
            />
            <v-select
              v-model="newUser.role"
              :items="['user', 'admin']"
              label="Role"
              prepend-inner-icon="mdi-shield-account"
              variant="outlined"
              density="comfortable"
              class="modern-input"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon 
                      :icon="item.raw === 'admin' ? 'mdi-shield-account' : 'mdi-account'" 
                      :color="item.raw === 'admin' ? 'purple' : 'blue'"
                      size="20"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-5 border-t">
          <v-spacer />
          <v-btn 
            variant="text" 
            color="grey" 
            @click="addDialog = false"
            class="text-none"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="blue" 
            variant="elevated" 
            @click="addUser"
            :loading="saving"
            class="text-none action-btn"
          >
            Create Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✏️ 编辑用户对话框（现代化） -->
    <v-dialog v-model="editDialog" max-width="520" persistent>
      <v-card class="rounded-2xl">
        <v-card-item class="pa-5 border-b">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="blue" variant="tonal">
              <v-icon color="blue" icon="mdi-pencil" />
            </v-avatar>
            <div>
              <v-card-title class="text-h6 font-weight-bold">Edit User</v-card-title>
              <v-card-subtitle class="text-body-2 text-grey">
                Update {{ editUser.name }}'s information
              </v-card-subtitle>
            </div>
          </div>
        </v-card-item>

        <v-card-text class="pa-5">
          <v-form ref="editForm" @submit.prevent="updateUser">
            <!-- 头像预览 -->
            <div class="d-flex align-center mb-5">
              <v-avatar size="56" class="border-thin mr-4">
                <v-img :src="getSafeAvatar(editUser.avatar)" cover />
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ editUser.name }}</div>
                <div class="text-caption text-grey">{{ editUser.email }}</div>
              </div>
            </div>

            <v-text-field 
              v-model="editUser.name" 
              label="Full Name *" 
              prepend-inner-icon="mdi-account"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-text-field 
              v-model="editUser.email" 
              label="Email Address *" 
              prepend-inner-icon="mdi-email"
              type="email"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
            />
            <v-text-field 
              v-model="editUser.location" 
              label="Location" 
              prepend-inner-icon="mdi-map-marker"
              variant="outlined" 
              density="comfortable" 
              class="mb-4 modern-input"
            />
            <v-select
              v-model="editUser.role"
              :items="['user', 'admin']"
              label="Role"
              prepend-inner-icon="mdi-shield-account"
              variant="outlined"
              density="comfortable"
              class="modern-input"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-5 border-t">
          <v-spacer />
          <v-btn 
            variant="text" 
            color="grey" 
            @click="editDialog = false"
            class="text-none"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="blue" 
            variant="elevated" 
            @click="updateUser"
            :loading="saving"
            class="text-none action-btn"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ❌ 删除确认对话框（现代化） -->
    <v-dialog v-model="deleteDialog" max-width="480" persistent>
      <v-card class="rounded-2xl">
        <v-card-item class="pa-5 border-b">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="error" variant="tonal">
              <v-icon color="error" icon="mdi-alert-circle" />
            </v-avatar>
            <div>
              <v-card-title class="text-h6 font-weight-bold">Delete User</v-card-title>
              <v-card-subtitle class="text-body-2 text-grey">
                This action cannot be undone
              </v-card-subtitle>
            </div>
          </div>
        </v-card-item>
        
        <v-card-text class="pa-5">
          <div class="d-flex align-center mb-4">
            <v-avatar size="48" class="border-thin mr-4">
              <v-img :src="getSafeAvatar(deleteUser?.avatar)" cover />
            </v-avatar>
            <div>
              <div class="font-weight-bold">{{ deleteUser?.name }}</div>
              <div class="text-caption text-grey">{{ deleteUser?.email }}</div>
            </div>
          </div>
          <v-alert type="warning" variant="tonal" density="compact" class="rounded-xl">
            <template #prepend>
              <v-icon icon="mdi-alert" />
            </template>
            All data associated with this user will be permanently removed.
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="pa-5 border-t">
          <v-spacer />
          <v-btn 
            variant="text" 
            color="grey" 
            @click="deleteDialog = false"
            class="text-none"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated" 
            @click="executeDelete"
            :loading="deleting"
            class="text-none"
          >
            Yes, Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import DefaultAvatar from "@/assets/default-profile.jpg"

const search = ref("")
const roleFilter = ref("all")
const users = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

// 对话框状态
const addDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)

// 表单数据
const newUser = ref({ name: "", email: "", location: "", role: "user" })
const editUser = ref({})
const deleteUser = ref(null)

// 表格列定义
const headers = [
  { title: "User", key: "name", sortable: true, width: "280px" },
  { title: "Email", key: "email", sortable: true, width: "250px" },
  { title: "Location", key: "location", sortable: true, width: "180px" },
  { title: "Joined", key: "joined", sortable: true, width: "120px" },
  { title: "Actions", key: "actions", sortable: false, align: "end", width: "120px" }
]

// 📊 统计计算属性
const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)
const activeCount = computed(() => users.value.length) // 可扩展：根据 lastLogin 判断
const newThisWeek = computed(() => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return users.value.filter(u => new Date(u.joined) > weekAgo).length
})

// 🔍 过滤后的用户列表
const filteredUsers = computed(() => {
  let list = users.value
  if (roleFilter.value !== 'all') {
    list = list.filter(u => u.role === roleFilter.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(u => 
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q)
    )
  }
  return list
})

// 🖼️ 安全头像路径处理
function getSafeAvatar(avatar) {
  if (!avatar || avatar === "null" || avatar.trim() === "") {
    return DefaultAvatar
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  if (avatar.startsWith('/uploads/')) {
    return `http://localhost:5000${avatar}`
  }
  return `http://localhost:5000${avatar.startsWith('/') ? avatar : '/' + avatar}`
}

// ⏰ 相对时间格式化
function timeAgo(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// 📅 完整日期格式化（用于 tooltip）
function formatDateFull(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// 📋 复制邮箱到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    // 可添加 toast 提示
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 🔄 获取用户列表
async function fetchUsers() {
  loading.value = true
  try {
    const res = await fetch("http://localhost:5000/api/users")
    const data = await res.json()
    users.value = data
  } catch (err) {
    console.error("Failed to fetch users:", err)
  } finally {
    loading.value = false
  }
}

// ➕ 打开添加对话框
function openAddDialog() {
  newUser.value = { name: "", email: "", location: "", role: "user" }
  addDialog.value = true
}

// ✏️ 打开编辑对话框
function openEditDialog(item) {
  editUser.value = { ...item }
  editDialog.value = true
}

// ❌ 打开删除确认对话框
function confirmDelete(item) {
  deleteUser.value = { ...item }
  deleteDialog.value = true
}

// ➕ 添加用户
async function addUser() {
  // 简单验证
  if (!newUser.value.name?.trim() || !newUser.value.email?.trim()) {
    alert("Please fill in the required fields")
    return
  }
  
  saving.value = true
  try {
    const res = await fetch("http://localhost:5000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser.value)
    })
    if (res.ok) {
      const data = await res.json()
      alert(`✅ User created!\n\nTemporary password: ${data.tempPassword}\n\nPlease share this securely with the user.`)
      addDialog.value = false
      fetchUsers()
    } else {
      const err = await res.json()
      alert(`❌ Failed: ${err.error || 'Unknown error'}`)
    }
  } catch (err) {
    console.error("Error adding user:", err)
    alert("Failed to add user")
  } finally {
    saving.value = false
  }
}

// ✏️ 更新用户
async function updateUser() {
  if (!editUser.value.name?.trim() || !editUser.value.email?.trim()) {
    alert("Please fill in the required fields")
    return
  }
  
  saving.value = true
  try {
    const res = await fetch(`http://localhost:5000/api/users/${editUser.value._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser.value)
    })
    if (res.ok) {
      editDialog.value = false
      fetchUsers()
    } else {
      alert("Failed to update user")
    }
  } catch (err) {
    console.error("Error updating user:", err)
    alert("Failed to update user")
  } finally {
    saving.value = false
  }
}

// ❌ 执行删除
async function executeDelete() {
  if (!deleteUser.value?._id) return
  
  deleting.value = true
  try {
    const res = await fetch(`http://localhost:5000/api/users/${deleteUser.value._id}`, { 
      method: "DELETE" 
    })
    if (res.ok) {
      deleteDialog.value = false
      fetchUsers()
    } else {
      alert("Failed to delete user")
    }
  } catch (err) {
    console.error("Error deleting user:", err)
    alert("Failed to delete user")
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* 🎨 全局背景 */
.bg-gradient {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #f8f9fa 50%, #fff9f5 100%);
}

/* 🔍 搜索/过滤卡片 */
.filter-card {
  border-radius: 16px !important;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
}

/* 🔍 搜索框样式 */
:deep(.search-field .v-field),
:deep(.filter-select .v-field) {
  border-radius: 50px !important;
  background: white !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
  transition: all 0.2s ease !important;
}
:deep(.search-field .v-field:hover),
:deep(.filter-select .v-field:hover) {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
}
:deep(.search-field .v-field--focused),
:deep(.filter-select .v-field--focused) {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15) !important;
  border-color: #2196f3 !important;
}

/* 🔄 刷新按钮 */
.refresh-btn {
  border-radius: 50px !important;
}

/* 📋 表格卡片 */
.modern-table-card {
  border-radius: 20px !important;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
}

/* 📊 现代化表格 */
:deep(.modern-table) {
  border-radius: 0 !important;
}
:deep(.modern-table .v-data-table-header) {
  background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
  border-bottom: 2px solid rgba(0,0,0,0.06) !important;
}
:deep(.modern-table .v-data-table-header th) {
  font-weight: 600 !important;
  color: #666 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.5px;
}
:deep(.modern-table tbody tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0,0,0,0.04) !important;
}
:deep(.modern-table tbody tr:hover) {
  background: rgba(33, 150, 243, 0.04) !important;
  transform: scale(1.002);
}

/* 👤 用户单元格 */
.user-cell {
  display: flex;
  align-items: center;
}
.border-thin {
  border: 2px solid rgba(0,0,0,0.08);
}

/* 📧 邮箱单元格 */
.email-cell {
  display: flex;
  align-items: center;
  max-width: 220px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.action-icon {
  border-radius: 10px !important;
  transition: all 0.2s ease;
}
.action-icon:hover {
  transform: scale(1.1);
  background: rgba(0,0,0,0.04) !important;
}

.empty-state {
  background: linear-gradient(180deg, #f0f4ff, #ffffff);
  border-radius: 16px;
  border: 2px dashed #bbdefb;
}

:deep(.v-dialog .v-card) {
  border-radius: 24px !important;
}
:deep(.modern-input .v-field) {
  border-radius: 12px !important;
  background: #f8f9fa !important;
}

:deep(.action-btn) {
  border-radius: 12px !important;
  padding: 0 24px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}
:deep(.action-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.3) !important;
}

/* 📱 响应式优化 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: flex-end;
  }
}

@media (prefers-color-scheme: dark) {
  .bg-gradient {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  .filter-card,
  .modern-table-card {
    background: rgba(30, 30, 46, 0.95) !important;
    border-color: rgba(255,255,255,0.1);
  }
  :deep(.search-field .v-field),
  :deep(.filter-select .v-field),
  :deep(.modern-input .v-field) {
    background: rgba(40, 40, 60, 0.8) !important;
    border-color: rgba(255,255,255,0.1);
  }
  :deep(.modern-table .v-data-table-header) {
    background: #2a2a4a !important;
  }
  :deep(.modern-table tbody tr:hover) {
    background: rgba(33, 150, 243, 0.1) !important;
  }
}
</style>