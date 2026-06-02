<template>
  <v-container class="py-8 px-4 px-md-8 max-width-1200 ai-chef-container">
    <div class="particle-container" aria-hidden="true">
      <div v-for="i in 25" :key="i" class="particle" :style="getParticleStyle(i)" />
    </div>

    <div class="cursor-glow" :style="glowStyle" aria-hidden="true" />

    <v-row justify="center">
      <v-col cols="12" md="10" class="text-center">
        <div class="header-section mb-10">
          <div class="d-inline-flex align-center justify-center mb-3">
            <v-icon icon="mdi-chef-hat" size="48" color="orange" class="mr-3 header-icon" />
            <h1 class="text-h3 font-weight-black text-grey-darken-4">AI Chef</h1>
          </div>
          <p class="text-body-1 text-grey-darken-1 mb-1">
            Upload a photo of your ingredients
          </p>
          <p class="text-h6 font-weight-medium gradient-text">
            and AI will recommend delicious recipes instantly!
          </p>
        </div>

        <v-card 
          class="pa-6 rounded-2xl upload-zone glass-card" 
          elevation="0" 
          @click="$refs.fileInput.click()"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDragOver }"
        >
          <v-file-input ref="fileInput" v-model="imageFile" accept="image/*" hide-input @update:model-value="handleImageSelect" />
          
          <div v-if="!previewUrl" class="upload-placeholder py-12">
            <div class="upload-icon-wrapper mb-4">
              <v-icon icon="mdi-camera" size="64" color="orange" class="main-icon" />
              <v-icon icon="mdi-plus-circle" size="28" color="orange" class="plus-icon" />
            </div>
            <p class="text-h6 font-weight-bold text-grey-darken-3 mb-2">
              Drop your image here, or click to browse
            </p>
            <p class="text-body-2 text-grey">
              Supports JPG, PNG • Max 5MB
            </p>
          </div>

          <div v-else class="preview-area">
            <div class="position-relative d-inline-block w-100">
              <v-img 
                :src="previewUrl" 
                height="300" 
                width="100%"
                min-width="200px"
                cover 
                class="rounded-2xl preview-image"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                    <v-progress-circular indeterminate color="orange" size="40" />
                  </div>
                </template>
              </v-img>
              <div class="image-badge glass-badge">
                <v-chip color="orange" variant="flat" size="small">
                  <v-icon start>mdi-image</v-icon>
                  Ready
                </v-chip>
              </div>
            </div>
            <div class="d-flex justify-center gap-3 mt-6">
              <v-btn 
                color="orange" 
                variant="elevated" 
                size="large" 
                :loading="analyzing" 
                @click.stop="analyzeImage" 
                class="text-none font-weight-bold px-8 analyze-btn" 
                rounded="pill"
              >
                <v-icon v-if="!analyzing" start icon="mdi-magnify" size="20" class="mr-2" />
                {{ analyzing ? "AI Analyzing..." : "Identify & Recommend" }}
              </v-btn>
              <v-btn 
                variant="outlined" 
                color="grey" 
                size="large" 
                @click.stop="resetUpload" 
                class="text-none" 
                rounded="pill"
              >
                Clear
              </v-btn>
            </div>
          </div>
        </v-card>

        <div v-if="analyzing" class="mt-10">
          <div class="loading-header text-center mb-6">
            <div class="loading-spinner mb-3">
              <v-icon icon="mdi-chef-hat" size="48" color="orange" class="spin-icon" />
            </div>
            <p class="text-body-1 text-grey-darken-1">
              AI is analyzing your ingredients...
            </p>
            <v-progress-linear 
              indeterminate 
              color="orange" 
              height="4" 
              class="mt-3 rounded-pill" 
              style="max-width: 200px; margin: 0 auto;"
            />
          </div>
          
          <v-row>
            <v-col v-for="i in 3" :key="i" cols="12" sm="6" md="4">
              <div class="recipe-skeleton glass-card rounded-2xl">
                <div class="skeleton-image shimmer" />
                <div class="skeleton-content pa-4">
                  <div class="skeleton-title shimmer" />
                  <div class="skeleton-subtitle shimmer" />
                  <div class="skeleton-text shimmer" />
                  <div class="skeleton-text short shimmer" />
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <v-alert 
          v-if="ingredients.length > 0 && !analyzing" 
          type="success" 
          variant="tonal" 
          class="mt-8 text-left rounded-2xl ingredients-alert glass-card" 
          border="start" 
          density="comfortable"
        >
          <template #prepend><v-icon>mdi-check-circle</v-icon></template>
          <div>
            <strong class="text-subtitle-1 font-weight-bold">Identified Ingredients</strong>
            <div class="d-flex flex-wrap mt-3 gap-2">
              <v-chip 
                v-for="(ing, index) in ingredients" 
                :key="ing" 
                size="large"
                color="orange" 
                variant="flat" 
                class="font-weight-medium ingredient-chip"
                :style="{ animationDelay: `${index * 0.1}s` }"
                closable
                @click:close="removeIngredient(ing)"
              >
                <v-icon start size="18">mdi-food-variant</v-icon>
                {{ ing }}
              </v-chip>
            </div>
          </div>
        </v-alert>

        <v-alert 
          v-if="errorMsg" 
          type="error" 
          variant="tonal" 
          class="mt-8 rounded-2xl glass-card" 
          dismissible 
          @click:close="errorMsg = ''" 
          border="start"
        >
          <template #prepend><v-icon>mdi-alert-circle</v-icon></template>
          <strong class="font-weight-bold">Oops!</strong> {{ errorMsg }}
        </v-alert>

        <div 
          v-if="recommendedRecipes.length === 0 && ingredients.length > 0 && !analyzing && !errorMsg" 
          class="text-center py-12 empty-state"
        >
          <div class="empty-state-illustration mb-4">
            <v-icon icon="mdi-food-off" size="80" color="grey-lighten-2" class="bounce-icon" />
          </div>
          <h3 class="text-h6 font-weight-bold text-grey-darken-2 mb-2">
            No recipes found.
          </h3>
          <p class="text-body-2 text-grey mb-4 max-width-400 mx-auto">
            Try uploading a clearer photo, or check if your ingredients are common cooking items.
          </p>
          <v-btn variant="tonal" color="orange" @click="resetUpload" class="text-none">
            <v-icon start>mdi-refresh</v-icon>
            Try Another Photo
          </v-btn>
        </div>

        <div v-if="recommendedRecipes.length > 0 && !analyzing" class="mt-12">
          <div class="d-flex align-center justify-space-between mb-6">
            <h2 class="text-h5 font-weight-bold text-grey-darken-4">
              <v-icon start color="orange" size="28">mdi-star</v-icon>
              Recommended Recipes
            </h2>
            <v-chip color="orange" variant="tonal" size="small">
              {{ recommendedRecipes.length }} results
            </v-chip>
          </div>
          
          <v-row>
            <v-col 
              v-for="(recipe, idx) in recommendedRecipes" 
              :key="recipe._id || idx" 
              cols="12" 
              sm="6" 
              md="4" 
              class="mb-6"
            >
              <transition appear name="recipe-card" :style="{ animationDelay: `${idx * 0.15}s` }">
                <v-card 
                  class="recipe-card rounded-2xl h-100 glass-card" 
                  :class="{ 'ai-card': recipe.isAI }" 
                  @click="recipe.isAI ? openAIRecipe(recipe) : goToRecipe(recipe._id)"
                >
                  <div class="position-relative overflow-hidden">
                    <v-img :src="getRecipeImage(recipe)" height="200" cover class="recipe-image">
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                          <v-icon icon="mdi-silverware-fork-knife" size="56" color="grey-lighten-2" />
                        </div>
                      </template>
                    </v-img>
                    <div class="card-hover-overlay">
                      <v-btn 
                        size="small" 
                        color="white" 
                        variant="elevated"
                        class="text-none font-weight-bold"
                        @click.stop="recipe.isAI ? openAIRecipe(recipe) : goToRecipe(recipe._id)"
                      >
                        <v-icon start size="18">mdi-eye</v-icon>
                        Quick View
                      </v-btn>
                    </div>
                    
                    <div v-if="recipe.isAI" class="ai-badge glass-badge">
                      <v-icon start size="14">mdi-robot</v-icon>
                      AI Created
                    </div>
                  </div>
                  
                  <v-card-item class="pa-5">
                    <v-card-title class="text-subtitle-1 font-weight-bold line-clamp-1 mb-2">
                      {{ recipe.name }}
                    </v-card-title>
                    <v-card-subtitle class="text-caption text-grey mb-3">
                      <v-icon icon="mdi-earth" size="14" class="mr-1" color="orange" /> 
                      {{ recipe.country || 'AI Suggestion' }}
                    </v-card-subtitle>
                    <p class="text-body-2 text-grey-darken-1 line-clamp-2 mb-4">
                      {{ recipe.description }}
                    </p>
                    <div class="d-flex justify-end align-center">
                      <span class="text-caption font-weight-bold text-orange view-link">
                        {{ recipe.isAI ? 'View Steps' : 'View Details' }}
                        <v-icon icon="mdi-arrow-right" size="16" class="ml-1" />
                      </span>
                    </div>
                  </v-card-item>
                </v-card>
              </transition>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="showStepsDialog" max-width="650" scrollable>
      <v-card class="rounded-2xl ai-dialog glass-card">
        <v-card-title class="bg-orange-lighten-5 pa-5 d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <v-icon icon="mdi-chef-hat" color="orange" size="32" class="mr-3" />
            <span class="text-h5 font-weight-bold">{{ selectedAIRecipe?.name }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showStepsDialog = false" />
        </v-card-title>
        <v-card-text class="pa-5">
          <p class="text-body-1 text-grey-darken-1 mb-5">{{ selectedAIRecipe?.description }}</p>
          
          <div class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
              <v-icon start color="orange" size="24">mdi-silverware-fork-knife</v-icon>
              Ingredients
            </h4>
            <div v-if="selectedAIRecipe?.ingredients" class="d-flex flex-wrap gap-2">
              <v-chip 
                v-for="(ing, idx) in selectedAIRecipe.ingredients" 
                :key="idx"
                size="small"
                color="orange" 
                variant="tonal"
              >
                {{ ing }}
              </v-chip>
            </div>
          </div>

          <h4 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
            <v-icon start color="orange" size="24">mdi-numeric</v-icon>
            Cooking Steps
          </h4>
          <v-timeline side="end" align="start" truncate-line="both" line-color="#ffccbc" density="compact">
            <v-timeline-item 
              v-for="(step, i) in selectedAIRecipe?.steps" 
              :key="i" 
              dot-color="orange" 
              size="small"
              class="timeline-item"
            >
              <div class="text-body-1 pa-3 bg-grey-lighten-5 rounded-lg glass-step">
                <strong class="text-orange">Step {{ i + 1 }}:</strong> {{ step }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const imageFile = ref(null);
const previewUrl = ref("");
const analyzing = ref(false);
const ingredients = ref([]);
const recommendedRecipes = ref([]);
const errorMsg = ref("");
const showStepsDialog = ref(false);
const selectedAIRecipe = ref(null);
const isDragOver = ref(false);

const glowStyle = ref({});

function getParticleStyle(index) {
  const size = Math.random() * 6 + 2;
  const left = Math.random() * 100;
  const delay = Math.random() * 5;
  const duration = Math.random() * 10 + 15;
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity: Math.random() * 0.5 + 0.2
  }
}

onMounted(() => {
  const handleMouseMove = (e) => {
    glowStyle.value = {
      left: `${e.clientX}px`,
      top: `${e.clientY}px`,
      opacity: '0.15'
    }
  }
  document.addEventListener('mousemove', handleMouseMove)
  
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
  }
})

function removeIngredient(ing) {
  ingredients.value = ingredients.value.filter(i => i !== ing);
}

function handleDrop(e) {
  isDragOver.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    imageFile.value = files[0];
    handleImageSelect(files[0]);
  }
}

function handleImageSelect(file) {
  if (file) {
    previewUrl.value = URL.createObjectURL(file);
    ingredients.value = [];
    recommendedRecipes.value = [];
    errorMsg.value = "";
  }
}

function resetUpload() {
  imageFile.value = null;
  previewUrl.value = "";
  ingredients.value = [];
  recommendedRecipes.value = [];
  errorMsg.value = "";
}

function getImageUrl(img) {
    if (!img) return ''
    if (typeof img === 'string') return img
    if (typeof img === 'object' && img.url) return img.url
    return ''
}

function getDefaultPlaceholder(name) {
    const text = encodeURIComponent(name || 'Recipe');
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ffccbc' width='400' height='300'/%3E%3Ctext fill='%23ff5722' font-family='Arial' font-size='24' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${text}%3C/text%3E%3C/svg%3E`;
}

function getRecipeImage(recipe) {
    if (recipe.image) {
        return getImageUrl(recipe.image);
    }
    return getDefaultPlaceholder(recipe.name);
}

async function analyzeImage() {
  if (!imageFile.value) return;
  analyzing.value = true;
  errorMsg.value = "";
  recommendedRecipes.value = [];

  const formData = new FormData();
  formData.append("image", imageFile.value);

  try {
    const res = await fetch("/api/ai-chef", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to process image");
    }
    const data = await res.json();
    ingredients.value = data.ingredients || [];
    
    const recipes = data.recipes || [];
    await Promise.all(recipes.map(async (recipe) => {
      if (!recipe.image) {
        try {
          const dishName = encodeURIComponent(recipe.name || 'food');
          const imgRes = await fetch(`/api/dish-image?dish=${dishName}`);
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            recipe.image = imgData.image;
          } else {
            recipe.image = getDefaultPlaceholder(recipe.name);
          }
        } catch (err) {
          console.warn(`Failed to load image for ${recipe.name}:`, err);
          recipe.image = getDefaultPlaceholder(recipe.name);
        }
      } else if (recipe.isAI && !recipe.image) {
        recipe.image = getDefaultPlaceholder(recipe.name);
      }
    }));
    
    recommendedRecipes.value = recipes;
    
  } catch (err) {
    errorMsg.value = err.message || "Network error. Please try again.";
  } finally {
    analyzing.value = false;
  }
}

function goToRecipe(id) {
  router.push(`/recipe/${id}`);
}

function openAIRecipe(recipe) {
  selectedAIRecipe.value = recipe;
  showStepsDialog.value = true;
}
</script>

<style scoped>
.max-width-1200 { max-width: 1200px; margin: 0 auto; }

.ai-chef-container {
  border-radius: 24px;
  padding: 32px !important;
  position: relative;
  overflow: hidden;
}

.particle-container {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: floatUp linear infinite;
  bottom: -10px;
}

@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
}

.cursor-glow {
  position: fixed;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.3) 0%, transparent 70%);
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
  z-index: 0;
  opacity: 0;
}

.ai-chef-container > .v-row { 
  position: relative; 
  z-index: 1; 
}

.header-icon { 
  animation: floatIcon 3s ease-in-out infinite; 
}

@keyframes floatIcon {
  0%, 100% { 
    transform: translateY(0); 
  }

  50% { 
    transform: translateY(-6px); 
  }
}

.gradient-text {
  background: linear-gradient(90deg, #ff9800, #ff5722);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-card {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.glass-badge {
  background: rgba(255, 152, 0, 0.9) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-step {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(4px);
}

:deep(.v-theme--dark) .glass-card {
  background: rgba(30, 30, 46, 0.85) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}


.upload-zone {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 87, 34, 0.02) 100%);
  border: 2px dashed rgba(255, 152, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.upload-zone:hover {
  border-color: #ff9800;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 87, 34, 0.05) 100%);
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(255, 152, 0, 0.15);
}

.upload-zone.drag-over {
  border-color: #ff5722;
  background: linear-gradient(135deg, rgba(255, 87, 34, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%);
  transform: scale(1.02);
}

.upload-icon-wrapper { 
  position: relative; 
  display: inline-block; 
}

.main-icon { 
  filter: drop-shadow(0 4px 12px rgba(255, 152, 0, 0.2)); 
}

.plus-icon {
  position: absolute;
  bottom: -4px; right: -4px;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-image {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  object-fit: cover !important;
  display: block !important;
}

.preview-image:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
}

.image-badge { position: absolute; top: 12px; left: 12px; }

.analyze-btn {
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
  transition: all 0.3s ease;
}

.analyze-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 152, 0, 0.4);
}

.spin-icon { 
  animation: spin 2s linear infinite; 
}

@keyframes spin { 
  from { 
    transform: rotate(0deg); 
  } 

  to { 
    transform: rotate(360deg); 
  } 
}

.loading-header { 
  animation: fadeIn 0.5s ease; 
}

@keyframes fadeIn { 
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  } 

  to { 
    opacity: 1; 
    transform: translateY(0); 
  } 
}

.recipe-skeleton { 
  background: white; 
  border: 1px solid rgba(0,0,0,0.04); 
  overflow: hidden; 
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-title { 
  height: 20px; 
  width: 80%; 
  background: #e0e0e0; 
  border-radius: 4px; 
  margin-bottom: 12px; 
}

.skeleton-subtitle { 
  height: 14px; 
  width: 50%; 
  background: #f0f0f0; 
  border-radius: 4px; 
  margin-bottom: 16px; 
}

.skeleton-text { 
  height: 12px; 
  width: 100%; 
  background: #f5f5f5; 
  border-radius: 4px;
  margin-bottom: 8px; 
}

.skeleton-text.short { 
  width: 60%; 
}

.shimmer { 
  animation: shimmer 1.5s infinite linear; 
}

@keyframes shimmer { 
  0% { 
    background-position: -200% 0; 
  } 

  100% { 
    background-position: 200% 0; 
  } 
}

.ingredient-chip {
  animation: chipEnter 0.4s ease backwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ingredient-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
}

.ingredient-chip:active { transform: scale(0.98); }

@keyframes chipEnter {
  from { opacity: 0; transform: scale(0.8) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ========== 🍽️ 空状态 ========== */
.empty-state { 
  animation: fadeIn 0.5s ease; 
}

.bounce-icon { 
  animation: bounce 2s infinite; 
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0); 
  }
  50% { 
    transform: translateY(-10px); 
  }
}

.max-width-400 { 
  max-width: 400px; 
}

/* ========== 🌟 食谱卡片 ========== */
.recipe-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  cursor: pointer;
}

.recipe-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
}

.recipe-image { 
  transition: transform 0.5s ease; 
}

.recipe-card:hover .recipe-image { 
  transform: scale(1.08); 
}

.card-hover-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.recipe-card:hover .card-hover-overlay { 
  opacity: 1; 
}

.card-hover-overlay .v-btn {
  transform: translateY(10px);
  transition: transform 0.3s ease;
}

.recipe-card:hover .card-hover-overlay .v-btn { 
  transform: translateY(0); 
}

.ai-card {
  border: 2px solid #ff9800;
  background: linear-gradient(135deg, #fffaf5 0%, #ffffff 100%);
}

.ai-badge {
  position: absolute;
  top: 12px; right: 12px;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-link { 
  transition: all 0.2s ease; 
  display: flex; 
  align-items: center; 
}

.recipe-card:hover .view-link { 
  transform: translateX(4px); 
}

.recipe-card-enter-active { 
  animation: cardEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards; 
}

@keyframes cardEnter {
  from { opacity: 0; 
    transform: translateY(30px) scale(0.95); 
  }

  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.ai-dialog {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
}

.timeline-item { margin-bottom: 16px; }
:deep(.v-timeline-item__body) { padding-left: 12px !important; }

@media (max-width: 600px) { 
  .ai-chef-container { padding: 16px !important; }
  .upload-placeholder { padding: 40px 20px !important; } 
  .preview-image { height: 240px !important; }
  .header-section .text-h3 { font-size: 1.75rem !important; }
  .analyze-btn, .v-btn { width: 100%; margin-bottom: 8px; }
}

@media (max-width: 960px) and (min-width: 601px) {
  .preview-image { height: 260px !important; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.v-btn:focus-visible, .v-chip:focus-visible, .recipe-card:focus-visible {
  outline: 3px solid #ff9800 !important;
  outline-offset: 2px !important;
}
</style>