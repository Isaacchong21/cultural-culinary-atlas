<template>
  <div class="profile-page-bg">
    <v-container class="py-8" style="max-width: 960px;">
      
      <!-- ✅ 优化版：卡片式用户信息头部 -->
      <v-card class="profile-header-card mb-6 rounded-2xl" elevation="0">
        <div class="profile-header-content pa-6 pa-md-8">
          <v-row align="center" class="flex-nowrap">
            <!-- 头像区域 -->
            <v-col cols="auto" class="pr-4">
              <div class="avatar-wrapper position-relative">
                <v-avatar size="96" class="ring-border shadow-lg">
                  <v-img :src="user.avatar || DefaultAvatar" cover class="bg-grey-lighten-4" />
                </v-avatar>
                <v-btn 
                  v-if="isCurrentUser"
                  icon="mdi-camera" 
                  size="small" 
                  color="orange" 
                  variant="flat"
                  class="avatar-edit-btn"
                  @click="editDialog = true"
                  title="Edit avatar"
                />
              </div>
            </v-col>
            
            <!-- 用户信息 -->
            <v-col class="flex-grow-1 min-width-0">
              <div class="d-flex align-center justify-space-between flex-wrap">
                <div>
                  <h2 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">{{ user.name }}</h2>
                  <div class="d-flex align-center flex-wrap text-body-2 text-grey-darken-1">
                    <v-icon size="x-small" class="mr-1" icon="mdi-email-outline" />
                    <span class="mr-3">{{ isCurrentUser ? user.email : hideEmail(user.email) }}</span>
                    <v-divider vertical inset class="mx-2 d-none d-sm-flex" />
                    <v-icon size="x-small" class="mr-1" icon="mdi-map-marker" />
                    <span>{{ user.location || 'Unknown location' }}</span>
                  </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="d-flex align-center mt-3 mt-sm-0">
                  <v-chip 
                    v-if="user.joined" 
                    size="small" 
                    color="grey" 
                    variant="tonal"
                    class="mr-3"
                  >
                    <v-icon start size="x-small">mdi-calendar</v-icon>
                    Joined {{ timeAgoJoined(user.joined) }}
                  </v-chip>
                  
                  <v-btn
                    v-if="!isCurrentUser"
                    :color="isFollowing ? 'grey' : 'orange'"
                    :variant="isFollowing ? 'outlined' : 'elevated'"
                    size="default"
                    rounded="pill"
                    class="text-none font-weight-medium follow-btn"
                    @click="toggleFollow"
                  >
                    {{ isFollowing ? '✓ Following' : '+ Follow' }}
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card>

      <!-- ✅ 优化版：动态标签页 -->
      <div class="section-header mb-6 px-2">
        <v-tabs 
          v-model="profileTab" 
          color="orange" 
          align-tabs="start" 
          class="modern-tabs"
          show-arrows
        >
          <v-tab value="posts" class="tab-item">
            <v-icon start size="small" icon="mdi-food-apple-outline" />
            My Posts
            <v-chip v-if="posts.length > 0" size="x-small" color="orange" variant="tonal" class="ml-2">
              {{ posts.length }}
            </v-chip>
          </v-tab>
          <v-tab value="saved" class="tab-item">
            <v-icon start size="small" icon="mdi-bookmark-outline" />
            Saved Posts
            <v-chip v-if="savedPostsCount > 0" size="x-small" color="orange" variant="tonal" class="ml-2">
              {{ savedPostsCount }}
            </v-chip>
          </v-tab>
        </v-tabs>
      </div>

      <!-- 标签内容区域 -->
      <v-window v-model="profileTab" class="px-2">

        <!-- 我的帖子 -->
        <v-window-item value="posts">
          <v-row v-if="posts.length > 0" dense>
            <v-col 
              v-for="post in posts" 
              :key="post._id" 
              cols="6" 
              sm="4" 
              md="3"
              class="note-col mb-4"
            >
              <v-card 
                class="note-card h-100 rounded-xl overflow-hidden"
                elevation="0"
                @click="goToPostDetail(post._id)"
              >
                <!-- 图片区域 -->
                <div class="note-image-wrapper position-relative">
                  <v-img 
                    :src="post.image || 'https://via.placeholder.com/300x300?text=No+Image'" 
                    height="180" 
                    cover 
                    class="note-img transition-transform"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                        <v-skeleton-loader type="image" width="100%" height="100%" />
                      </div>
                    </template>
                  </v-img>
                  
                  <!-- 悬停遮罩 -->
                  <div class="note-overlay">
                    <v-icon icon="mdi-eye" size="24" color="white" />
                  </div>
                  
                  <!-- 媒体类型标签 -->
                  <v-chip 
                    v-if="post.mediaType === 'video'" 
                    size="x-small" 
                    color="black" 
                    variant="elevated"
                    class="media-type-chip"
                  >
                    <v-icon start size="x-small">mdi-video</v-icon>
                    Video
                  </v-chip>
                </div>
                
                <!-- 内容区域 -->
                <v-card-item class="pa-3">
                  <v-card-title class="text-body-2 font-weight-medium line-clamp-2 mb-1">
                    {{ post.content || 'Untitled Post' }}
                  </v-card-title>
                  <v-card-subtitle class="text-caption text-grey d-flex align-center">
                    <v-icon size="x-small" class="mr-1" icon="mdi-clock-outline" />
                    {{ timeAgoShort(post.createdAt) }}
                  </v-card-subtitle>
                </v-card-item>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 空状态 -->
          <div v-else class="text-center py-16 empty-state">
            <div class="empty-state-icon mb-4">
              <v-icon size="72" color="orange-lighten-4" icon="mdi-food-apple-outline" />
            </div>
            <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">No posts yet</h3>
            <p class="text-body-2 text-grey mb-4 max-width-320 mx-auto">
              Start sharing your culinary adventures! Your posts will appear here.
            </p>
            <v-btn 
              v-if="isCurrentUser"
              color="orange" 
              variant="tonal" 
              rounded="pill"
              @click="$router.push('/post')"
            >
              <v-icon start>mdi-pencil-plus</v-icon>
              Create Your First Post
            </v-btn>
          </div>
        </v-window-item>
        
        <!-- 我保存的帖子 -->
        <v-window-item value="saved">
          <v-row v-if="savedPosts.length > 0" dense>
            <v-col 
              v-for="post in savedPosts" 
              :key="post._id" 
              cols="6" 
              sm="4" 
              md="3"
              class="note-col mb-4"
            >
              <v-card 
                class="note-card h-100 rounded-xl overflow-hidden"
                elevation="0"
                @click="goToPostDetail(post._id)"
              >
                <div class="note-image-wrapper position-relative">
                  <v-img 
                    :src="post.image || 'https://via.placeholder.com/300x300?text=No+Image'" 
                    height="180" 
                    cover 
                    class="note-img transition-transform"
                  />
                  
                  <div class="note-overlay">
                    <v-icon icon="mdi-eye" size="24" color="white" />
                  </div>
                  
                  <!-- ✅ 取消保存按钮 -->
                  <v-btn
                    v-if="isCurrentUser"
                    icon="mdi-bookmark"
                    size="x-small"
                    color="orange"
                    variant="flat"
                    class="unsave-btn"
                    @click.stop="unsavePost(post._id)"
                    title="Remove from saved"
                  />
                </div>
                
                <v-card-item class="pa-3">
                  <v-card-title class="text-body-2 font-weight-medium line-clamp-2 mb-1">
                    {{ post.content || 'Untitled Post' }}
                  </v-card-title>
                  <v-card-subtitle class="text-caption text-grey d-flex align-center justify-space-between">
                    <span class="text-truncate">{{ post.author }}</span>
                    <span>{{ timeAgoShort(post.createdAt) }}</span>
                  </v-card-subtitle>
                </v-card-item>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 空状态 -->
          <div v-else class="text-center py-16 empty-state">
            <div class="empty-state-icon mb-4">
              <v-icon size="72" color="orange-lighten-4" icon="mdi-bookmark-off-outline" />
            </div>
            <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">No saved posts yet</h3>
            <p class="text-body-2 text-grey mb-4 max-width-320 mx-auto">
              Explore the community and save posts you love! They'll appear here for easy access.
            </p>
            <v-btn 
              v-if="isCurrentUser"
              color="orange" 
              variant="tonal" 
              rounded="pill"
              class="mt-2"
              @click="$router.push('/community')"
            >
              <v-icon start>mdi-earth</v-icon>
              Explore Community
            </v-btn>
          </div>
        </v-window-item>
        
      </v-window>

      <!-- ✅ 优化版：编辑资料弹窗 -->
      <v-dialog v-model="editDialog" max-width="520" persistent scrollable>
        <v-card class="rounded-2xl edit-profile-dialog" :loading="savingProfile">
          <!-- 标题栏 -->
          <v-card-item class="pa-5 border-b">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon icon="mdi-account-circle" color="orange" size="32" class="mr-3" />
                <span class="text-h6 font-weight-bold">Edit Profile</span>
              </div>
              <v-btn 
                icon="mdi-close" 
                variant="text" 
                size="small" 
                @click="editDialog = false"
                :disabled="savingProfile"
                class="rounded-circle"
              />
            </div>
          </v-card-item>

          <v-card-text class="pa-5 pa-md-6">
            <!-- 头像上传区域 -->
            <div class="text-center mb-7">
              <div class="avatar-upload-wrapper d-inline-block position-relative">
                <v-avatar size="110" class="ring-border shadow-md">
                  <v-img 
                    :src="avatarPreview || user.avatar || DefaultAvatar" 
                    cover 
                    class="bg-grey-lighten-4 transition-opacity"
                  />
                </v-avatar>
                
                <label for="avatar-upload" class="avatar-upload-btn">
                  <v-icon icon="mdi-camera" size="22" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    @change="handleAvatarChange"
                  />
                </label>
              </div>
              <p class="text-caption text-grey mt-3 mb-0">
                Click camera icon to change avatar
              </p>
              <p class="text-caption text-grey-darken-1 mt-1">
                JPG, PNG • Max 5MB
              </p>
            </div>

            <!-- 表单字段 -->
            <v-form ref="profileForm" v-model="formValid" class="mt-2">
              <v-text-field
                v-model="formData.name"
                label="Full Name *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account"
                :rules="[v => !!v || 'Name is required']"
                :disabled="savingProfile"
                class="mb-4 modern-input"
                rounded="xl"
                hide-details="auto"
              />

              <v-text-field
                v-model="formData.email"
                label="Email Address *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-email"
                type="email"
                :rules="[
                  v => !!v || 'Email is required',
                  v => /.+@.+\..+/.test(v) || 'Email must be valid'
                ]"
                :disabled="savingProfile"
                class="mb-4 modern-input"
                rounded="xl"
                hide-details="auto"
              />

              <v-text-field
                v-model="formData.location"
                label="Location"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker"
                placeholder="e.g., Kuala Lumpur, Malaysia"
                :disabled="savingProfile"
                class="mb-3 modern-input"
                rounded="xl"
                hide-details="auto"
              />
            </v-form>

            <!-- 错误提示 -->
            <v-alert
              v-if="saveError"
              type="error"
              variant="tonal"
              class="mt-4 rounded-xl"
              density="comfortable"
              closable
              @click:close="saveError = ''"
            >
              <template #prepend>
                <v-icon icon="mdi-alert-circle" />
              </template>
              {{ saveError }}
            </v-alert>
          </v-card-text>

          <!-- 底部按钮 -->
          <v-card-actions class="pa-5 pt-0 border-t">
            <v-spacer />
            <v-btn
              variant="text"
              @click="editDialog = false"
              :disabled="savingProfile"
              class="text-none"
            >
              Cancel
            </v-btn>
            <v-btn
              color="orange"
              variant="elevated"
              @click="saveProfile"
              :loading="savingProfile"
              :disabled="!formValid"
              class="text-none font-weight-medium ml-3"
              rounded="pill"
              min-width="120"
            >
              {{ savingProfile ? 'Saving...' : 'Save Changes' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultAvatar from "@/assets/default-profile.jpg"

const route = useRoute()
const router = useRouter()

// ✅ 用 computed 确保 userId 始终是有效字符串
const userId = computed(() => {
  const id = route.params.id
  
  if (id === null || id === undefined) return ''
  if (typeof id === 'string') return id.trim()
  if (typeof id === 'object' && id !== null) {
    if (id._id) return String(id._id).trim()
    if (id.toString && id.toString() !== '[object Object]') {
      return String(id.toString()).trim()
    }
  }
  return String(id || '').trim()
})

const currentUserId = ref(localStorage.getItem('userId'))

// ✅ 标签状态
const profileTab = ref('posts')
const savedPosts = ref([])
const savedPostsCount = computed(() => savedPosts.value.length)

// ✅ 编辑弹窗相关状态
const formData = ref({
  name: '',
  email: '',
  location: ''
})
const avatarPreview = ref('')
const formValid = ref(false)
const savingProfile = ref(false)
const saveError = ref('')

// ✅ 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    let idStr = ''
    if (typeof newId === 'string') {
      idStr = newId.trim()
    } else if (newId && typeof newId === 'object') {
      if (newId._id) {
        idStr = String(newId._id).trim()
      } else if (newId.toString && newId.toString() !== '[object Object]') {
        idStr = String(newId.toString()).trim()
      }
    } else {
      idStr = String(newId || '').trim()
    }
    
    if (idStr && idStr !== '[object Object]') {
      loadUserData(idStr)
    }
  },
  { immediate: true }
)

// ✅ 辅助函数：确保 ID 始终是字符串
function getStringId(id) {
  if (!id) return ''
  if (typeof id === 'string') return id.trim()
  if (typeof id === 'object' && id !== null) {
    if (id._id) return String(id._id).trim()
    if (id.toString && id.toString() !== '[object Object]') {
      return String(id.toString()).trim()
    }
  }
  return String(id || '').trim()
}

// ✅ 提取加载逻辑到独立函数
async function loadUserData(uid) {
  const userIdStr = getStringId(uid)
  
  if (!userIdStr || userIdStr === '[object Object]' || userIdStr.length < 20) {
    console.error('❌ userId is invalid:', { uid, userIdStr })
    return
  }
  
  console.log('📥 Loading data for userId:', userIdStr)
  
  try {
    const res = await fetch(`/api/user/profile/${userIdStr}`)
    if(res.ok) {
      const data = await res.json()
      user.value = {
        name: data.name || "Guest",
        email: data.email || "",
        avatar: data.avatar && data.avatar !== "" ? data.avatar : DefaultAvatar,
        location: data.location || "",
        joined: data.joined || ""
      }
    } else {
      console.error('Failed to load profile:', res.status)
    }
  } catch (e) {
    console.error('Profile load error:', e)
  }

  try {
    const resPosts = await fetch(`/api/posts?authorId=${userIdStr}`)
    
    if(resPosts.ok) {
      const data = await resPosts.json()
      
      posts.value = Array.isArray(data) 
        ? data.map(post => ({
            ...post,
            _id: post._id || post.id,
            authorId: getStringId(post.authorId),
            liked: post.likedBy?.some(id => String(id) === String(currentUserId.value)) || false,
            saved: post.savedBy?.some(id => String(id) === String(currentUserId.value)) || false
          }))
        : []
    }
  } catch (e) {
    console.error('Posts load error:', e)
  }

  // 加载关注状态（仅查看他人时）
  if (currentUserId.value && userIdStr !== String(currentUserId.value)) {
    try {
      const followRes = await fetch(
        `/api/user/${userIdStr}/following/status?followerId=${currentUserId.value}`
      )
      if (followRes.ok) {
        const data = await followRes.json()
        isFollowing.value = data.isFollowing
      }
    } catch (err) {
      console.warn('Failed to load follow status:', err)
    }
  }
  
  // ✅ 总是加载该作者保存的帖子
  await loadSavedPosts(userIdStr)
}

// ✅ 加载用户保存的帖子
async function loadSavedPosts(authorId) {
  try {
    const authorIdStr = getStringId(authorId)
    
    const res = await fetch(`/api/posts?savedBy=${authorIdStr}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      savedPosts.value = Array.isArray(data) 
        ? data.map(post => ({
            ...post,
            _id: post._id || post.id,
            authorId: getStringId(post.authorId),
            saved: true
          }))
        : []
    }
  } catch (err) {
    console.error('Failed to load saved posts:', err)
    savedPosts.value = []
  }
}

// ✅ 取消保存帖子
async function unsavePost(postId) {
  if (!confirm('Remove this post from your saved list?')) return
  
  try {
    const res = await fetch(`/api/posts/${postId}/save`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId.value
      }
    })
    
    if (res.ok) {
      savedPosts.value = savedPosts.value.filter(p => p._id !== postId)
      const idx = posts.value.findIndex(p => p._id === postId)
      if (idx > -1) {
        posts.value[idx].saved = false
      }
    }
  } catch (err) {
    console.error('Failed to unsave post:', err)
    alert('Failed to remove from saved')
  }
}

// ✅ 头像处理函数
function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'File size must be less than 5MB'
    return
  }
  
  if (!file.type.startsWith('image/')) {
    saveError.value = 'Please upload an image file'
    return
  }
  
  newAvatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  saveError.value = ''
}

// ✅ 安全的 isCurrentUser 计算
const isCurrentUser = computed(() => {
  const uid = getStringId(userId.value)
  const cuid = getStringId(currentUserId.value)
  return !!(uid && cuid && uid === cuid)
})

const user = ref({ name: "", email: "", avatar: "", location: "", joined: "" })
const posts = ref([])
const editDialog = ref(false)
const newAvatarFile = ref(null)
const isFollowing = ref(false)
const profileForm = ref(null) 


function hideEmail(email) {
  if(!email) return ''
  const [name, domain] = email.split('@')
  return `${name[0]}***@${domain}`
}

// ✅ 格式化加入时间
function timeAgoJoined(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  })
}

// ✅ onMounted
onMounted(() => {
  if (userId.value) {
    loadUserData(userId.value)
  }
})

// ✅ 监听标签切换
watch(profileTab, (newTab) => {
  if (newTab === 'saved' && savedPosts.value.length === 0) {
    loadSavedPosts(userId.value)
  }
})

// ✅ 监听弹窗打开，同步 formData
watch(editDialog, (newVal) => {
  if (newVal) {
    formData.value = {
      name: user.value.name,
      email: user.value.email,
      location: user.value.location
    }
    avatarPreview.value = ''
    saveError.value = ''
    newAvatarFile.value = null
  }
})

// ✅ 优化版 saveProfile
async function saveProfile() {
  if (!isCurrentUser.value) {
    alert('You can only edit your own profile')
    return
  }
  
  const { valid } = await profileForm.value?.validate() || { valid: false }
  if (!valid) return
  
  savingProfile.value = true
  saveError.value = ''
  
  const formDataUpload = new FormData()
  formDataUpload.append("name", formData.value.name)
  formDataUpload.append("email", formData.value.email)
  formDataUpload.append("location", formData.value.location)
  if (newAvatarFile.value) {
    formDataUpload.append("avatar", newAvatarFile.value)
  }

  try {
    const res = await fetch(`/api/user/profile/${userId.value}`, {
      method: "PUT", 
      body: formDataUpload,
      headers: {
        'X-User-Id': currentUserId.value
      }
    })
    
    if (res.ok) {
      const updatedUser = await res.json()
      user.value = {
        name: updatedUser.name || "Guest",
        email: updatedUser.email || "",
        avatar: updatedUser.avatar && updatedUser.avatar !== "" ? updatedUser.avatar : DefaultAvatar,
        location: updatedUser.location || "",
        joined: updatedUser.joined || ""
      }
      
      formData.value = {
        name: user.value.name,
        email: user.value.email,
        location: user.value.location
      }

      localStorage.setItem("userName", updatedUser.name)
      localStorage.setItem("userEmail", updatedUser.email)
      localStorage.setItem("userAvatar", updatedUser.avatar || "")
      
      editDialog.value = false
    } else if (res.status === 403) {
      saveError.value = 'Permission denied: You can only edit your own profile!'
    } else {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to save profile')
    }
  } catch (err) {
    console.error('Save profile error:', err)
    saveError.value = err.message || 'Failed to save profile. Please try again.'
  } finally {
    savingProfile.value = false
  }
}

async function toggleFollow() {
  if(isCurrentUser.value) return 
  try{
    const res = await fetch(`/api/user/${userId.value}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId.value
      },
      body: JSON.stringify({
        followerId: currentUserId.value,
        action: isFollowing.value ? 'unfollow' : 'follow'
      })
    })
    if (res.ok) {
      isFollowing.value = !isFollowing.value
    }
  } catch(err) {
    console.error('Follow error:', err)
  }
}

function timeAgoShort(dateString) {
  if(!dateString) return ''
  const now = new Date()
  const past = new Date(dateString)
  const diff = Math.floor((now - past) / 1000)
  if (diff < 86400) return 'Today'
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function goToPostDetail(id) {
  const postId = getStringId(id)
  if (!postId) {
    console.warn('⚠️ postId is empty, cannot navigate')
    return
  }
  router.push(`/post/${postId}`)
}
</script>

<script>
export default {
  name: "UserProfile"
}
</script>

<style scoped>
/* ========== 页面基础 ========== */
.profile-page-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
}

/* ========== 头部卡片优化 ========== */
.profile-header-card {
  background: linear-gradient(135deg, #ffffff 0%, #fff9f5 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.profile-header-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(255, 152, 0, 0.2);
}

.avatar-wrapper {
  display: inline-block;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 32px !important;
  height: 32px !important;
  border: 2px solid white;
  border-radius: 50% !important;
  transition: all 0.2s ease;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
}

.ring-border {
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.shadow-lg {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
}

.shadow-md {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.follow-btn {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.2);
}

.follow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 87, 34, 0.35);
}

/* ========== 标签页优化 ========== */
.modern-tabs :deep(.v-tabs-bar) {
  background: transparent !important;
  border-bottom: 2px solid rgba(0, 0, 0, 0.08);
}

.tab-item {
  transition: all 0.2s ease;
  border-radius: 12px 12px 0 0;
  margin-bottom: -2px;
}

.tab-item:hover {
  background: rgba(255, 152, 0, 0.04);
}

:deep(.v-tab--selected) {
  color: #e65100 !important;
  font-weight: 600;
  background: rgba(255, 152, 0, 0.08) !important;
  border-bottom: 2px solid #ff5722 !important;
}

/* ========== 帖子卡片优化 ========== */
.note-col {
  padding-left: 8px;
  padding-right: 8px;
}

.note-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.note-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(255, 152, 0, 0.3);
}

.note-image-wrapper {
  overflow: hidden;
  background: #f5f5f5;
}

.note-img {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.note-card:hover .note-img {
  transform: scale(1.08);
}

.note-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.note-card:hover .note-overlay {
  opacity: 1;
}

.media-type-chip {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.65rem;
  font-weight: 600;
}

/* 空状态优化 */
.empty-state {
  background: linear-gradient(180deg, #fff9f5 0%, #ffffff 100%);
  border-radius: 20px;
  border: 2px dashed rgba(255, 152, 0, 0.2);
}

.empty-state-icon {
  animation: floatIcon 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.max-width-320 {
  max-width: 320px;
}

/* ========== 取消保存按钮 ========== */
.unsave-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 2px solid white;
  border-radius: 50% !important;
  width: 30px !important;
  height: 30px !important;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.unsave-btn:hover {
  transform: scale(1.15);
  background: #fff !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* ========== 头像上传按钮 ========== */
.avatar-upload-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-upload-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.3);
}

.avatar-upload-btn:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 24px rgba(255, 87, 34, 0.45);
}

/* ========== 表单输入优化 ========== */
.modern-input :deep(.v-field) {
  border-radius: 16px !important;
  border: 2px solid rgba(0, 0, 0, 0.1) !important;
  background: #ffffff !important;
  transition: all 0.25s ease;
}

.modern-input :deep(.v-field:hover) {
  border-color: rgba(255, 152, 0, 0.4) !important;
  background: rgba(255, 248, 240, 0.5) !important;
}

.modern-input :deep(.v-field--focused) {
  border-color: #ff5722 !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.12) !important;
}

.modern-input :deep(.v-field__input) {
  padding: 14px 16px !important;
  font-size: 0.95rem;
}

/* ========== 编辑弹窗优化 ========== */
.edit-profile-dialog {
  border-radius: 24px !important;
  overflow: hidden;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* ========== 通用工具类 ========== */
.position-relative { position: relative; }
.transition-transform { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.transition-opacity { transition: opacity 0.3s ease; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

/* ========== 响应式优化 ========== */
@media (max-width: 600px) {
  .profile-header-card {
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
  }
  
  .profile-header-content {
    padding: 20px 16px !important;
  }
  
  .note-image-wrapper {
    height: 140px !important;
  }
  
  .tab-item {
    padding: 0 12px !important;
    font-size: 0.85rem;
  }
  
  :deep(.v-tab__slider) {
    display: none;
  }
}

/* ========== 深色模式支持 ========== */
@media (prefers-color-scheme: dark) {
  .profile-page-bg {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .profile-header-card {
    background: linear-gradient(135deg, #1e1e3a 0%, #2a2a4a 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .note-card {
    background: #1e1e3a;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .modern-input :deep(.v-field) {
    background: #2a2a4a !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
  }
  
  .empty-state {
    background: linear-gradient(180deg, #2a2a4a 0%, #1e1e3a 100%);
    border-color: rgba(255, 152, 0, 0.2);
  }
}
</style>