<template>
  <v-container class="py-6 px-4 px-md-8 max-width-1400">
    <!-- ✅ 顶部发布入口 -->
    <v-card 
      class="mb-6 create-post-card rounded-2xl"
      elevation="0"
      @click="$router.push('/post')"
      hover
    >
      <v-card-item class="pa-4">
        <div class="d-flex align-center gap-4">
          <v-avatar size="48" color="orange-lighten-4" class="border-thin">
            <v-img :src="userAvatar || DefaultAvatar" cover />
          </v-avatar>
          
          <v-text-field
            placeholder="🍜 What delicious food did you eat today? Share your culinary adventure!"
            readonly
            variant="outlined"
            density="comfortable"
            rounded="pill"
            bg-color="grey-lighten-5"
            class="flex-grow-1"
            hide-details
          >
            <template #prepend-inner>
              <v-icon icon="mdi-image-plus" color="orange" />
            </template>
          </v-text-field>
          
          <v-btn 
            color="orange" 
            variant="tonal" 
            rounded="pill"
            class="text-none font-weight-bold"
          >
            Post
          </v-btn>
        </div>
      </v-card-item>
    </v-card>

    <!-- ✅ 筛选/排序栏 -->
    <v-card class="mb-6 rounded-xl" elevation="0">
      <v-card-item class="py-3">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <!-- 筛选标签 -->
          <div class="d-flex gap-2 flex-wrap">
            <v-chip
              v-for="filter in filters"
              :key="filter.value"
              :color="activeFilter === filter.value ? 'orange' : 'grey'"
              :variant="activeFilter === filter.value ? 'tonal' : 'outlined'"
              size="small"
              @click="activeFilter = filter.value"
              class="cursor-pointer filter-chip"
            >
              <v-icon start :icon="filter.icon" size="18" />
              {{ filter.label }}
            </v-chip>
          </div>
          
          <!-- 排序 + 刷新 -->
          <div class="d-flex align-center gap-2">
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              color="grey-darken-1"
              @click="refreshPosts"
              :loading="refreshing"
            />
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="min-width-120"
            />
          </div>
        </div>
      </v-card-item>
    </v-card>

    <!-- ✅ 网格布局帖子列表 -->
    <v-row v-if="!loading && posts.length > 0" class="posts-grid">
      <v-col 
        v-for="post in displayedPosts" 
        :key="post._id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="mb-6"
      >
        <!-- ✅ 整个卡片可点击，但内部链接和按钮需阻止冒泡 -->
        <v-card 
          class="post-card h-100 cursor-pointer"
          elevation="0"
          hover
          @click="openImagePreview(post)"
        >
          <!-- 作者区域：点击头像/名字跳转主页，不打开详情 -->
          <v-card-item class="pa-3 border-b-light">
            <div class="d-flex align-center gap-2">
              <!-- ✅ 修复：确保 authorId 是字符串 -->
              <router-link 
                :to="`/profile/${getAuthorId(post.authorId)}`" 
                @click.stop
              >
                <v-avatar size="32" class="author-avatar border-thin">
                  <v-img :src="getSafeAvatar(post.avatar)" cover />
                </v-avatar>
              </router-link>
              
              <div class="flex-grow-1 min-width-0">
                <router-link 
                  :to="`/profile/${getAuthorId(post.authorId)}`" 
                  class="author-name text-truncate d-block"
                  @click.stop
                >
                  {{ post.author }}
                </router-link>
                <div class="post-meta text-caption text-grey">
                  {{ timeAgo(post.createdAt) }}
                  <span v-if="post.mood" class="ml-1">{{ getMoodEmoji(post.mood) }}</span>
                </div>
              </div>
            </div>
          </v-card-item>

          <!-- 内容区域：点击任意处打开详情 -->
          <v-card-text class="pt-2 px-3 pb-2">
            <h3 v-if="post.title" class="post-title text-truncate">{{ post.title }}</h3>
            <p 
              class="post-content compact-content"
              v-html="formatContent(post.content)"
            />
            
            <!-- 话题标签 -->
            <div v-if="post.tags?.length" class="tags-container mt-2">
              <v-chip
                v-for="tag in post.tags.slice(0, 2)"
                :key="tag"
                size="x-small"
                color="orange"
                variant="plain"
                class="tag-chip"
              >
                #{{ tag }}
              </v-chip>
              <v-chip 
                v-if="post.tags.length > 2" 
                size="x-small" 
                variant="plain"
              >
                +{{ post.tags.length - 2 }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- ✅ 媒体区域 -->
          <div v-if="hasMedia(post)" class="media-section">
            
            <!-- 🎬 视频优先显示 -->
            <div v-if="post.videoUrl" class="video-wrapper" @click.stop="!isPlayingMap[post._id] && toggleVideoPlay(post._id)">
              <video
                :data-post-id="post._id"
                :src="post.videoUrl"
                :poster="post.videoThumbnail || getPostThumb(getFirstImage(post))"
                class="post-video"
                preload="metadata"
                @play="isPlayingMap[post._id] = true"
                @pause="isPlayingMap[post._id] = false"
              />
              <!-- 播放按钮遮罩 -->
              <div v-if="!isPlayingMap[post._id]" class="video-play-overlay">
                <v-icon icon="mdi-play-circle" size="64" color="white" class="play-icon" />
              </div>
              <!-- 时长标签 -->
              <div v-if="post.duration" class="video-duration">
                {{ formatDuration(post.duration) }}
              </div>
            </div>
            
            <!-- 🖼️ 图片区域 -->
            <div v-else-if="getPostImages(post).length > 0" class="image-gallery">
              
              <!-- 单张图片 -->
              <div v-if="getMediaCount(post) === 1" class="image-wrapper">
                <v-img
                  :src="getFirstImage(post)"
                  :lazy-src="getPostThumb(getFirstImage(post))"
                  height="200"
                  class="post-image"
                  cover
                />
              </div>
              
              <!-- 多图网格（2-4 张） -->
              <div v-else-if="getMediaCount(post) <= 4" class="image-grid" :class="`grid-${getMediaCount(post)}`">
                <div 
                  v-for="(img, idx) in getPostImages(post).slice(0, 4)" 
                  :key="idx"
                  class="grid-item"
                >
                  <v-img
                    :src="getImageUrl(img)"
                    :lazy-src="getPostThumb(getImageUrl(img))"
                    height="200"
                    cover
                    class="grid-image"
                  />
                  <!-- 更多指示器 -->
                  <div v-if="idx === 3 && getMediaCount(post) > 4" class="more-indicator">
                    +{{ getMediaCount(post) - 4 }}
                  </div>
                </div>
              </div>
              
              <!-- 多图轮播（5 张以上） -->
              <div v-else class="image-carousel">
                <v-carousel
                  v-model="carouselModels[post._id]"
                  hide-delimiters
                  height="200"
                  class="carousel-wrapper"
                >
                  <v-carousel-item 
                    v-for="(img, idx) in getPostImages(post)" 
                    :key="idx"
                  >
                    <v-img
                      :src="getImageUrl(img)"
                      :lazy-src="getPostThumb(getImageUrl(img))"
                      height="200"
                      cover
                    />
                  </v-carousel-item>
                </v-carousel>
                <!-- 轮播指示器 -->
                <div class="carousel-indicators">
                  <span 
                    v-for="(_, idx) in getPostImages(post).slice(0, 5)" 
                    :key="idx"
                    class="indicator-dot"
                    :class="{ active: carouselModels[post._id] === idx }"
                  />
                  <span v-if="getPostImages(post).length > 5" class="indicator-more">
                    +{{ getPostImages(post).length - 5 }}
                  </span>
                </div>
              </div>
              
            </div>
            
          </div>

          <!-- ✅ 互动区域：按钮点击阻止冒泡，避免触发卡片点击 -->
          <v-card-actions class="px-3 py-2 border-t-light">
            <div class="d-flex align-center justify-space-between w-100">
              <v-btn 
                variant="text" 
                :color="post.liked ? 'error' : 'grey'"
                @click.stop="toggleLike(post)"
                class="action-btn"
                size="x-small"
              >
                <v-icon 
                  :icon="post.liked ? 'mdi-heart' : 'mdi-heart-outline'" 
                  :class="{ 'heart-pop': post.justLiked }"
                  size="18"
                />
                <span class="ml-1 action-count">{{ formatNumber(post.likes) }}</span>
              </v-btn>
              
              <v-btn 
                variant="text" 
                color="grey"
                @click.stop="openCommentDialog(post)"
                class="action-btn"
                size="x-small"
              >
                <v-icon icon="mdi-comment-outline" size="18" />
                <span class="ml-1 action-count">{{ formatNumber(post.comments) }}</span>
              </v-btn>
              
              <v-btn 
                variant="text" 
                :color="post.saved ? 'orange' : 'grey'"
                @click.stop="toggleSave(post)"
                class="action-btn"
                size="x-small"
              >
                <v-icon :icon="post.saved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="18" />
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <div v-else-if="!loading && posts.length === 0" class="text-center py-16 empty-state">
      <v-icon icon="mdi-food-off" size="80" color="grey-lighten-2" class="mb-4" />
      <h3 class="text-h6 font-weight-bold mb-2">No posts yet</h3>
      <p class="text-grey mb-6">Be the first to share your food journey!</p>
      <v-btn color="orange" variant="tonal" @click="$router.push('/post')">
        <v-icon start>mdi-plus</v-icon>
        Create First Post
      </v-btn>
    </div>

    <v-row v-if="loading" class="posts-grid">
      <v-col 
        v-for="i in 6" 
        :key="i"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="mb-6"
      >
        <v-skeleton-loader 
          type="article" 
          class="post-card h-100 rounded-2xl"
          height="400"
        />
      </v-col>
    </v-row>

    <div v-if="hasMore && !loading" class="text-center py-4">
      <v-btn 
        v-if="!loadingMore"
        variant="text" 
        color="orange"
        @click="loadMorePosts"
        class="text-none"
      >
        Load more delicious posts ✨
      </v-btn>
      <v-progress-circular v-else indeterminate color="orange" size="32" />
    </div>

    <!-- ✅ 优化版：完整帖子详情弹窗 -->
    <v-dialog 
      v-model="imagePreview" 
      max-width="95vw" 
      max-height="95vh"
      scrollable
      @keydown="handlePreviewKeydown"
    >
      <v-card class="rounded-2xl post-detail-dialog">
        
        <!-- 顶部工具栏 -->
        <v-card-item class="pa-3 d-flex justify-space-between align-center border-b-light">
          <div class="d-flex align-center gap-2">
            <v-btn 
              icon="mdi-arrow-left" 
              variant="text" 
              size="small"
              @click="imagePreview = false"
            />
            <span class="text-caption text-grey">Post Details</span>
          </div>
          
          <div class="d-flex align-center gap-1">
            <span v-if="previewImages.length > 1" class="text-caption text-grey mr-2">
              {{ previewIndex + 1 }} / {{ previewImages.length }}
            </span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="imagePreview = false" />
          </div>
        </v-card-item>
        
        <!-- 内容区域 -->
        <v-card-text class="pa-0">
          <v-container class="py-4">
            
            <!-- 作者信息 -->
            <div v-if="previewPost" class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-3">
                <!-- ✅ 修复：确保 authorId 是字符串 -->
                <v-avatar size="44" class="border-thin cursor-pointer" @click="goToProfile(previewPost.authorId)">
                  <v-img :src="getSafeAvatar(previewPost.avatar)" cover />
                </v-avatar>
                <div>
                  <div 
                    class="font-weight-bold cursor-pointer hover-orange"
                    @click="goToProfile(previewPost.authorId)"
                  >
                    {{ previewPost.author }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ timeAgo(previewPost.createdAt) }}
                    <span v-if="previewPost.location" class="mx-1">•</span>
                    <span v-if="previewPost.location">{{ previewPost.location }}</span>
                    <span v-if="previewPost.mood" class="ml-1">{{ getMoodEmoji(previewPost.mood) }}</span>
                  </div>
                </div>
              </div>
              
              <v-chip size="small" color="orange" variant="tonal" class="font-weight-medium">
                <v-icon start size="14">mdi-food</v-icon>
                Foodie
              </v-chip>
            </div>
            
            <!-- 完整标题 + 内容 -->
            <div v-if="previewPost" class="mb-4">
              <h3 v-if="previewPost.title" class="text-h6 font-weight-bold mb-2">
                {{ previewPost.title }}
              </h3>
              <p class="text-body-1 text-grey-darken-2" style="white-space: pre-wrap; line-height: 1.6;">
                {{ previewPost.content }}
              </p>
              
              <!-- 完整话题标签 -->
              <div v-if="previewPost.tags?.length" class="d-flex flex-wrap gap-2 mt-3">
                <v-chip
                  v-for="tag in previewPost.tags"
                  :key="tag"
                  size="small"
                  color="orange"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  #{{ tag }}
                </v-chip>
              </div>
            </div>
            
            <!-- 媒体区域 -->
            <div v-if="previewImages.length > 0" class="media-preview-section mb-4">
              
              <!-- 视频 -->
              <div v-if="previewPost?.videoUrl" class="video-preview-wrapper">
                <video
                  :src="previewPost.videoUrl"
                  class="preview-media"
                  controls
                  autoplay
                />
              </div>
              
              <!-- 图片轮播 -->
              <v-carousel
                v-else-if="previewImages.length > 1"
                v-model="previewIndex"
                hide-delimiters
                height="400"
                class="rounded-xl overflow-hidden"
              >
                <v-carousel-item 
                  v-for="(img, idx) in previewImages" 
                  :key="idx"
                >
                  <v-img
                    :src="img"
                    height="400"
                    cover
                    class="preview-media"
                  />
                </v-carousel-item>
              </v-carousel>
              
              <!-- 单张图片 -->
              <v-img
                v-else-if="previewImages.length === 1"
                :src="previewImages[0]"
                height="400"
                cover
                class="rounded-xl preview-media"
              />
              
              <!-- 轮播指示器 -->
              <div v-if="previewImages.length > 1" class="carousel-dots mt-2">
                <span 
                  v-for="(_, idx) in previewImages" 
                  :key="idx"
                  class="dot"
                  :class="{ active: previewIndex === idx }"
                  @click="previewIndex = idx"
                />
              </div>
            </div>
            
            <!-- 互动区域 -->
            <v-divider class="my-4" />
            
            <div v-if="previewPost" class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center gap-4">
                <v-btn 
                  variant="text" 
                  :color="previewPost.liked ? 'error' : 'grey'"
                  @click="toggleLike(previewPost)"
                  class="text-none"
                >
                  <v-icon 
                    :icon="previewPost.liked ? 'mdi-heart' : 'mdi-heart-outline'" 
                    size="24"
                  />
                  <span class="ml-1 font-weight-medium">{{ formatNumber(previewPost.likes) }}</span>
                </v-btn>
                
                <v-btn 
                  variant="text" 
                  color="grey"
                  class="text-none"
                  @click="focusCommentInput"
                >
                  <v-icon icon="mdi-comment-outline" size="24" />
                  <span class="ml-1 font-weight-medium">{{ formatNumber(previewPost.comments) }}</span>
                </v-btn>
                
                <v-btn 
                  variant="text" 
                  :color="previewPost.saved ? 'orange' : 'grey'"
                  @click="toggleSave(previewPost)"
                  class="text-none"
                >
                  <v-icon :icon="previewPost.saved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="24" />
                </v-btn>
              </div>
              
              <v-btn 
                variant="text" 
                color="grey"
                @click="sharePost(previewPost)"
                class="text-none"
              >
                <v-icon icon="mdi-share-variant" size="24" />
              </v-btn>
            </div>
            
            <!-- 评论区 -->
            <div v-if="previewPost" class="mb-4">
              <h4 class="text-subtitle-1 font-weight-bold mb-3">
                Comments ({{ previewPost.commentsList?.length || 0 }})
              </h4>
              
              <!-- 评论输入框 -->
              <div class="d-flex align-start gap-3 mb-4">
                <v-avatar size="36" class="border-thin">
                  <v-img :src="getSafeAvatar(userAvatar)" cover />
                </v-avatar>
                <div class="flex-grow-1">
                  <v-textarea
                    v-model="newCommentText"
                    placeholder="Write a comment... (try #foodie)"
                    variant="outlined"
                    density="comfortable"
                    rows="2"
                    auto-grow
                    class="comment-input"
                    rounded="xl"
                    hide-details
                  />
                  <div class="d-flex justify-end mt-2">
                    <v-btn 
                      size="small" 
                      variant="flat" 
                      color="orange"
                      :disabled="!newCommentText.trim() || submittingComment"
                      @click="submitCommentFromDialog"
                      class="text-none"
                    >
                      {{ submittingComment ? 'Sending...' : 'Send' }}
                    </v-btn>
                  </div>
                </div>
              </div>
              
              <!-- 评论列表 -->
              <div v-if="previewPost.commentsList?.length" class="comments-list">
                <div 
                  v-for="(comment, i) in previewPost.commentsList" 
                  :key="i" 
                  class="mb-3"
                >
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
              
              <!-- 无评论提示 -->
              <div v-else class="text-center text-grey py-4">
                <v-icon icon="mdi-comment-question-outline" size="32" color="grey-lighten-2" class="mb-2" />
                <p class="text-caption">No comments yet. Be the first to share your thoughts! 🍴</p>
              </div>
            </div>
            
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ✅ 独立评论弹窗（保留用于列表页快速评论） -->
    <v-dialog v-model="commentDialog" max-width="600" persistent scrollable>
      <v-card class="rounded-2xl">
        <v-card-item class="pa-4 border-b">
          <div class="d-flex align-center justify-space-between">
            <span class="text-h6 font-weight-bold">Comments</span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="commentDialog = false" />
          </div>
        </v-card-item>
        
        <v-card-text class="pa-4" style="min-height: 300px;">
          <div v-if="!currentPost?.commentsList?.length" class="text-center text-grey py-8">
            <v-icon icon="mdi-comment-question-outline" size="48" color="grey-lighten-2" class="mb-3" />
            <p>No comments yet. Be the first to share your thoughts! 🍴</p>
          </div>
          
          <div v-else v-for="(comment, i) in currentPost?.commentsList" :key="i" class="mb-4">
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
                <v-btn 
                  size="x-small" 
                  variant="text" 
                  color="grey-darken-1"
                  class="ml-9 mt-1 text-none"
                  @click="replyToComment(comment)"
                >
                  Reply
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 border-t bg-grey-lighten-5">
          <v-avatar size="32" color="orange-lighten-4" class="mr-3">
            <v-img :src="userAvatar || DefaultAvatar" cover />
          </v-avatar>
          <v-text-field
            v-model="currentPost.newComment"
            placeholder="Write a comment... (try #foodie)"
            density="compact"
            variant="outlined"
            rounded="pill"
            hide-details
            @keyup.enter="submitComment"
          >
            <template #append-inner>
              <v-btn 
                size="small" 
                variant="flat" 
                color="orange"
                :disabled="!currentPost?.newComment?.trim()"
                @click="submitComment"
                class="text-none"
              >
                Post
              </v-btn>
            </template>
          </v-text-field>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DefaultAvatar from "@/assets/default-profile.jpg"

const router = useRouter()
const posts = ref([])
const commentDialog = ref(false)
const currentPost = ref(null)
const imagePreview = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)
const previewPost = ref(null)
const newCommentText = ref('')
const submittingComment = ref(false)
const refreshing = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const userAvatar = ref(localStorage.getItem('userAvatar') || '')

// 媒体相关状态
const carouselModels = ref({})
const isPlayingMap = ref({})

// 筛选 & 排序
const activeFilter = ref('all')
const sortBy = ref('newest')
const filters = [
  { label: 'All', value: 'all', icon: 'mdi-grid' },
  { label: 'Images', value: 'images', icon: 'mdi-image' },
  { label: 'Videos', value: 'videos', icon: 'mdi-video' },
  { label: 'Popular', value: 'popular', icon: 'mdi-fire' },
]
const sortOptions = [
  { title: 'Newest', value: 'newest' },
  { title: 'Most Liked', value: 'likes' },
  { title: 'Most Commented', value: 'comments' },
]

// 心情表情映射
const moodEmojis = {
  'delicious': '😋',
  'amazing': '😍',
  'excited': '🤩',
  'cool': '😎',
  'celebrating': '🥳'
}

// ✅ 辅助函数：确保 authorId 始终是字符串
function getAuthorId(authorId) {
  if (!authorId) return ''
  if (typeof authorId === 'string') return authorId
  if (typeof authorId === 'object' && authorId !== null) {
    return authorId._id || String(authorId)
  }
  return String(authorId)
}

// 计算属性：过滤 + 排序后的帖子
const displayedPosts = computed(() => {
  const currentUserId = localStorage.getItem('userId')
  
  let list = [...posts.value].filter(post => {
    if (post.status === 'rejected') return false
    if (post.privacy === 'public') return true
    if (post.privacy === 'private') return getAuthorId(post.authorId) === currentUserId
    if (post.privacy === 'followers') return true
    return true
  })

  if (activeFilter.value === 'images') {
    list = list.filter(p => hasMedia(p) && !p.videoUrl)
  } else if (activeFilter.value === 'videos') {
    list = list.filter(p => p.videoUrl)
  } else if (activeFilter.value === 'popular') {
    list = list.filter(p => p.likes >= 10)
  }

  if (sortBy.value === 'likes') {
    list.sort((a, b) => b.likes - a.likes)
  } else if (sortBy.value === 'comments') {
    list.sort((a, b) => (b.comments || 0) - (a.comments || 0))
  } else {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  
  return list
})

// ✅ 媒体辅助函数
function hasMedia(post) {
  return post.videoUrl || post.image || post.images?.length > 0
}

function getImageUrl(img) {
  return typeof img === 'string' ? img : img.url
}

function getPostImages(post) {
  if (post.images?.length) {
    return post.images.sort((a, b) => (a.order || 0) - (b.order || 0))
  }
  if (post.image) {
    return [{ url: post.image }]
  }
  return []
}

function getFirstImage(post) {
  const images = getPostImages(post)
  return images[0]?.url || images[0] || ''
}

function getMediaCount(post) {
  if (post.videoUrl) return 1
  return getPostImages(post).length
}

function getPostThumb(url) {
  if (!url) return ''
  if (url.includes('unsplash.com')) {
    return url + '?w=400&q=80'
  }
  return url
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function toggleVideoPlay(postId) {
  const video = document.querySelector(`video[data-post-id="${postId}"]`)
  if (!video) return
  
  if (video.paused) {
    document.querySelectorAll('video').forEach(v => {
      if (v !== video && v.dataset.postId) {
        v.pause()
        isPlayingMap.value[v.dataset.postId] = false
      }
    })
    video.play()
  } else {
    video.pause()
  }
}

// ✅ 打开帖子详情弹窗
function openImagePreview(post) {
  previewPost.value = post
  previewImages.value = getPostImages(post).map(img => getImageUrl(img))
  previewIndex.value = 0
  newCommentText.value = ''
  imagePreview.value = true
}

function nextPreviewImage() {
  previewIndex.value = (previewIndex.value + 1) % previewImages.value.length
}

function prevPreviewImage() {
  previewIndex.value = (previewIndex.value - 1 + previewImages.value.length) % previewImages.value.length
}

function handlePreviewKeydown(e) {
  if (!imagePreview.value) return
  if (e.key === 'ArrowRight' && previewImages.value.length > 1) {
    previewIndex.value = (previewIndex.value + 1) % previewImages.value.length
  }
  if (e.key === 'ArrowLeft' && previewImages.value.length > 1) {
    previewIndex.value = (previewIndex.value - 1 + previewImages.value.length) % previewImages.value.length
  }
  if (e.key === 'Escape') imagePreview.value = false
}

function focusCommentInput() {
  const commentSection = document.querySelector('.comments-list')
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ✅ 从弹窗提交评论（使用相对路径）
async function submitCommentFromDialog() {
  if (!newCommentText.value.trim() || !previewPost.value) return
  
  submittingComment.value = true
  
  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${previewPost.value._id}/comment`, {
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
    
    previewPost.value.commentsList = updatedPost.commentsList
    previewPost.value.comments = updatedPost.comments
    
    const index = posts.value.findIndex(p => p._id === previewPost.value._id)
    if (index > -1) {
      posts.value[index].commentsList = updatedPost.commentsList
      posts.value[index].comments = updatedPost.comments
    }
    
    newCommentText.value = ''
    
  } catch (err) {
    console.error("Error submitting comment:", err)
    alert("Failed to post comment")
  } finally {
    submittingComment.value = false
  }
}

// ✅ 跳转到用户主页（修复版：确保 authorId 是字符串）
function goToProfile(authorId) {
  imagePreview.value = false
  
  const profileId = getAuthorId(authorId)
  if (!profileId) {
    console.warn('⚠️ authorId is empty, cannot navigate')
    return
  }
  
  console.log('🔗 Navigating to profile:', profileId)
  router.push(`/profile/${profileId}`)
}

// ✅ 修复：使用相对路径处理头像
function getSafeAvatar(avatar) {
  if (!avatar || avatar === "null" || avatar.trim() === "") {
    return DefaultAvatar
  }
  // 外部链接保持原样
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // ✅ 返回相对路径，Express 会自动处理
  return avatar.startsWith('/') ? avatar : '/' + avatar
}

function formatContent(content) {
  return content?.replace(/(#\w+)/g, '<span class="hashtag">#$1</span>') || ''
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

function timeAgo(dateString) {
  const now = new Date()
  const past = new Date(dateString)
  const diff = Math.floor((now - past) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateString).toLocaleDateString()
}

function getMoodEmoji(mood) {
  return moodEmojis[mood] || ''
}

async function copyPostLink(post) {
  const url = `${window.location.origin}/post/${post._id}`
  try {
    await navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function sharePost(post) {
  const url = `${window.location.origin}/post/${post._id}`
  const text = `Check out this delicious post: ${post.title}`
  
  if (navigator.share) {
    navigator.share({ title: post.title, text, url })
  } else {
    copyPostLink(post)
  }
}

function reportPost(post) {
  if (confirm(`Report this post by ${post.author}?`)) {
    console.log('Reported post:', post._id)
  }
}

// ✅ 点赞功能（使用相对路径）
async function toggleLike(post) {
  const originalLiked = post.liked
  const originalLikes = post.likes
  post.justLiked = true
  post.liked = !post.liked
  post.likes += post.liked ? 1 : -1

  try {
    const currentUserId = localStorage.getItem('userId')
    const currentUserName = localStorage.getItem('userName')
    
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${post._id}/like`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        liked: post.liked,
        likerId: currentUserId,
        likerName: currentUserName
      })
    })
    
    if (!res.ok) throw new Error("Failed to like")
    
    // ✅ 使用后端返回的准确状态
    const updatedPost = await res.json()
    post.liked = updatedPost.liked
    post.likes = updatedPost.likes
    if (updatedPost.likedBy) {
      post.likedBy = updatedPost.likedBy
    }
    
    setTimeout(() => { post.justLiked = false }, 400)
  } catch (err) {
    post.liked = originalLiked
    post.likes = originalLikes
    console.error('Failed to like:', err)
  }
}

// ✅ 保存功能（使用相对路径）
async function toggleSave(post) {
  const originalState = post.saved
  post.saved = !post.saved
  try {
    const method = post.saved ? 'POST' : 'DELETE'
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${post._id}/save`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('userId')
      }
    })

    if (!res.ok) {
      post.saved = originalState
      throw new Error('Failed to save post')
    }
  } catch (err) {
    console.error('Failed to toggle save:', err)
    alert('Failed to save post. Please try again.')
    post.saved = originalState
  } 
}

function openCommentDialog(post) {
  currentPost.value = { ...post, newComment: '' }
  commentDialog.value = true
}

function replyToComment(comment) {
  currentPost.value.newComment = `@${comment.author} `
}

// ✅ 提交评论（使用相对路径）
async function submitComment() {
  if (!currentPost.value || !currentPost.value.newComment?.trim()) return

  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts/${currentPost.value._id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        author: localStorage.getItem('userName') || 'Foodie', 
        text: currentPost.value.newComment,
        avatar: userAvatar.value
      })
    })

    if (!res.ok) throw new Error("Failed to add comment")
    const updatedPost = await res.json()
    currentPost.value.commentsList = updatedPost.commentsList
    currentPost.value.comments = updatedPost.comments
    currentPost.value.newComment = ''
  } catch (err) {
    console.error("Error submitting comment:", err)
  }
}

// ✅ 加载帖子（使用相对路径）
async function loadPosts(pageNum = 1) {
  loading.value = true
  try {
    const currentUserId = localStorage.getItem('userId')
    // ✅ 使用相对路径
    const res = await fetch(`/api/posts?page=${pageNum}&limit=20`)
    const data = await res.json()
    
    // ✅ 处理返回数据，为每个帖子初始化 liked 和 saved 状态 + 确保 authorId 是字符串
    const postsWithStatus = (data.posts || data).map(post => {
      // ✅ 确保 authorId 是字符串（而不是 populate 后的对象）
      let authorIdStr = post.authorId
      if (typeof post.authorId === 'object' && post.authorId !== null) {
        authorIdStr = post.authorId._id || String(post.authorId)
      }
      
      return {
        ...post,
        authorId: authorIdStr,  // ✅ 覆盖为字符串
        liked: post.likedBy?.some(id => String(id) === String(currentUserId)) || false,
        saved: post.savedBy?.some(id => String(id) === String(currentUserId)) || false
      }
    })
    
    if (pageNum === 1) {
      posts.value = postsWithStatus
    } else {
      posts.value = [...posts.value, ...postsWithStatus]
    }
    
    hasMore.value = data.hasMore || (data.length === 20)
  } catch (err) {
    console.error("Failed to fetch posts:", err)
  } finally {
    loading.value = false
  }
}

async function refreshPosts() {
  refreshing.value = true
  page.value = 1
  await loadPosts(1)
  refreshing.value = false
}

async function loadMorePosts() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value++
  await loadPosts(page.value)
  loadingMore.value = false
}

function handleScroll() {
  const scrollTop = window.scrollY + window.innerHeight
  const docHeight = document.documentElement.scrollHeight
  if (scrollTop >= docHeight - 500 && hasMore.value && !loadingMore.value) {
    loadMorePosts()
  }
}

onMounted(async () => {
  await loadPosts(1)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handlePreviewKeydown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handlePreviewKeydown)
})
</script>

<style scoped>
/* 样式部分保持不变，与之前相同 */
.max-width-1400 { max-width: 1400px; margin: 0 auto; }
.cursor-pointer { cursor: pointer; }
.border-thin { border: 2px solid rgba(0,0,0,0.08); }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.min-width-120 { min-width: 120px; }
.w-100 { width: 100%; }
.h-100 { height: 100%; }
.text-truncate { 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}

.create-post-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.04);
}
.create-post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
}

.filter-chip {
  transition: all 0.2s ease;
}
.filter-chip:hover {
  transform: translateY(-1px);
}

.posts-grid {
  margin: 0 -8px;
}

.post-card {
  border-radius: 12px !important;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important;
  border-color: rgba(255, 87, 34, 0.3);
}

.border-b-light {
  border-bottom: 1px solid rgba(0,0,0,0.04) !important;
}

.border-t-light {
  border-top: 1px solid rgba(0,0,0,0.04) !important;
}

.author-avatar {
  transition: transform 0.2s ease;
}
.author-avatar:hover {
  transform: scale(1.05);
}

.author-name {
  font-weight: 600;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}
.author-name:hover {
  color: #ff5722;
}

.hover-orange:hover {
  color: #ff5722 !important;
}

.post-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 6px;
  line-height: 1.3;
}

.post-content.compact-content {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 2.8em;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-chip {
  font-size: 0.7rem !important;
  padding: 0 6px !important;
  height: 20px !important;
  border-radius: 10px !important;
}

.media-section {
  position: relative;
  background: #000;
  margin: 0 -1px;
}

.video-wrapper {
  position: relative;
  cursor: pointer;
}

.post-video {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.video-play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.video-wrapper:hover .video-play-overlay {
  background: rgba(0,0,0,0.5);
}

.play-icon {
  transition: transform 0.2s ease;
}

.video-wrapper:hover .play-icon {
  transform: scale(1.1);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.image-grid {
  display: grid;
  gap: 2px;
  height: 200px;
}

.image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.image-grid.grid-3 {
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.image-grid.grid-3 .grid-item:first-child {
  grid-row: span 2;
}

.image-grid.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.grid-item {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.grid-image {
  transition: transform 0.3s ease;
}

.grid-item:hover .grid-image {
  transform: scale(1.05);
}

.more-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.image-carousel {
  position: relative;
}

.carousel-wrapper :deep(.v-carousel__controls) {
  background: rgba(0,0,0,0.3) !important;
}

.carousel-indicators {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0.5);
  padding: 4px 8px;
  border-radius: 12px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  transition: all 0.2s ease;
}

.indicator-dot.active {
  background: white;
  transform: scale(1.2);
}

.indicator-more {
  color: white;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
}

.action-btn {
  min-width: auto !important;
  padding: 0 6px !important;
  border-radius: 6px !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0,0,0,0.04) !important;
}

.action-count {
  font-size: 0.8rem;
  font-weight: 500;
}

.heart-pop {
  animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes heartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

.post-detail-dialog {
  max-height: 95vh;
  overflow: hidden;
}

.author-link {
  text-decoration: none;
  color: inherit;
}

.author-link:hover {
  color: #ff5722;
}

.media-preview-section {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.preview-media {
  width: 100%;
  object-fit: contain;
  background: #000;
}

.video-preview-wrapper {
  position: relative;
}

.preview-media {
  max-height: 400px;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot.active {
  background: white;
  transform: scale(1.2);
}

.comment-input :deep(.v-field) {
  border-radius: 16px !important;
  background: #f8f9fa !important;
  border: 2px solid rgba(0,0,0,0.06) !important;
}

.comment-input :deep(.v-field--focused) {
  border-color: #ff5722 !important;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1) !important;
}

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

.empty-state {
  background: linear-gradient(180deg, #fff3e0, #ffffff);
  border-radius: 24px;
  border: 2px dashed #ffe0b2;
}

:deep(.hashtag) {
  color: #ff5722;
  font-weight: 500;
  cursor: pointer;
}
:deep(.hashtag:hover) {
  text-decoration: underline;
}

@media (prefers-color-scheme: dark) {
  .post-card {
    background: #1e1e2e;
    border-color: rgba(255,255,255,0.08);
  }
  .author-name {
    color: #e2e8f0;
  }
  .post-content {
    color: #cbd5e1;
  }
  .border-b-light, .border-t-light {
    border-color: rgba(255,255,255,0.08) !important;
  }
  .comment-input :deep(.v-field) {
    background: #2a2a4a !important;
    border-color: rgba(255,255,255,0.1) !important;
  }
  .comments-list::-webkit-scrollbar-track {
    background: #1e1e2e;
  }
  .comments-list::-webkit-scrollbar-thumb {
    background: #4a4a6a;
  }
}

@media (max-width: 960px) {
  .post-card {
    margin-bottom: 16px !important;
  }
}

@media (max-width: 600px) {
  .post-title {
    font-size: 0.9rem;
  }
  .post-content.compact-content {
    font-size: 0.8rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .post-video, .grid-image {
    height: 180px !important;
  }
  .action-count {
    display: none;
  }
  .preview-thumbnails {
    display: none;
  }
  .preview-media {
    height: 300px !important;
  }
  .comments-list {
    max-height: 300px;
  }
}
</style>

<script>
export default {
  name: "Community"
}
</script>