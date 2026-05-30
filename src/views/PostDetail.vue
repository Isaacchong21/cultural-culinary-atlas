<template>
  <v-container class="py-6 px-4 px-md-8" style="max-width: 900px;">
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="orange" size="64" />
      <p class="text-grey mt-4">Loading post...</p>
    </div>

    <div v-else-if="error" class="text-center py-16">
      <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4" />
      <h3 class="text-h6 font-weight-bold mb-2">Post Not Found</h3>
      <p class="text-grey mb-4">{{ error }}</p>
      <v-btn color="orange" variant="tonal" @click="$router.back()">← Go Back</v-btn>
    </div>

    <v-card v-else-if="post" class="rounded-2xl" elevation="0">
      <v-card-item class="pa-4 d-flex justify-space-between align-center border-b-light">
        <v-btn icon="mdi-arrow-left" variant="text" size="small" @click="$router.back()" />
        <div class="d-flex align-center gap-2">
          <v-btn 
            icon 
            :color="post.saved ? 'orange' : 'grey'" 
            variant="text"
            @click="toggleSave"
            :loading="saving"
          >
            <v-icon :icon="post.saved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" />
          </v-btn>
          <v-btn icon="mdi-share-variant" variant="text" color="grey" @click="sharePost" />
        </div>
      </v-card-item>

      <v-card-text class="pa-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar size="44" class="border-thin cursor-pointer" @click="goToProfile(post.authorId)">
              <v-img :src="getSafeAvatar(post.avatar)" cover />
            </v-avatar>
            <div>
              <div class="font-weight-bold cursor-pointer hover-orange" @click="goToProfile(post.authorId)">
                {{ post.author }}
              </div>
              <div class="text-caption text-grey">
                {{ timeAgo(post.createdAt) }}
                <span v-if="post.location" class="mx-1">•</span>
                <span v-if="post.location">{{ post.location }}</span>
                <span v-if="post.mood" class="ml-1">{{ getMoodEmoji(post.mood) }}</span>
              </div>
            </div>
          </div>
          <v-chip size="small" color="orange" variant="tonal" class="font-weight-medium">
            <v-icon start size="14">mdi-food</v-icon> Foodie
          </v-chip>
        </div>
        
        <div class="mb-4">
          <h3 v-if="post.title" class="text-h6 font-weight-bold mb-2">{{ post.title }}</h3>
          <p class="text-body-1 text-grey-darken-2" style="white-space: pre-wrap; line-height: 1.6;">
            {{ post.content }}
          </p>
          <div v-if="post.tags?.length" class="d-flex flex-wrap gap-2 mt-3">
            <v-chip v-for="tag in post.tags" :key="tag" size="small" color="orange" variant="tonal" class="font-weight-medium">
              #{{ tag }}
            </v-chip>
          </div>
        </div>
        
        <div v-if="previewImages.length > 0" class="media-preview-section mb-4">
          <div v-if="post?.videoUrl" class="video-preview-wrapper">
            <video :src="post.videoUrl" class="preview-media" controls autoplay />
          </div>
          <v-carousel v-else-if="previewImages.length > 1" v-model="previewIndex" hide-delimiters height="400" class="rounded-xl overflow-hidden">
            <v-carousel-item v-for="(img, idx) in previewImages" :key="idx">
              <v-img :src="img" height="400" cover class="preview-media" />
            </v-carousel-item>
          </v-carousel>
          <v-img v-else-if="previewImages.length === 1" :src="previewImages[0]" height="400" cover class="rounded-xl preview-media" />
          <div v-if="previewImages.length > 1" class="carousel-dots mt-2">
            <span v-for="(_, idx) in previewImages" :key="idx" class="dot" :class="{ active: previewIndex === idx }" @click="previewIndex = idx" />
          </div>
        </div>
        
        <v-divider class="my-4" />
        
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-4">
            <v-btn variant="text" :color="post.liked ? 'error' : 'grey'" @click="toggleLike" class="text-none">
              <v-icon :icon="post.liked ? 'mdi-heart' : 'mdi-heart-outline'" size="24" />
              <span class="ml-1 font-weight-medium">{{ formatNumber(post.likes) }}</span>
            </v-btn>
            <v-btn variant="text" color="grey" class="text-none" @click="focusCommentInput">
              <v-icon icon="mdi-comment-outline" size="24" />
              <span class="ml-1 font-weight-medium">{{ formatNumber(post.comments) }}</span>
            </v-btn>
            <v-btn variant="text" :color="post.saved ? 'orange' : 'grey'" @click="toggleSave" class="text-none">
              <v-icon :icon="post.saved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="24" />
            </v-btn>
          </div>
          <v-btn variant="text" color="grey" @click="sharePost" class="text-none">
            <v-icon icon="mdi-share-variant" size="24" />
          </v-btn>
        </div>
        
        <div class="mb-4">
          <h4 class="text-subtitle-1 font-weight-bold mb-3">Comments ({{ post.commentsList?.length || 0 }})</h4>
          <div class="d-flex align-start gap-3 mb-4">
            <v-avatar size="36" class="border-thin">
              <v-img :src="getSafeAvatar(userAvatar)" cover />
            </v-avatar>
            <div class="flex-grow-1">
              <v-textarea v-model="newCommentText" placeholder="Write a comment..." variant="outlined" density="comfortable" rows="2" auto-grow class="comment-input" rounded="xl" hide-details />
              <div class="d-flex justify-end mt-2">
                <v-btn size="small" variant="flat" color="orange" :disabled="!newCommentText.trim() || submittingComment" @click="submitComment" class="text-none">
                  {{ submittingComment ? 'Sending...' : 'Send' }}
                </v-btn>
              </div>
            </div>
          </div>
          <div v-if="post.commentsList?.length" class="comments-list">
            <div v-for="(comment, i) in post.commentsList" :key="i" class="mb-3">
              <div class="d-flex align-start gap-3">
                <v-avatar size="36" color="grey-lighten-3">
                  <v-img :src="comment.avatar || DefaultAvatar" cover />
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="bg-grey-lighten-4 pa-3 rounded-xl rounded-tl-none">
                    <div class="d-flex align-center justify-space-between mb-1">
                      <span class="text-caption font-weight-bold">{{ comment.author }}</span>
                      <span class="text-caption text-grey">{{ timeAgo(comment.createdAt) }}</span>
                    </div>
                    <p class="text-body-2 mb-0">{{ comment.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-grey py-4">
            <v-icon icon="mdi-comment-question-outline" size="32" color="grey-lighten-2" class="mb-2" />
            <p class="text-caption">No comments yet. Be the first to share your thoughts! 🍴</p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultAvatar from "@/assets/default-profile.jpg"

const route = useRoute()
const router = useRouter()

const post = ref(null)
const loading = ref(true)
const error = ref(null)
const newCommentText = ref('')
const submittingComment = ref(false)
const saving = ref(false)
const userAvatar = ref(localStorage.getItem('userAvatar') || '')
const previewImages = ref([])
const previewIndex = ref(0)

function getAuthorId(authorId) {
  if (!authorId) return ''
  if (typeof authorId === 'string') return authorId
  if (typeof authorId === 'object' && authorId !== null) {
    return authorId._id || String(authorId)
  }
  return String(authorId)
}

function hasMedia(p) { return p?.videoUrl || p?.image || p?.images?.length > 0 }
function getImageUrl(img) { return typeof img === 'string' ? img : img.url }
function getPostImages(p) {
  if (p?.images?.length) return p.images.sort((a, b) => (a.order || 0) - (b.order || 0))
  if (p?.image) return [{ url: p.image }]
  return []
}
function getFirstImage(p) {
  const images = getPostImages(p)
  return images[0]?.url || images[0] || ''
}
function getMediaCount(p) { if (p?.videoUrl) return 1; return getPostImages(p).length }
function getPostThumb(url) { if (!url) return ''; if (url.includes('unsplash.com')) return url + '?w=400&q=80'; return url }
function formatDuration(seconds) { if (!seconds) return ''; const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2, '0')}` }

function getSafeAvatar(avatar) {
  if (!avatar || avatar === "null" || avatar.trim() === "") return DefaultAvatar
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
  // ✅ 返回相对路径
  return avatar.startsWith('/') ? avatar : '/' + avatar
}

function formatContent(content) { return content?.replace(/(#\w+)/g, '<span class="hashtag">#$1</span>') || '' }
function formatNumber(num) { if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; if (num >= 1000) return (num / 1000).toFixed(1) + 'K'; return num }
function timeAgo(dateString) {
  const now = new Date(); const past = new Date(dateString); const diff = Math.floor((now - past) / 1000)
  if (diff < 60) return 'just now'; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`; return new Date(dateString).toLocaleDateString()
}
function getMoodEmoji(mood) {
  const moodEmojis = { 'delicious': '😋', 'amazing': '😍', 'excited': '🤩', 'cool': '😎', 'celebrating': '🥳' }; return moodEmojis[mood] || ''
}

function goToProfile(authorId) {
  const profileId = getAuthorId(authorId)
  if (!profileId) return
  router.push(`/profile/${profileId}`)
}

function focusCommentInput() {
  const commentSection = document.querySelector('.comments-list')
  if (commentSection) commentSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(async () => {
  const postId = route.params.id
  if (!postId) { error.value = 'Post ID is required'; loading.value = false; return }

  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${postId}`)
    if (!res.ok) throw new Error('Post not found')
    
    const data = await res.json()
    const currentUserId = localStorage.getItem('userId')
    
    let authorIdStr = data.authorId
    if (typeof data.authorId === 'object' && data.authorId !== null) {
      authorIdStr = data.authorId._id || String(data.authorId)
    }
    
    post.value = {
      ...data,
      authorId: authorIdStr,
      _id: data._id || data.id,
      saved: data.savedBy?.some(id => String(id) === String(currentUserId)) || false,
      commentsList: data.commentsList || [],
      previewImages: getPostImages(data).map(img => getImageUrl(img))
    }
    
    previewImages.value = getPostImages(post.value).map(img => getImageUrl(img))
    previewIndex.value = 0
    
  } catch (err) {
    console.error('Failed to load post:', err)
    error.value = err.message || 'Failed to load post'
  } finally {
    loading.value = false
  }
})

async function toggleLike() {
  if (!post.value?._id) return
  const original = post.value.liked
  post.value.liked = !post.value.liked
  post.value.likes += post.value.liked ? 1 : -1

  try {
    // ✅ 使用相对路径
    await fetch(`/api/posts/${post.value._id}/like`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        liked: post.value.liked,
        likerId: localStorage.getItem('userId'),
        likerName: localStorage.getItem('userName')
      })
    })
  } catch (err) {
    post.value.liked = original
    post.value.likes += post.value.liked ? 1 : -1
    console.error('Failed to like:', err)
  }
}

async function toggleSave() {
  if (!post.value?._id) return
  const originalState = post.value.saved
  post.value.saved = !post.value.saved
  
  try {
    const method = post.value.saved ? 'POST' : 'DELETE'
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${post.value._id}/save`, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'X-User-Id': localStorage.getItem('userId') }
    })

    if (!res.ok) { post.value.saved = originalState; throw new Error('Failed to save post') }
  } catch (err) {
    console.error('Failed to toggle save:', err)
    post.value.saved = originalState
  } 
}

async function submitComment() {
  if (!newCommentText.value.trim() || !post.value?._id) return
  submittingComment.value = true
  
  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${post.value._id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        author: localStorage.getItem('userName') || 'Foodie', 
        text: newCommentText.value,
        avatar: userAvatar.value
      })
    })

    if (!res.ok) throw new Error("Failed to add comment")
    const updatedPost = await res.json()
    post.value.commentsList = updatedPost.commentsList
    post.value.comments = updatedPost.comments
    newCommentText.value = ''
  } catch (err) {
    console.error("Error submitting comment:", err)
    alert("Failed to post comment")
  } finally {
    submittingComment.value = false
  }
}

async function sharePost() {
  if (!post.value?._id) return
  const url = `${window.location.origin}/post/${post.value._id}`
  if (navigator.share) {
    await navigator.share({ title: post.value?.title, text: post.value?.content, url })
  } else {
    await navigator.clipboard.writeText(url)
    alert('Link copied!')
  }
}
</script>

<style scoped>
.border-b-light { border-bottom: 1px solid rgba(0,0,0,0.04) !important; }
.border-thin { border: 2px solid rgba(0,0,0,0.08); }
.cursor-pointer { cursor: pointer; }
.hover-orange:hover { color: #ff5722 !important; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }

.media-preview-section { background: #000; border-radius: 12px; overflow: hidden; }
.preview-media { width: 100%; object-fit: contain; background: #000; max-height: 400px; }
.video-preview-wrapper { position: relative; }

.carousel-dots { display: flex; justify-content: center; gap: 6px; padding: 8px 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s ease; }
.dot.active { background: white; transform: scale(1.2); }

.comment-input :deep(.v-field) { border-radius: 16px !important; background: #f8f9fa !important; border: 2px solid rgba(0,0,0,0.06) !important; }
.comment-input :deep(.v-field--focused) { border-color: #ff5722 !important; box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1) !important; }

.comments-list { 
  max-height: 400px; 
  overflow-y: auto; 
  padding-right: 8px; 
}

.comments-list::-webkit-scrollbar { 
  width: 6px; 
}

.comments-list::-webkit-scrollbar-track { 
  background: #f1f1f1; 
  border-radius: 10px; 
}

.comments-list::-webkit-scrollbar-thumb { 
  background: #c1c1c1; 
  border-radius: 10px; 
}

.comments-list::-webkit-scrollbar-thumb:hover { 
  background: #a8a8a8; 
}

@media (prefers-color-scheme: dark) {
  .comment-input :deep(.v-field) { 
    background: #2a2a4a !important; border-color: rgba(255,255,255,0.1) !important; 
  }

  .comments-list::-webkit-scrollbar-track { 
    background: #1e1e2e; 
  }

  .comments-list::-webkit-scrollbar-thumb { 
    background: #4a4a6a; 
  }
}

@media (max-width: 600px) {
  .preview-media { 
    height: 300px !important; 
  }

  .comments-list { 
    max-height: 300px; 
  }
}
</style>