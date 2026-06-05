<template>
  <div class="post-page-wrapper">
    <v-container class="py-6 py-md-10" style="max-width: 900px;">
      <v-card class="post-header-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-btn icon variant="text" class="mr-2 back-btn" @click="$router.back()">
                <v-icon icon="mdi-arrow-left" size="24" />
              </v-btn>
              <h1 class="text-h5 font-weight-bold">{{ isEditMode ? 'Edit Post' : 'Create Post' }}</h1>
            </div>
            <v-btn 
              color="orange" variant="elevated" :disabled="!isValid" :loading="loading"
              @click="submitPost" class="post-btn text-none font-weight-medium" size="large"
            >
              {{ loading ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post') }}
            </v-btn>
          </div>
        </v-card-item>
      </v-card>

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
                  <v-icon start size="14">mdi-food</v-icon> Foodie
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-item>
      </v-card>

      <v-card class="content-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <v-text-field 
            v-model="newPostTitle" placeholder="🍽️ What's the star of your meal?"
            variant="outlined" density="comfortable" class="mb-3 modern-input"
            :maxlength="MAX_TITLE_LENGTH" counter hide-details="auto" rounded="xl"
          >
            <template #prepend-inner><v-icon icon="mdi-pencil" color="orange" /></template>
          </v-text-field>

          <v-textarea
            v-model="newPostContent" placeholder="Share your food story..."
            variant="outlined" density="comfortable" rows="5" auto-grow
            class="modern-input mb-2" :maxlength="MAX_CONTENT_LENGTH"
            bg-color="grey-lighten-5" rounded="xl" style="font-size: 1.05rem; line-height: 1.6;"
          >
            <template #prepend-inner><v-icon icon="mdi-comment-text" color="orange" /></template>
          </v-textarea>
          
          <div class="d-flex justify-end align-center">
            <v-progress-linear :model-value="(newPostContent.length / MAX_CONTENT_LENGTH) * 100"
              :color="contentProgressColor" height="3" rounded class="mt-1" style="max-width: 120px;" />
            <span :class="['text-caption ml-3 font-weight-medium', contentHintClass]">{{ contentHintText }}</span>
          </div>
        </v-card-item>
      </v-card>

      <v-card 
        class="media-dropzone mb-6" 
        elevation="0"
        :class="{ 'is-empty': mediaItems.length === 0, 'is-dragover': isDragOver }"
        @click="handleDropzoneClick"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between mb-4">
            <h4 class="text-subtitle-1 font-weight-bold">📸 Media ({{ mediaItems.length }})</h4>
            <v-btn 
              variant="tonal" color="orange" size="small"
              @click.stop="triggerFileInput" class="text-none add-files-btn" prepend-icon="mdi-plus"
            >
              Add Files
            </v-btn>
          </div>

          <input 
            ref="fileInputRef" 
            type="file" 
            accept="image/*,video/*" 
            multiple 
            hidden 
            @change="handleFileChange" 
          />

          <div v-if="mediaItems.length > 0" class="media-grid mb-4">
            <div v-for="(item, i) in mediaItems" :key="i" class="media-item">
              <v-img 
                v-if="item.type === 'image'" 
                :src="item.url" 
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
                :src="item.url" 
                class="media-content" 
                controls
              ></video>

              <div class="media-badge">
                <v-icon size="12" :icon="item.type === 'video' ? 'mdi-video' : 'mdi-image'" />
                <v-chip v-if="item.isNew" size="x-small" color="green" variant="elevated" class="ml-1">New</v-chip>
              </div>

              <v-btn 
                icon="mdi-close" 
                color="white" 
                variant="flat" 
                size="x-small"
                class="media-delete-btn" 
                @click.stop="removeMedia(i)" 
              />
            </div>
          </div>

          <div class="drop-hint">
            <v-icon 
              :icon="isDragOver ? 'mdi-file-download-outline' : (mediaItems.length === 0 ? 'mdi-cloud-upload-outline' : 'mdi-arrow-expand-down')" 
              size="28" class="mb-2" 
            />
            <p class="text-body-2 mb-0 font-weight-medium">
              {{ isDragOver ? 'Drop files here...' : (mediaItems.length === 0 ? 'Click anywhere or drag files here' : 'Drag & drop to add more') }}
            </p>
            <p class="text-caption mt-1 mb-0" v-if="mediaItems.length > 0">
              or click "Add Files" button above
            </p>
          </div>
        </v-card-item>
      </v-card>

      <v-card class="toolbar-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex flex-wrap ga-3">
            <v-btn variant="outlined" color="grey" size="small" class="tool-btn" @click="getLocation">
              <v-icon start>mdi-map-marker-outline</v-icon> Location
            </v-btn>

            <v-menu>
              <template #activator="{ props }">
                <v-btn variant="outlined" color="grey" size="small" class="tool-btn" v-bind="props">
                  <v-icon start>mdi-emoticon-happy-outline</v-icon> Mood
                </v-btn>
              </template>
              <v-list class="rounded-xl" density="compact">
                <v-list-item v-for="item in moodItems" :key="item.value" @click="newPostMood = item.value" class="rounded-lg mx-2 my-1">
                  <template #prepend><span class="text-h5 mr-3">{{ item.emoji }}</span></template>
                  <v-list-item-title class="font-weight-medium">{{ item.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-menu>
              <template #activator="{ props }">
                <v-btn variant="outlined" color="grey" size="small" class="tool-btn" v-bind="props">
                  <v-icon start>mdi-tag-outline</v-icon> Tags
                </v-btn>
              </template>
              <v-card class="rounded-xl pa-3" width="280">
                <v-combobox v-model="newPostTags" :items="suggestedTags" label="Add tags" variant="outlined"
                  density="compact" multiple chips closable-chips prepend-icon="mdi-tag" hide-details>
                  <template #chip="{ item, props }">
                    <v-chip v-bind="props" :text="`#${item.raw}`" size="small" color="orange" variant="tonal" />
                  </template>
                </v-combobox>
              </v-card>
            </v-menu>
          </div>
        </v-card-item>
      </v-card>

      <div class="d-flex flex-wrap ga-2 mb-6 px-2">
        <v-chip v-if="newPostLocation" size="small" color="blue" variant="tonal" class="font-weight-medium" closable @click:close="newPostLocation = ''">
          <v-icon start size="14">mdi-map-marker</v-icon> {{ newPostLocation }}
        </v-chip>
        <v-chip v-if="newPostMood" size="small" color="pink" variant="tonal" class="font-weight-medium" closable @click:close="newPostMood = ''">
          {{ getMoodEmoji(newPostMood) }} {{ newPostMood }}
        </v-chip>
        <v-chip v-for="tag in newPostTags" :key="tag" size="small" color="orange" variant="outlined" class="font-weight-medium" closable @click:close="removeTag(tag)">
          #{{ tag }}
        </v-chip>
      </div>

      <v-card class="privacy-card mb-6" elevation="0">
        <v-card-item class="pa-5">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h4 class="text-subtitle-1 font-weight-bold mb-1">🔐 Visibility</h4>
              <p class="text-caption text-grey-darken-1">Choose who can see your post</p>
            </div>
            <v-select v-model="postPrivacy" :items="privacyOptions" variant="outlined" density="compact" hide-details class="modern-select" style="max-width: 200px;" />
          </div>
        </v-card-item>
      </v-card>

      <v-alert v-if="hasDraft && !isEditMode" type="info" variant="tonal" color="orange" class="mb-6 rounded-xl" density="comfortable">
        <template #prepend><v-icon icon="mdi-content-save" /></template>
        <div class="d-flex align-center justify-space-between">
          <span class="font-weight-medium">Draft auto-saved</span>
          <v-btn size="small" variant="text" color="orange" @click="clearDraft">Clear</v-btn>
        </div>
      </v-alert>
    </v-container>
  </div>
</template>

<script setup>
// ✅ 修复 1：引入 onActivated 以支持 keep-alive 缓存刷新
import { ref, computed, watch, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DefaultAvatar from '@/assets/default-profile.jpg'

const router = useRouter()
const route = useRoute()

const MAX_CONTENT_LENGTH = 500
const MAX_TITLE_LENGTH = 50
const DRAFT_SAVE_DELAY = 1000
const MAX_FILE_SIZE = 10 * 1024 * 1024

const userName = ref(localStorage.getItem('userName') || 'Guest')
const userAvatar = ref(localStorage.getItem('userAvatar') || '')
function getSafeAvatar(avatar) {
  return avatar && avatar !== "null" && avatar.trim() !== "" ? avatar : DefaultAvatar
}

const mediaItems = ref([]) 
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostLocation = ref('')
const newPostMood = ref('')
const newPostTags = ref([])
const postPrivacy = ref('public')
const loading = ref(false)

const fileInputRef = ref(null)
const isDragOver = ref(false)

const isEditMode = ref(false)
const editingPostId = ref(null)

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

const isValid = computed(() => newPostContent.value.trim().length > 0 && newPostContent.value.length <= MAX_CONTENT_LENGTH && !loading.value)
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

function getMoodEmoji(value) { return moodItems.find(m => m.value === value)?.emoji || '😊' }
function removeTag(tag) { const idx = newPostTags.value.indexOf(tag); if (idx > -1) newPostTags.value.splice(idx, 1) }

function removeMedia(index) {
  const item = mediaItems.value[index]
  if (item.isNew && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
  mediaItems.value.splice(index, 1)
}

function clearMedia() {
  mediaItems.value.forEach(item => {
    if (item.isNew && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
  })
  mediaItems.value = []
}

function triggerFileInput() { fileInputRef.value?.click() }
function handleDropzoneClick() { if (mediaItems.value.length === 0) triggerFileInput() }
function handleDrop(e) { isDragOver.value = false; const files = e.dataTransfer.files; if (!files || files.length === 0) return; processFiles(files) }
function handleFileChange(event) { const files = event.target.files; if (!files || files.length === 0) return; processFiles(files); event.target.value = '' }

function processFiles(files) {
  const validFiles = []
  const errors = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.size > MAX_FILE_SIZE) { errors.push(`${file.name} exceeds 10MB limit`); continue }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { errors.push(`${file.name} is not a valid image or video`); continue }
    validFiles.push(file)
  }
  if (errors.length > 0) alert(`⚠️ Some files were skipped:\n${errors.join('\n')}`)
  if (validFiles.length > 0) {
    validFiles.forEach(file => {
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      const blobUrl = URL.createObjectURL(file)
      mediaItems.value.push({ url: blobUrl, type: type, isNew: true, file: file })
    })
  }
}

const getLocation = () => {
  if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
  newPostLocation.value = '📍 Getting location...'
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, { headers: { 'User-Agent': 'CulturalCulinaryAtlas/1.0' } })
        const data = await res.json()
        newPostLocation.value = data.address?.city || data.address?.town || data.address?.village || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      } catch { newPostLocation.value = `📍 ${latitude.toFixed(2)}, ${longitude.toFixed(2)}` }
    },
    () => { newPostLocation.value = ''; alert("Unable to get location. Type manually!") },
    { enableHighAccuracy: false, timeout: 5000 }
  )
}

let draftTimer = null
watch([newPostContent, newPostTitle, newPostTags, newPostLocation, newPostMood, postPrivacy], () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    if (!isEditMode.value && (newPostContent.value.trim() || newPostTitle.value.trim())) {
      localStorage.setItem('postDraft', JSON.stringify({
        title: newPostTitle.value, content: newPostContent.value, tags: newPostTags.value,
        location: newPostLocation.value, mood: newPostMood.value, privacy: postPrivacy.value, savedAt: Date.now()
      }))
    }
  }, DRAFT_SAVE_DELAY)
}, { deep: true })

// ✅ 修复 2：提取重置表单逻辑
function resetForm() {
  newPostTitle.value = ''
  newPostContent.value = ''
  newPostLocation.value = ''
  newPostMood.value = ''
  newPostTags.value = []
  postPrivacy.value = 'public'
  clearMedia()
}

// ✅ 修复 3：提取加载帖子数据逻辑
async function loadPostData(editId) {
  isEditMode.value = true
  editingPostId.value = editId
  
  // 彻底重置表单，防止上一个帖子的数据残留
  resetForm() 
  
  try {
    // ✅ 加上时间戳 ?t=... 彻底杜绝浏览器缓存
    const res = await fetch(`/api/posts/${editId}?t=${Date.now()}`)
    if (res.ok) {
      const post = await res.json()
      newPostTitle.value = post.title || ''
      newPostContent.value = post.content || ''
      newPostTags.value = post.tags || []
      newPostLocation.value = post.location || ''
      newPostMood.value = post.mood || ''
      postPrivacy.value = post.privacy || 'public'
      
      // 兼容旧数据格式填充媒体
      if (post.images && Array.isArray(post.images) && post.images.length > 0) {
        post.images.forEach(img => {
          const imgUrl = typeof img === 'string' ? img : img.url;
          if (imgUrl) {
            mediaItems.value.push({ url: imgUrl, type: 'image', isNew: false })
          }
        })
      } else if (post.image) {
        mediaItems.value.push({ url: post.image, type: 'image', isNew: false })
      }

      if (post.videoUrl) {
        mediaItems.value.push({ url: post.videoUrl, type: 'video', isNew: false })
      }
    } else {
      throw new Error('Post not found')
    }
  } catch (err) {
    console.error("Failed to load post for editing", err)
    alert("Failed to load post data.")
    router.push('/community')
  }
}

// ✅ 修复 4：统一的页面初始化函数
async function initializePage() {
  const editId = route.query.edit
  if (editId) {
    await loadPostData(editId)
  } else {
    isEditMode.value = false
    editingPostId.value = null
    resetForm() // 创建模式下也重置
    
    // 恢复草稿
    const draft = localStorage.getItem('postDraft')
    if (draft && confirm('📝 Restore saved draft?')) {
      try {
        const d = JSON.parse(draft)
        newPostTitle.value = d.title || ''; newPostContent.value = d.content || ''
        newPostTags.value = d.tags || []; newPostLocation.value = d.location || ''
        newPostMood.value = d.mood || ''; postPrivacy.value = d.privacy || 'public'
      } catch { localStorage.removeItem('postDraft') }
    }
  }
}

onMounted(async () => {
  await initializePage()
})

// ✅ 修复 5：核心！处理 keep-alive 缓存导致的组件复用问题
onActivated(async () => {
  await initializePage()
})

onUnmounted(() => { if (draftTimer) clearTimeout(draftTimer); clearMedia() })
function clearDraft() { localStorage.removeItem('postDraft') }

const submitPost = async () => {
  if (!isValid.value) return
  loading.value = true
  try {
    let imageUrl = null, videoUrl = null, imagesArray = [] 
    
    for (const item of mediaItems.value) {
      let finalUrl = item.url
      if (item.isNew && item.file) {
        const formData = new FormData()
        formData.append('file', item.file)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
        const uploadData = await uploadRes.json()
        finalUrl = uploadData.files?.[0]?.url
        if (!finalUrl) throw new Error("Server did not return a valid file URL")
      }
      
      if (!finalUrl) continue 

      if (item.type === 'video') {
        if (!videoUrl) videoUrl = finalUrl
      } else {
        if (!imageUrl) imageUrl = finalUrl
        imagesArray.push({ url: finalUrl, caption: '', order: imagesArray.length })
      }
    }

    const postData = {
      authorId: localStorage.getItem('userId'), author: userName.value,
      title: newPostTitle.value.trim() || 'Untitled', content: newPostContent.value.trim(),
      location: newPostLocation.value, mood: newPostMood.value, tags: newPostTags.value,
      privacy: postPrivacy.value, image: imageUrl, images: imagesArray, videoUrl: videoUrl,
      mediaType: videoUrl ? 'video' : (imagesArray.length > 1 ? 'gallery' : 'image'),
      updatedAt: new Date().toISOString()
    }
    
    let res
    if (isEditMode.value && editingPostId.value) {
      res = await fetch(`/api/posts/${editingPostId.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Id": localStorage.getItem('userId') },
        body: JSON.stringify(postData)
      })
    } else {
      res = await fetch('/api/posts', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      })
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Operation failed")
    }
    
    if (!isEditMode.value) clearDraft()
    clearMedia()
    
    localStorage.setItem('communityNeedsRefresh', 'true')
    
    alert(isEditMode.value ? "✅ Post updated successfully!" : "🎉 Posted! Your food story is live! ✨")
    router.push('/community')
    
  } catch (err) {
    console.error("❌ Post error:", err)
    alert(`Failed: ${err.message}`)
  } finally { loading.value = false }
}
</script>

<style scoped>
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
  border-color: #ff5722 !important; 
  color: #ff5722 !important; 
  background: rgba(255, 87, 34, 0.04) !important; 
}

.media-dropzone { 
  border: 2px dashed rgba(0,0,0,0.15) !important; 
  background: #fcfcfc !important; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}

.media-dropzone.is-empty { 
  cursor: pointer; 
  border-color: rgba(255, 87, 34, 0.3) !important; 
  background: rgba(255, 87, 34, 0.02) !important; 
}

.media-dropzone.is-empty:hover { 
  border-color: #ff5722 !important; 
  background: rgba(255, 87, 34, 0.05) !important; 
  transform: translateY(-2px); 
  box-shadow: 0 8px 24px rgba(255, 87, 34, 0.1) !important; 
}

.media-dropzone.is-dragover { 
  border-color: #ff5722 !important; 
  background: rgba(255, 87, 34, 0.08) !important; 
  transform: scale(1.005); 
  box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.15) !important; 
}

.drop-hint { 
  border-top: 1px dashed rgba(0,0,0,0.1); 
  padding-top: 20px; 
  text-align: center; 
  color: #999; 
  transition: all 0.2s ease; 
  user-select: none; 
  pointer-events: none; 
}

.media-dropzone.is-empty .drop-hint { 
  color: #ff5722; 
  border-top-color: rgba(255, 87, 34, 0.3); 
}

.drop-hint.active { 
  color: #ff5722; 
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

.modern-select :deep(.v-field) { 
  border-radius: 10px !important; 
  border: 1px solid rgba(0, 0, 0, 0.12) !important; 
  background: #ffffff !important; 
}

.modern-select :deep(.v-field--focused) { 
  border-color: #ff5722 !important; 
}

@media (max-width: 600px) { .post-header-card { 
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
@media (prefers-color-scheme: dark) { .post-page-wrapper { 
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

  .media-dropzone { 
    background: #141414 !important; 
    border-color: rgba(255,255,255,0.1) !important; 
  } 

  .media-dropzone.is-empty { 
    background: rgba(255, 87, 34, 0.05) !important; 
  } 
}
</style>