<template>
  <div class="post-page-wrapper">
    <v-container class="py-6 py-md-10" style="max-width: 900px;">
      <!-- 🎨 顶部卡片 -->
      <v-card class="post-header-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-btn 
                icon 
                variant="text" 
                class="mr-2 back-btn"
                @click="$router.back()"
              >
                <v-icon icon="mdi-arrow-left" size="24" />
              </v-btn>
              <h1 class="text-h5 font-weight-bold"> Create Post</h1>
            </div>
            <v-btn 
              color="orange" 
              variant="elevated"
              :disabled="!isValid" 
              :loading="loading"
              @click="submitPost"
              class="post-btn text-none font-weight-medium"
              size="large"
            >
              {{ loading ? 'Posting...' : 'Post' }}
            </v-btn>
          </div>
        </v-card-item>
      </v-card>

      <!-- 👤 作者信息 -->
      <v-card class="author-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex align-center">
            <v-avatar size="56" class="author-avatar border-thin">
              <v-img :src="getSafeAvatar(userAvatar)" cover />
            </v-avatar>
            
            <div class="ml-4 flex-grow-1">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <h3 class="text-h6 font-weight-bold mb-0.5">{{ userName }}</h3>
                  <div class="d-flex align-center text-caption text-grey-darken-1">
                    <v-icon icon="mdi-earth" size="14" class="mr-1" />
                    {{ postPrivacyLabel }}
                  </div>
                </div>
                <v-chip size="small" color="orange" variant="tonal" class="font-weight-medium">
                  <v-icon start size="14">mdi-food</v-icon>
                  Foodie
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-item>
      </v-card>

      <!-- 📝 内容输入区域 -->
      <v-card class="content-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <v-text-field 
            v-model="newPostTitle"
            placeholder="🍽️ What's the star of your meal?"
            variant="outlined"
            density="comfortable"
            class="mb-3 modern-input"
            :maxlength="MAX_TITLE_LENGTH"
            counter
            hide-details="auto"
            rounded="xl"
          >
            <template #prepend-inner>
              <v-icon icon="mdi-pencil" color="orange" />
            </template>
          </v-text-field>

          <v-textarea
            v-model="newPostContent"
            placeholder="Share your food story..."
            variant="outlined"
            density="comfortable"
            rows="5"
            auto-grow
            class="modern-input mb-2"
            :maxlength="MAX_CONTENT_LENGTH"
            bg-color="grey-lighten-5"
            rounded="xl"
            style="font-size: 1.05rem; line-height: 1.6;"
          >
            <template #prepend-inner>
              <v-icon icon="mdi-comment-text" color="orange" />
            </template>
          </v-textarea>
          
          <div class="d-flex justify-end align-center">
            <v-progress-linear
              :model-value="(newPostContent.length / MAX_CONTENT_LENGTH) * 100"
              :color="contentProgressColor"
              height="3"
              rounded
              class="mt-1"
              style="max-width: 120px;"
            />
            <span :class="['text-caption ml-3 font-weight-medium', contentHintClass]">
              {{ contentHintText }}
            </span>
          </div>
        </v-card-item>
      </v-card>

      <!-- 📸 媒体上传区域 -->
      <v-card class="media-card mb-6" elevation="0" v-if="mediaPreviewUrls.length || newPostFiles.length">
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between mb-4">
            <h4 class="text-subtitle-1 font-weight-bold">📸 Media</h4>
            <v-btn 
              variant="text" 
              size="small" 
              color="grey"
              @click="$refs.fileInput.click()"
              class="text-none"
            >
              <v-icon start>mdi-plus</v-icon>
              Add More
            </v-btn>
          </div>
          
          <div class="media-grid">
            <div
              v-for="(url, i) in mediaPreviewUrls"
              :key="i"
              class="media-item"
            >
              <v-img
                v-if="mediaTypes[i] === 'image'"
                :src="url"
                cover
                class="media-content"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                    <v-progress-circular indeterminate color="orange" size="32" />
                  </div>
                </template>
              </v-img>

              <video
                v-else
                :src="url"
                class="media-content"
                controls
              ></video>

              <div class="media-badge">
                <v-icon size="12" :icon="mediaTypes[i] === 'video' ? 'mdi-video' : 'mdi-image'" />
              </div>

              <v-btn
                icon="mdi-close"
                color="white"
                variant="flat"
                size="x-small"
                class="media-delete-btn"
                @click="removeMedia(i)"
              />
            </div>
          </div>
        </v-card-item>
      </v-card>

      <!-- 🎛️ 工具栏 -->
      <v-card class="toolbar-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex flex-wrap ga-3">
            <v-btn 
              variant="outlined" 
              color="grey" 
              size="small"
              class="tool-btn"
              @click="$refs.fileInput.click()"
            >
              <v-icon start>mdi-image-plus</v-icon>
              Photo/Video
            </v-btn>
            <v-file-input
              ref="fileInput"
              v-model="newPostFiles"
              accept="image/*,video/*"
              multiple
              hide-input
              class="d-none"
            />

            <v-btn 
              variant="outlined" 
              color="grey" 
              size="small"
              class="tool-btn"
              @click="getLocation"
            >
              <v-icon start>mdi-map-marker-outline</v-icon>
              Location
            </v-btn>

            <v-menu>
              <template #activator="{ props }">
                <v-btn variant="outlined" color="grey" size="small" class="tool-btn" v-bind="props">
                  <v-icon start>mdi-emoticon-happy-outline</v-icon>
                  Mood
                </v-btn>
              </template>
              <v-list class="rounded-xl" density="compact">
                <v-list-item 
                  v-for="item in moodItems" 
                  :key="item.value"
                  @click="newPostMood = item.value"
                  class="rounded-lg mx-2 my-1"
                >
                  <template #prepend>
                    <span class="text-h5 mr-3">{{ item.emoji }}</span>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ item.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-menu>
              <template #activator="{ props }">
                <v-btn variant="outlined" color="grey" size="small" class="tool-btn" v-bind="props">
                  <v-icon start>mdi-tag-outline</v-icon>
                  Tags
                </v-btn>
              </template>
              <v-card class="rounded-xl pa-3" width="280">
                <v-combobox
                  v-model="newPostTags"
                  :items="suggestedTags"
                  label="Add tags"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                  closable-chips
                  prepend-icon="mdi-tag"
                  hide-details
                >
                  <template #chip="{ item, props }">
                    <v-chip v-bind="props" :text="`#${item.raw}`" size="small" color="orange" variant="tonal" />
                  </template>
                </v-combobox>
              </v-card>
            </v-menu>
          </div>
        </v-card-item>
      </v-card>

      <!-- 🏷️ 已选标签展示 -->
      <div class="d-flex flex-wrap ga-2 mb-6 px-2">
        <v-chip 
          v-if="newPostLocation" 
          size="small" 
          color="blue" 
          variant="tonal"
          class="font-weight-medium"
          closable 
          @click:close="newPostLocation = ''"
        >
          <v-icon start size="14">mdi-map-marker</v-icon>
          {{ newPostLocation }}
        </v-chip>
        
        <v-chip 
          v-if="newPostMood" 
          size="small" 
          color="pink" 
          variant="tonal"
          class="font-weight-medium"
          closable 
          @click:close="newPostMood = ''"
        >
          {{ getMoodEmoji(newPostMood) }} {{ newPostMood }}
        </v-chip>
        
        <v-chip 
          v-for="tag in newPostTags" 
          :key="tag"
          size="small" 
          color="orange" 
          variant="outlined"
          class="font-weight-medium"
          closable
          @click:close="removeTag(tag)"
        >
          #{{ tag }}
        </v-chip>
      </div>

      <!-- 🔒 隐私设置 -->
      <v-card class="privacy-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h4 class="text-subtitle-1 font-weight-bold mb-1">🔐 Visibility</h4>
              <p class="text-caption text-grey-darken-1">Choose who can see your post</p>
            </div>
            <v-select
              v-model="postPrivacy"
              :items="privacyOptions"
              variant="outlined"
              density="compact"
              hide-details
              class="modern-select"
              style="max-width: 200px;"
            />
          </div>
        </v-card-item>
      </v-card>

      <!-- 💾 草稿提示 -->
      <v-alert
        v-if="hasDraft"
        type="info"
        variant="tonal"
        color="orange"
        class="mb-6 rounded-xl"
        density="comfortable"
      >
        <template #prepend>
          <v-icon icon="mdi-content-save" />
        </template>
        <div class="d-flex align-center justify-space-between">
          <span class="font-weight-medium">Draft auto-saved</span>
          <v-btn size="small" variant="text" color="orange" @click="clearDraft">Clear</v-btn>
        </div>
      </v-alert>

    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultAvatar from '@/assets/default-profile.jpg'

const router = useRouter()

// ✅ 配置常量
const MAX_CONTENT_LENGTH = 500
const MAX_TITLE_LENGTH = 50
const DRAFT_SAVE_DELAY = 1000

// ✅ 用户信息
const userName = ref(localStorage.getItem('userName') || 'Guest')
const userAvatar = ref(localStorage.getItem('userAvatar') || '')

function getSafeAvatar(avatar) {
  return avatar && avatar !== "null" && avatar.trim() !== "" ? avatar : DefaultAvatar
}

// ✅ 表单状态
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostFiles = ref([])
const mediaPreviewUrls = ref([])
const mediaTypes = ref([])
const newPostLocation = ref('')
const newPostMood = ref('')
const newPostTags = ref([])
const postPrivacy = ref('public')
const loading = ref(false)

// ✅ 选项数据
const moodItems = [
  { value: 'delicious', label: 'Delicious', emoji: '😋' },
  { value: 'amazing', label: 'Amazing', emoji: '😍' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'cool', label: 'Cool', emoji: '😎' },
  { value: 'celebrating', label: 'Celebrating', emoji: '🥳' }
]
const suggestedTags = ['foodie', 'travel', 'recipe', 'malaysia', 'japan', 'streetfood', 'homemade', 'dessert']
const privacyOptions = [
  { title: 'Public', value: 'public', icon: '🌍' },
  { title: 'Followers', value: 'followers', icon: '👥' },
  { title: 'Private', value: 'private', icon: '🔒' }
]

// ✅ 计算属性
const isValid = computed(() => 
  newPostContent.value.trim().length > 0 && 
  newPostContent.value.length <= MAX_CONTENT_LENGTH &&
  !loading.value
)

const contentHintText = computed(() => {
  const len = newPostContent.value.length
  if (len > MAX_CONTENT_LENGTH) return `${len - MAX_CONTENT_LENGTH} over`
  if (len > MAX_CONTENT_LENGTH * 0.9) return `✨ ${len}/${MAX_CONTENT_LENGTH}`
  return `${len}/${MAX_CONTENT_LENGTH}`
})

const contentHintClass = computed(() => {
  const len = newPostContent.value.length
  if (len > MAX_CONTENT_LENGTH) return 'text-error'
  if (len > MAX_CONTENT_LENGTH * 0.9) return 'text-orange'
  return 'text-grey-darken-1'
})

const contentProgressColor = computed(() => {
  const percent = newPostContent.value.length / MAX_CONTENT_LENGTH
  if (percent > 1) return 'error'
  if (percent > 0.9) return 'orange'
  return 'orange-lighten-2'
})

const postPrivacyLabel = computed(() => {
  const opt = privacyOptions.find(o => o.value === postPrivacy.value)
  return opt?.icon + ' ' + opt?.title || '🌍 Public'
})

const hasDraft = computed(() => !!localStorage.getItem('postDraft'))

// ✅ 辅助函数
function getMoodEmoji(value) {
  return moodItems.find(m => m.value === value)?.emoji || '😊'
}

function removeTag(tag) {
  const idx = newPostTags.value.indexOf(tag)
  if (idx > -1) newPostTags.value.splice(idx, 1)
}

function removeMedia(index) {
  URL.revokeObjectURL(mediaPreviewUrls.value[index])
  mediaPreviewUrls.value.splice(index, 1)
  mediaTypes.value.splice(index, 1)
  if (newPostFiles.value instanceof FileList) {
    const arr = Array.from(newPostFiles.value)
    arr.splice(index, 1)
    newPostFiles.value = arr
  }
}

function clearMedia() {
  mediaPreviewUrls.value.forEach(u => URL.revokeObjectURL(u))
  mediaPreviewUrls.value = []
  mediaTypes.value = []
  newPostFiles.value = []
}

// ✅ 获取位置
const getLocation = () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported")
    return
  }
  newPostLocation.value = '📍 Getting location...'
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          { headers: { 'User-Agent': 'CulturalCulinaryAtlas/1.0' } }
        )
        const data = await res.json()
        newPostLocation.value = data.address?.city || data.address?.town || data.address?.village || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      } catch {
        newPostLocation.value = `📍 ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      }
    },
    () => {
      newPostLocation.value = ''
      alert("Unable to get location. Type manually!")
    },
    { enableHighAccuracy: false, timeout: 5000 }
  )
}

let draftTimer = null

watch([newPostContent, newPostTitle, newPostTags, newPostLocation, newPostMood, postPrivacy], () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    if (newPostContent.value.trim() || newPostTitle.value.trim()) {
      localStorage.setItem('postDraft', JSON.stringify({
        title: newPostTitle.value,
        content: newPostContent.value,
        tags: newPostTags.value,
        location: newPostLocation.value,
        mood: newPostMood.value,
        privacy: postPrivacy.value,
        savedAt: Date.now()
      }))
    }
  }, DRAFT_SAVE_DELAY)
}, { deep: true })

watch(newPostFiles, (fileList) => {
  if (fileList && fileList.length > 0) {
    const filesArray = Array.isArray(fileList) ? fileList : Array.from(fileList)
    
    filesArray.forEach(file => {
      if (file && file instanceof File) {
        const mimeType = file.type || ''
        const type = mimeType.startsWith('video/') ? 'video' : 'image'
        
        mediaTypes.value.push(type)
        mediaPreviewUrls.value.push(URL.createObjectURL(file))
      }
    })
  }
}, { deep: true })

onMounted(() => {
  const draft = localStorage.getItem('postDraft')
  if (draft && confirm('📝 Restore saved draft?')) {
    try {
      const d = JSON.parse(draft)
      newPostTitle.value = d.title || ''
      newPostContent.value = d.content || ''
      newPostTags.value = d.tags || []
      newPostLocation.value = d.location || ''
      newPostMood.value = d.mood || ''
      postPrivacy.value = d.privacy || 'public'
    } catch { localStorage.removeItem('postDraft') }
  }
})

onUnmounted(() => {
  if (draftTimer) clearTimeout(draftTimer)
  clearMedia()
})

function clearDraft() {
  localStorage.removeItem('postDraft')
}

const submitPost = async () => {
  if (!isValid.value) return
  loading.value = true
  
  try {
    let imageUrl = null
    let videoUrl = null
    let imagesArray = [] 

    if (newPostFiles.value?.length > 0) {
      const filesArray = Array.isArray(newPostFiles.value) 
        ? newPostFiles.value 
        : Array.from(newPostFiles.value)

      for (const file of filesArray) {
        if (!file || !(file instanceof File)) continue
        
        const formData = new FormData()
        formData.append('file', file)
        
        // ✅ 使用相对路径
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
        
        const uploadData = await uploadRes.json()
        const mimeType = file.type || ''
 
        if (mimeType.startsWith('video/') && !videoUrl) {
          videoUrl = uploadData.url 
        } else if (mimeType.startsWith('image/')) {
          if (!imageUrl) imageUrl = uploadData.url 
          imagesArray.push({
            url: uploadData.url,
            caption: '',
            order: imagesArray.length
          })
        }
      }
    }

    const postData = {
      authorId: localStorage.getItem('userId'),
      author: userName.value,
      title: newPostTitle.value.trim() || 'Untitled',
      content: newPostContent.value.trim(),
      location: newPostLocation.value,
      mood: newPostMood.value,
      tags: newPostTags.value,
      privacy: postPrivacy.value,
      image: imageUrl,        
      images: imagesArray,   
      videoUrl: videoUrl,
      mediaType: videoUrl ? 'video' : (imagesArray.length > 1 ? 'gallery' : 'image'),
      createdAt: new Date().toISOString()
    }
    
    console.log('📮 Posting data:', postData)
    
    // ✅ 使用相对路径
    const postRes = await fetch('/api/posts', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData)
    })
    
    if (!postRes.ok) {
      const err = await postRes.json().catch(() => ({}))
      throw new Error(err.error || "Post failed")
    }
    
    clearDraft()
    clearMedia()
    alert("🎉 Posted! Your food story is live! ✨")
    router.push('/community')
    
  } catch (err) {
    console.error("❌ Post error:", err)
    alert(`Failed: ${err.message}`)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========== 极简设计：无背景色 ========== */

/* 页面容器：纯白背景 */
.post-page-wrapper {
  min-height: 100vh;
  position: relative;
}

:deep(.v-card) {
  border-radius: 16px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: none !important;
  transition: all 0.2s ease;
}

:deep(.v-card:hover) {
  transform: none;
  border-color: rgba(0, 0, 0, 0.12) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

.author-avatar { 
  position: relative; 
  z-index: 2; 
}

.border-thin { 
  border: 2px solid rgba(0, 0, 0, 0.08); 
}

.modern-input :deep(.v-field) {
  border-radius: 12px !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  background: #ffffff !important;
  transition: all 0.2s ease;
}

.modern-input :deep(.v-field:hover) {
  border-color: rgba(0, 0, 0, 0.2) !important;
}

.modern-input :deep(.v-field--focused) {
  border-color: #ff5722 !important;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.08) !important;
}

.modern-input :deep(.v-field__input) { 
  padding: 12px 16px !important; 
}

.post-btn {
  border-radius: 12px !important;
  padding: 0 24px !important;
  min-width: 100px !important;
  transition: all 0.2s ease !important;
  box-shadow: none !important;
}

.post-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2) !important;
}

.tool-btn {
  border-radius: 10px !important;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.tool-btn:hover {
  transform: none;
  border-color: #ff5722 !important;
  color: #ff5722 !important;
  background: rgba(255, 87, 34, 0.04) !important;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.media-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.media-item:hover {
  transform: none;
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.media-content { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
}

.media-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 2;
}

.media-delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(244, 67, 54, 0.9) !important;
  color: white !important;
  border: 2px solid white;
  border-radius: 50% !important;
  width: 26px !important;
  height: 26px !important;
  transition: all 0.2s ease;
}

.media-delete-btn:hover {
  transform: scale(1.1);
  background: rgba(211, 47, 47, 1) !important;
}

/* 选择器 */
.modern-select :deep(.v-field) {
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  background: #ffffff !important;
}

.modern-select :deep(.v-field--focused) { 
  border-color: #ff5722 !important; 
}

/* 响应式 */
@media (max-width: 600px) {
  .post-header-card { 
    border-radius: 0 !important; 
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
  }
  
  .media-grid { 
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); 
    gap: 10px; 
  }
  
  .tool-btn { 
    flex: 1; 
    justify-content: center; 
  }
}

/* 深色模式：纯黑背景 */
@media (prefers-color-scheme: dark) {
  .post-page-wrapper { 
    background: #0a0a0a; 
  }
  
  :deep(.v-card) { 
    background: #1a1a1a !important; 
    border-color: rgba(255, 255, 255, 0.1) !important; 
  }
  
  .modern-input :deep(.v-field) { 
    background: #1a1a1a !important; 
    border-color: rgba(255, 255, 255, 0.15) !important; 
  }
  
  .media-item { 
    background: #1a1a1a; 
    border-color: rgba(255, 255, 255, 0.1); 
  }
}
</style>