<template>
  <div class="profile-page-bg">
    <v-container class="py-8" style="max-width: 960px;">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <div class="d-flex align-center mb-6 px-4">
            <v-avatar size="80" class="border-white border-thick shadow-sm mr-4">
              <v-img :src="user.avatar || DefaultAvatar" cover />
            </v-avatar>
            
            <div class="flex-grow-1">
              <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-1">{{ user.name }}</h2>
              <div class="text-body-2 text-grey mb-2">
                <v-icon size="x-small" class="mr-1">mdi-email-outline</v-icon> 
                {{ isCurrentUser ? user.email : hideEmail(user.email) }}
              </div>
              <v-chip size="x-small" color="orange" variant="tonal" class="mr-2">
                <v-icon start size="x-small">mdi-map-marker</v-icon> {{ user.location || 'Unknown' }}
              </v-chip>
            </div>

            <v-btn 
              v-if="isCurrentUser"
              icon="mdi-pencil-outline" 
              size="small" 
              variant="text" 
              color="grey" 
              @click="editDialog = true"
            />

            <v-btn
              v-else
              :color="isFollowing ? 'grey' : 'orange'"
              :variant="isFollowing ? 'outlined' : 'tonal'"
              size="small"
              rounded="pill"
              class="ml-2 text-none"
              @click="toggleFollow"
            >
              {{ isFollowing ? '✓ Following' : '+ Follow' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- ✅ 标签切换：我的帖子 / 我保存的帖子 -->
      <div class="section-header mb-4 px-4">
        <v-tabs v-model="profileTab" color="orange" align-tabs="start" class="border-bottom">
          <v-tab value="posts">
            <v-icon start size="small">mdi-food-apple-outline</v-icon>
            My Posts
          </v-tab>
          <v-tab value="saved">
            <v-icon start size="small">mdi-bookmark-outline</v-icon>
            Saved Posts
            <v-chip v-if="savedPostsCount > 0" size="x-small" color="orange" class="ml-2">
              {{ savedPostsCount }}
            </v-chip>
          </v-tab>
        </v-tabs>
      </div>

      <!-- ✅ 标签内容区域 -->
      <v-window v-model="profileTab" class="px-4">

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
              <div class="note-item" @click="goToPostDetail(post._id)">   
                <div class="note-image-wrapper rounded-lg overflow-hidden shadow-sm">
                  <v-img 
                    :src="post.image || 'https://via.placeholder.com/300x300?text=No+Image'" 
                    height="200" 
                    cover 
                    class="note-img"
                  ></v-img>
                </div>
                <div class="note-title mt-2 px-1">
                  <span class="text-body-2 text-grey-darken-3 font-weight-medium line-clamp-2">
                    {{ post.content || 'Untitled Post' }}
                  </span>
                </div>
                <div class="note-footer mt-2 px-1 d-flex justify-space-between align-center">
                  <span class="text-caption text-grey">{{ timeAgoShort(post.createdAt) }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
          <div v-else class="text-center py-12">
            <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-food-apple-outline</v-icon>
            <p class="text-grey text-body-1">No posts yet.</p>
          </div>
        </v-window-item>
        
        <!-- ✅ 我保存的帖子（新内容） -->
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
              <div class="note-item" @click="goToPostDetail(post._id)">   
                <div class="note-image-wrapper rounded-lg overflow-hidden shadow-sm position-relative">
                  <v-img 
                    :src="post.image || 'https://via.placeholder.com/300x300?text=No+Image'" 
                    height="200" 
                    cover 
                    class="note-img"
                  ></v-img>
                  <!-- ✅ 取消保存按钮 - 只显示在自己的 profile -->
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
                <div class="note-title mt-2 px-1">
                  <span class="text-body-2 text-grey-darken-3 font-weight-medium line-clamp-2">
                    {{ post.content || 'Untitled Post' }}
                  </span>
                </div>
                <div class="note-footer mt-2 px-1 d-flex justify-space-between align-center">
                  <span class="text-caption text-grey">{{ post.author }}</span>
                  <span class="text-caption text-grey">{{ timeAgoShort(post.createdAt) }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
          <div v-else class="text-center py-12">
            <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-bookmark-off-outline</v-icon>
            <p class="text-grey text-body-1">No saved posts yet.</p>
            <!-- ✅ 只显示在自己的 profile -->
            <p v-if="isCurrentUser" class="text-caption text-grey-darken-1 mt-2">Explore the community and save posts you love!</p>
            <v-btn 
              v-if="isCurrentUser"
              color="orange" 
              variant="tonal" 
              class="mt-4"
              @click="$router.push('/community')"
            >
              Explore Community
            </v-btn>
          </div>
        </v-window-item>
        
      </v-window>

      <!-- 编辑资料弹窗（保持不变） -->
      <v-dialog v-model="editDialog" max-width="450" persistent>
        <v-card class="rounded-xl">
          <v-card-title class="text-h6 font-weight-bold">Edit Profile</v-card-title>
          <v-card-text class="pa-4">
            <v-text-field v-model="user.name" label="Name" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field v-model="user.email" label="Email" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field v-model="user.location" label="Location" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-file-input v-model="newAvatarFile" label="Avatar" prepend-icon="mdi-camera" variant="outlined" density="compact"></v-file-input>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="editDialog = false">Cancel</v-btn>
            <v-btn color="#ff5722" @click="saveProfile">Save</v-btn>
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

// ✅ 用 computed 确保 userId 始终是有效字符串（修复 [object Object] 问题）
const userId = computed(() => {
  const id = route.params.id
  
  // ✅ 处理各种可能的类型
  if (id === null || id === undefined) return ''
  if (typeof id === 'string') return id.trim()
  if (typeof id === 'object' && id !== null) {
    // ✅ 处理对象情况：尝试提取 _id 或 toString
    if (id._id) return String(id._id).trim()
    if (id.toString && id.toString() !== '[object Object]') {
      return String(id.toString()).trim()
    }
  }
  return String(id || '').trim()
})

const currentUserId = ref(localStorage.getItem('userId'))

// ✅ 标签状态
const profileTab = ref('posts')  // 'posts' | 'saved'
const savedPosts = ref([])
const savedPostsCount = computed(() => savedPosts.value.length)

// ✅ 监听路由参数变化（确保转换为有效字符串）
watch(
  () => route.params.id,
  (newId) => {
    // ✅ 确保新值转换为有效字符串
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
  // ✅ 修复：放宽验证，只检查基本格式
  const userIdStr = getStringId(uid)
  
  if (!userIdStr || userIdStr === '[object Object]' || userIdStr.length < 20) {
    console.error('❌ userId is invalid:', { uid, userIdStr })
    return
  }
  
  console.log('📥 Loading data for userId:', userIdStr)
  
  try {
    // ✅ 使用相对路径
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
    // ✅ 使用相对路径
    const resPosts = await fetch(`/api/posts?authorId=${userIdStr}`)
    console.log('📥 Response status:', resPosts.status)
    
    if(resPosts.ok) {
      const data = await resPosts.json()
      console.log('📦 Posts received:', data.length, 'posts')
      if (data.length > 0) {
        console.log('📄 First post authorId:', data[0].authorId, 'author:', data[0].author)
      }
      
      posts.value = Array.isArray(data) 
        ? data.map(post => ({
            ...post,
            _id: post._id || post.id,
            authorId: getStringId(post.authorId),
            liked: post.likedBy?.some(id => String(id) === String(currentUserId.value)) || false,
            saved: post.savedBy?.some(id => String(id) === String(currentUserId.value)) || false
          }))
        : []
        
      console.log('✅ Posts loaded:', posts.value.length)
    } else {
      console.error('Failed to load posts:', resPosts.status)
    }
  } catch (e) {
    console.error('Posts load error:', e)
  }

  // 加载关注状态（仅查看他人时）
  if (currentUserId.value && userIdStr !== String(currentUserId.value)) {
    try {
      // ✅ 使用相对路径
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

// ✅ 加载用户保存的帖子（修复版：查询指定作者保存的帖子）
async function loadSavedPosts(authorId) {
  try {
    // ✅ 确保使用字符串
    const authorIdStr = getStringId(authorId)
    
    // ✅ 查询该作者保存的帖子（savedBy 字段存储的是用户 ID）
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts?savedBy=${authorIdStr}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      // ✅ 修复：为每个帖子添加 saved: true 字段 + 确保 _id + 确保 authorId 是字符串
      savedPosts.value = Array.isArray(data) 
        ? data.map(post => ({
            ...post,
            _id: post._id || post.id,
            authorId: getStringId(post.authorId),
            saved: true  // ✅ 因为是 saved posts，所以肯定是已保存状态
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
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${postId}/save`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId.value
      }
    })
    
    if (res.ok) {
      // 从本地列表移除
      savedPosts.value = savedPosts.value.filter(p => p._id !== postId)
      // 如果这个帖子也在我的帖子列表里，同步更新
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

function hideEmail(email) {
  if(!email) return ''
  const [name, domain] = email.split('@')
  return `${name[0]}***@${domain}`
}

// ✅ onMounted 只需初始化 + 调试
onMounted(() => {
  console.log('🔍 Profile debug:', {
    userId: userId.value,
    currentUserId: currentUserId.value,
    isCurrentUser: isCurrentUser.value,
    routeParams: route.params
  })
  
  // 如果路由参数已经有值，手动触发一次加载
  if (userId.value) {
    loadUserData(userId.value)
  }
})

// ✅ 监听标签切换，懒加载保存的帖子
watch(profileTab, (newTab) => {
  if (newTab === 'saved' && savedPosts.value.length === 0) {
    loadSavedPosts(userId.value)
  }
})

async function saveProfile(){
  if (!isCurrentUser.value) {
    alert('You can only edit your own profile')
    return
  }

  const formData = new FormData()
  formData.append("name", user.value.name)
  formData.append("email", user.value.email)
  formData.append("location", user.value.location)
  if (newAvatarFile.value) formData.append("avatar", newAvatarFile.value)

  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/user/profile/${userId.value}`, {
      method: "PUT", 
      body: formData,
      headers: {
        'X-User-Id': currentUserId.value
      }
    })
    if (res.ok){
      const updatedUser = await res.json()
      user.value = updatedUser

      localStorage.setItem("userName", updatedUser.name)
      localStorage.setItem("userEmail", updatedUser.email)
      localStorage.setItem("userAvatar", updatedUser.avatar || "")
      editDialog.value = false
    } else if (res.status === 403) {
      alert('Permission denied: You can only edit your own profile!')
    } else {
      throw new Error('Failed to save profile')
    }
  } catch (err) {
    console.error('Save profile error:', err)
    alert('Failed to save profile. Please try again.')
  }
}

async function toggleFollow() {
  if(isCurrentUser.value) return 
  try{
    // ✅ 使用相对路径
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
  // ✅ 确保 id 是字符串
  const postId = getStringId(id)
  if (!postId) {
    console.warn('⚠️ postId is empty, cannot navigate')
    return
  }
  console.log('🔗 Navigating to post:', postId)
  router.push(`/post/${postId}`)
}
</script>

<script>
export default {
  name: "UserProfile"
}
</script>

<style scoped>
.profile-page-bg {
  min-height: 100vh;
  background-color: #f9f9f9; 
}

.border-thick {
  border: 3px solid white;
}

.border-bottom {
  border-bottom: 2px solid #f0f0f0;
}

.note-col {
  padding-left: 8px;
  padding-right: 8px;
}

.note-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.note-item:hover {
  transform: translateY(-2px);
}

.note-image-wrapper {
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05); 
}

.position-relative {
  position: relative;
}

/* ✅ 取消保存按钮样式 */
.unsave-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 2px solid white;
  border-radius: 50% !important;
  width: 28px !important;
  height: 28px !important;
  transition: all 0.2s ease;
}

.unsave-btn:hover {
  transform: scale(1.1);
  background: #fff !important;
}

/* ✅ 标签页样式 */
:deep(.v-tabs-bar) {
  background: transparent !important;
}

:deep(.v-tab) {
  font-weight: 500;
  text-transform: none;
  min-width: auto !important;
  padding: 0 16px !important;
}

:deep(.v-tab--selected) {
  color: #ff5722 !important;
}

:deep(.v-window-item) {
  padding-top: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

/* ✅ 响应式 */
@media (max-width: 600px) {
  :deep(.v-tab) {
    padding: 0 12px !important;
    font-size: 0.85rem;
  }
  .note-image-wrapper {
    height: 150px !important;
  }
}
</style>