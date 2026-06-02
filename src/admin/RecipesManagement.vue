<template>
  <v-container fluid class="pa-6 pa-md-8 bg-gradient">
    <!-- 🎯 顶部标题栏 -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
      <div>
        <div class="d-flex align-center gap-3 mb-2">
          <h2 class="text-h4 font-weight-bold text-grey-darken-4">
            🍳 Recipe Management
          </h2>
          <v-chip size="small" color="orange" variant="tonal" class="font-weight-medium">
            {{ recipes.length }} Recipes
          </v-chip>
        </div>
        <p class="text-body-2 text-grey-darken-1">
          Manage your culinary collection with images, ingredients, and step-by-step instructions
        </p>
      </div>
      <v-btn 
        color="orange" 
        variant="elevated" 
        prepend-icon="mdi-plus-circle"
        @click="openEditor(null)"
        class="action-btn"
        size="large"
      >
        Add New Recipe
      </v-btn>
    </div>

    <!-- 🔍 现代化搜索/过滤栏 -->
    <v-card class="filter-card mb-4" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense align="center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search recipes by name or description..."
              density="comfortable"
              variant="outlined"
              rounded="pill"
              hide-details
              class="search-field"
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedCountry"
              :items="countries"
              label="Filter by Country"
              prepend-inner-icon="mdi-map-marker-outline"
              density="comfortable"
              variant="outlined"
              rounded="pill"
              hide-details
              clearable
              class="filter-select"
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex justify-md-end">
            <v-btn 
              variant="outlined" 
              color="grey" 
              prepend-icon="mdi-refresh"
              @click="fetchRecipes"
              :loading="loading"
              class="refresh-btn"
            >
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 🔄 视图切换栏 -->
    <v-card class="mb-6 pa-3 d-flex justify-space-between align-center" elevation="0">
      <div class="text-body-2 text-grey">
        Showing {{ filteredRecipes.length }} recipes
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn-toggle 
          v-model="viewMode" 
          variant="outlined" 
          density="compact" 
          rounded="pill"
          mandatory
        >
          <v-btn value="grid" icon="mdi-view-grid" size="small" />
          <v-btn value="grouped" icon="mdi-view-list" size="small" />
        </v-btn-toggle>
        <span class="text-caption text-grey">{{ viewMode === 'grid' ? 'Grid View' : 'Grouped by Country' }}</span>
      </div>
    </v-card>

    <!-- ⏳ 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="orange" size="50" />
      <p class="text-caption text-grey mt-4">Loading recipes...</p>
    </div>

    <!-- 📋 网格视图 -->
    <template v-if="viewMode === 'grid'">
      <v-row v-if="filteredRecipes.length > 0" dense class="recipe-grid">
        <v-col 
          v-for="recipe in filteredRecipes" 
          :key="recipe._id" 
          cols="12" 
          sm="6" 
          md="4" 
          lg="3"
          class="recipe-col"
        >

          <v-card 
            class="recipe-card modern-card" 
            rounded="xl" 
            elevation="2"
            hover
            @click="openEditor(recipe)"
            style="cursor: pointer;"
          >
            <div class="recipe-image-wrapper">
              <v-img 
                :src="recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'"
                height="180" 
                cover
                class="recipe-image"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                    <v-progress-circular indeterminate color="orange" size="32" />
                  </div>
                </template>
              </v-img>
              <v-chip 
                size="x-small" 
                color="white" 
                variant="elevated"
                class="country-chip"
              >
                <v-icon start size="12">mdi-map-marker</v-icon>
                {{ recipe.country }}
              </v-chip>
            </div>

            <v-card-text class="pa-4">
              <h3 class="text-h6 font-weight-bold mb-2 line-clamp-1">
                {{ recipe.name }}
              </h3>
              <p class="text-body-2 text-grey-darken-1 mb-3 line-clamp-2">
                {{ recipe.description || 'No description provided.'}}
              </p>

              <div class="d-flex gap-2 mb-3">
                <v-chip size="x-small" color="orange" variant="tonal">
                  <v-icon start size="12">mdi-food</v-icon>
                  {{ recipe.ingredients?.length || 0 }}
                </v-chip>
                <v-chip size="x-small" color="blue" variant="tonal">
                  <v-icon start size="12">mdi-format-list-numbered</v-icon>
                  {{ recipe.steps?.length || 0 }} steps
                </v-chip>
              </div>

              <v-divider class="my-3" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-grey d-flex align-center">
                  <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                  {{ timeAgo(recipe.createdAt) }}
                </span>
                <div class="d-flex gap-1">
                  <v-tooltip text="Delete Recipe" location="top">
                    <template #activator="{ props }">
                      <v-btn 
                        v-bind="props"
                        icon="mdi-delete-outline" 
                        size="small" 
                        color="error" 
                        variant="text"
                        class="action-icon"
                        @click="deleteRecipe(recipe._id)"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- 网格视图空状态 -->
      <div v-else class="text-center py-16 empty-state">
        <v-avatar size="80" color="orange-lighten-4" class="mb-4">
          <v-icon size="40" color="orange">mdi-silverware-fork-knife</v-icon>
        </v-avatar>
        <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">
          No recipes found
        </h3>
        <p class="text-body-2 text-grey-darken-1 mb-4 max-width-300 mx-auto">
          Try adjusting your search filters or create your first delicious recipe!
        </p>
        <v-btn 
          color="orange" 
          variant="tonal" 
          prepend-icon="mdi-plus"
          @click="openEditor(null)"
        >
          Create First Recipe
        </v-btn>
      </div>
    </template>

    <!-- 🌍 国家分组视图 -->
    <template v-else-if="viewMode === 'grouped'">
      <div v-if="recipesByCountry.length > 0" class="grouped-view">
        <v-expansion-panels 
          v-model="expandedCountries" 
          multiple 
          variant="accordion"
          class="country-panels"
        >
          <v-expansion-panel 
            v-for="[country, countryRecipes] in recipesByCountry" 
            :key="country"
            :value="country"
            class="country-panel"
          >
            <!-- 国家标题 -->
            <v-expansion-panel-title class="py-3">
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center gap-3">
                  <v-avatar size="32" color="orange-lighten-4">
                    <v-icon color="orange" icon="mdi-map-marker" size="20" />
                  </v-avatar>
                  <span class="font-weight-bold">{{ country }}</span>
                  <v-chip size="x-small" color="grey" variant="tonal">
                    {{ countryRecipes.length }}
                  </v-chip>
                </div>
                <span class="text-caption text-grey">
                  {{ countryRecipes.length }} recipe{{ countryRecipes.length > 1 ? 's' : '' }}
                </span>
              </div>
            </v-expansion-panel-title>
            
            <!-- 国家下的食谱列表 -->
            <v-expansion-panel-text>
              <v-row dense class="mt-2">
                <v-col 
                  v-for="recipe in countryRecipes" 
                  :key="recipe._id" 
                  cols="12" 
                  sm="6" 
                  md="4" 
                  lg="3"
                >
                  <!-- 简化版食谱卡片 -->
                  <v-card class="recipe-card modern-card" rounded="lg" elevation="1" hover>
                    <v-img 
                      :src="recipe.image || 'https://via.placeholder.com/400x300?text=No+Image'"
                      height="140" 
                      cover
                    />
                    <v-card-text class="pa-3">
                      <h4 class="text-subtitle-2 font-weight-bold mb-1 line-clamp-1">
                        {{ recipe.name }}
                      </h4>
                      <p class="text-caption text-grey mb-2 line-clamp-1">
                        {{ recipe.description }}
                      </p>
                      <div class="d-flex justify-space-between align-center">
                        <v-chip size="x-small" color="orange" variant="tonal">
                          {{ recipe.ingredients?.length || 0 }} ingredients
                        </v-chip>
                        <div class="d-flex gap-1">
                          <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditor(recipe)" />
                          <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="deleteRecipe(recipe._id)" />
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      
      <!-- 分组视图空状态 -->
      <div v-else class="text-center py-12">
        <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-earth-off</v-icon>
        <p class="text-grey">No recipes match your filters</p>
      </div>
    </template>

    <!-- ✏️ 现代化编辑对话框 -->
    <v-dialog v-model="editorDialog" max-width="960" persistent scrollable>
      <v-card class="editor-card rounded-2xl">
        <!-- 标题栏 -->
        <v-card-item class="pa-4 border-b d-flex align-center">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" color="orange" variant="tonal">
              <v-icon color="orange" :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" />
            </v-avatar>
            <div>
              <v-card-title class="text-h6 font-weight-bold">
                {{ isEditing ? 'Edit Recipe' : 'Create New Recipe' }}
              </v-card-title>
              <v-card-subtitle class="text-caption">
                Fill in the details below to {{ isEditing ? 'update' : 'add' }} your recipe
              </v-card-subtitle>
            </div>
          </div>
          <v-spacer />
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small"
            @click="editorDialog = false"
            class="rounded-circle"
          />
        </v-card-item>

        <!-- 内容区域 -->
        <v-card-text class="pa-6">
          <v-row>
            <!-- 📋 基本信息 -->
            <v-col cols="12" md="5" class="border-e pe-md-4">
              <h4 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center">
                <v-icon color="orange" class="mr-2">mdi-information-outline</v-icon>
                Basic Information
              </h4>
              
              <v-text-field 
                v-model="currentRecipe.name" 
                label="Dish Name *" 
                variant="outlined" 
                density="comfortable" 
                class="mb-4 modern-input"
                :rules="[v => !!v || 'Name is required']"
              />
              
              <v-text-field 
                v-model="currentRecipe.country" 
                label="Origin Country *" 
                variant="outlined" 
                density="comfortable" 
                class="mb-4 modern-input"
                :rules="[v => !!v || 'Country is required']"
              />
              
              <v-textarea 
                v-model="currentRecipe.description" 
                label="Description" 
                variant="outlined" 
                density="comfortable" 
                rows="4" 
                class="modern-input"
                placeholder="Tell us about this dish..."
              />
            </v-col>

            <!-- 🥗 食材 & 步骤 -->
            <v-col cols="12" md="7" class="ps-md-4">
              <!-- 食材 -->
              <div class="mb-6">
                <div class="d-flex justify-space-between align-center mb-3">
                  <h4 class="text-subtitle-1 font-weight-bold d-flex align-center">
                    <v-icon color="orange" class="mr-2">mdi-food</v-icon>
                    Ingredients
                  </h4>
                  <v-btn 
                    size="small" 
                    color="orange" 
                    variant="tonal" 
                    prepend-icon="mdi-plus"
                    @click="addIngredient"
                    class="add-btn"
                  >
                    Add
                  </v-btn>
                </div>
                
                <v-card variant="outlined" class="rounded-xl bg-grey-lighten-5">
                  <v-card-text class="pa-3">
                    <div v-if="currentRecipe.ingredients.length === 0" class="text-center py-4 text-grey">
                      <v-icon size="32" color="grey-lighten-2" class="mb-2">mdi-food-off</v-icon>
                      <p class="text-caption">No ingredients added yet</p>
                    </div>
                    
                    <div v-for="(ing, i) in currentRecipe.ingredients" :key="i" class="ingredient-row">
                      <v-text-field 
                        v-model="ing.item" 
                        placeholder="e.g., Chicken breast" 
                        variant="outlined" 
                        density="compact" 
                        hide-details 
                        class="ingredient-name"
                      />
                      <v-text-field 
                        v-model="ing.amount" 
                        placeholder="e.g., 200g" 
                        variant="outlined" 
                        density="compact" 
                        hide-details 
                        class="ingredient-amount"
                      />
                      <v-btn 
                        icon="mdi-close" 
                        size="small" 
                        color="grey" 
                        variant="text"
                        @click="removeIngredient(i)"
                        class="remove-btn"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              
              <!-- 步骤 -->
              <div>
                <div class="d-flex justify-space-between align-center mb-3">
                  <h4 class="text-subtitle-1 font-weight-bold d-flex align-center">
                    <v-icon color="orange" class="mr-2">mdi-format-list-numbered</v-icon>
                    Cooking Steps
                  </h4>
                  <v-btn 
                    size="small" 
                    color="orange" 
                    variant="tonal" 
                    prepend-icon="mdi-plus"
                    @click="addStep"
                    class="add-btn"
                  >
                    Add Step
                  </v-btn>
                </div>
                
                <v-card variant="outlined" class="rounded-xl bg-grey-lighten-5">
                  <v-card-text class="pa-3">
                    <div v-if="currentRecipe.steps.length === 0" class="text-center py-4 text-grey">
                      <v-icon size="32" color="grey-lighten-2" class="mb-2">mdi-clock-outline</v-icon>
                      <p class="text-caption">No steps added yet</p>
                    </div>
                    
                    <div v-for="(step, i) in currentRecipe.steps" :key="i" class="step-row">
                      <div class="step-number">{{ i + 1 }}</div>
                      <v-textarea 
                        v-model="currentRecipe.steps[i]" 
                        placeholder="Describe this cooking step..." 
                        rows="2" 
                        density="compact" 
                        variant="outlined" 
                        hide-details 
                        class="step-input"
                      />
                      <v-btn 
                        icon="mdi-close" 
                        size="small" 
                        color="grey" 
                        variant="text"
                        class="remove-btn mt-1"
                        @click="removeStep(i)"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- 底部操作 -->
        <v-card-actions class="pa-4 border-t bg-grey-lighten-5">
          <v-spacer />
          <v-btn 
            variant="text" 
            color="grey" 
            @click="editorDialog = false"
            class="text-none"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="orange" 
            variant="elevated" 
            @click="saveRecipe"
            :loading="saving"
            class="text-none action-btn"
          >
            {{ isEditing ? 'Update Recipe' : 'Create Recipe' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted} from "vue"

const recipes = ref([])
const editorDialog = ref(false)
const loading = ref(false)
const saving = ref(false)
const currentRecipe = ref({ name:"", country:"", description:"", image:"", ingredients:[{item:"", amount:""}], steps:[""] })
const isEditing = ref(false)
const searchQuery = ref("")
const selectedCountry = ref("")
const countries = ref([])
const viewMode = ref('grid')
const expandedCountries = ref([])

const filteredRecipes = computed(() => {
  let list = recipes.value
  if (selectedCountry.value) {
    list = list.filter(r => r.country?.toLowerCase() === selectedCountry.value.toLowerCase())
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r => 
      r.name?.toLowerCase().includes(q) || 
      r.description?.toLowerCase().includes(q) ||
      r.country?.toLowerCase().includes(q)
    )
  }
  return list
})

const recipesByCountry = computed(() => {
  const grouped = {}
  filteredRecipes.value.forEach(recipe => {
    const country = recipe.country || 'Unknown'
    if (!grouped[country]) {
      grouped[country] = []
    }
    grouped[country].push(recipe)
  })
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
})

function toggleView() {
  viewMode.value = viewMode.value === 'grid' ? 'grouped' : 'grid'
}

async function fetchRecipes() {
  loading.value = true
  try {
    const res = await fetch("http://localhost:5000/api/recipes") 
    recipes.value = await res.json()

    // 为没有图片的食谱获取默认图片
    for (const [index, recipe] of recipes.value.entries()) {
      if (!recipe.image) {
        try {
          const imgRes = await fetch(`http://localhost:5000/api/dish-image?dish=${encodeURIComponent(recipe.name)}&country=${encodeURIComponent(recipe.country)}`);
          const data = await imgRes.json();
          recipes.value[index].image = data.image || "https://via.placeholder.com/400x300?text=No+Image";
        } catch (err) {
          recipes.value[index].image = "https://via.placeholder.com/400x300?text=No+Image";
        }
      }
    }
    countries.value = [...new Set(recipes.value.filter(r => r.country).map(r => r.country))].sort()
  } catch (err) {
    console.error("Failed to fetch recipes:", err)
  } finally {
    loading.value = false
  }
}

function openEditor(recipe) {
  if (recipe) {
    currentRecipe.value = JSON.parse(JSON.stringify(recipe))
    // 确保食材和步骤有默认值
    if (!currentRecipe.value.ingredients?.length) {
      currentRecipe.value.ingredients = [{item:"", amount:""}]
    }
    if (!currentRecipe.value.steps?.length) {
      currentRecipe.value.steps = [""]
    }
    isEditing.value = true 
  } else {
    currentRecipe.value = { 
      name:"", 
      country:"", 
      description:"", 
      image:"", 
      ingredients:[{item:"", amount:""}], 
      steps:[""] 
    }
    isEditing.value = false
  }
  editorDialog.value = true
}

function addIngredient() {
  currentRecipe.value.ingredients.push({ amount:"", item:""})
}

function removeIngredient(i){
  currentRecipe.value.ingredients.splice(i,1)
}

function addStep(){
  currentRecipe.value.steps.push("")
}

function removeStep(i){
  currentRecipe.value.steps.splice(i,1)
}

async function saveRecipe(){
  // 简单验证
  if (!currentRecipe.value.name?.trim() || !currentRecipe.value.country?.trim()) {
    alert("Please fill in the required fields: Name and Country")
    return
  }
  
  saving.value = true
  try {
    if (isEditing.value){
      await fetch(`http://localhost:5000/api/recipes/${currentRecipe.value._id}`, {
        method: "PUT",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify(currentRecipe.value)
      })
    } else {
      await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentRecipe.value)
      })
    }
    editorDialog.value = false
    fetchRecipes()
  } catch (err) {
    console.error("Save failed:", err)
    alert("Failed to save recipe")
  } finally {
    saving.value = false
  }
}

async function deleteRecipe(id) {
  if (confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
    try {
      await fetch(`http://localhost:5000/api/recipes/${id}`, { method: "DELETE" })
      fetchRecipes()
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete recipe")
    }
  }
}

function timeAgo(dateString) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}


onMounted(fetchRecipes)
</script>

<style scoped>
/* 🎨 全局背景 */
.bg-gradient {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff9f5 0%, #fffefc 50%, #f5f9ff 100%);
}

/* 🔍 搜索/过滤卡片 */
.filter-card {
  border-radius: 16px !important;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.9);
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
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.15) !important;
  border-color: #ff9800 !important;
}

/* 🔄 刷新按钮 */
.refresh-btn {
  border-radius: 50px !important;
}

/* 📋 食谱网格 */
.recipe-grid {
  margin: 0 -8px;
}
.recipe-col {
  padding: 8px;
}

/* 🍳 现代化食谱卡片 */
.modern-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0,0,0,0.04);
  overflow: hidden;
}
.modern-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
}

/* 🖼️ 图片区域 */
.recipe-image-wrapper {
  position: relative;
  overflow: hidden;
}
.recipe-image {
  transition: transform 0.4s ease;
}
.modern-card:hover .recipe-image {
  transform: scale(1.05);
}

/* 🎭 悬停遮罩 */
.recipe-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.modern-card:hover .recipe-overlay {
  opacity: 1;
}
.overlay-btn {
  transform: scale(0.9);
  transition: transform 0.2s ease;
}
.overlay-btn:hover {
  transform: scale(1);
}

/* 🏷️ 国家标签 */
.country-chip {
  position: absolute;
  top: 12px;
  right: 12px;
  border-radius: 20px !important;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* 📝 内容区域 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

/* ⚙️ 操作图标 */
.action-icon {
  border-radius: 10px !important;
  transition: all 0.2s ease;
}
.action-icon:hover {
  transform: scale(1.1);
  background: rgba(0,0,0,0.04) !important;
}

/* 📭 空状态 */
.empty-state {
  background: linear-gradient(180deg, #fff3e0, #ffffff);
  border-radius: 24px;
  border: 2px dashed #ffe0b2;
}
.max-width-300 {
  max-width: 300px;
}

/* ✏️ 编辑对话框 */
.editor-card {
  border-radius: 24px !important;
  overflow: hidden;
}
:deep(.editor-card .v-card) {
  border-radius: 0 !important;
}

/* 🎨 现代化输入框 */
:deep(.modern-input .v-field) {
  border-radius: 12px !important;
  background: white !important;
  transition: all 0.2s ease !important;
}
:deep(.modern-input .v-field:hover) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
}
:deep(.modern-input .v-field--focused) {
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.15) !important;
  border-color: #ff9800 !important;
}

/* 🥗 食材行 */
.ingredient-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ingredient-name {
  flex: 1;
}
.ingredient-amount {
  max-width: 100px;
}

/* 👣 步骤行 */
.step-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
}
.step-input {
  flex: 1;
}

/* 🗑️ 删除按钮 */
:deep(.remove-btn) {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
:deep(.remove-btn:hover) {
  opacity: 1;
}

/* ➕ 添加按钮 */
.add-btn {
  border-radius: 20px !important;
  font-weight: 500;
}

/* 🎯 操作按钮 */
:deep(.action-btn) {
  border-radius: 12px !important;
  padding: 0 24px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}
:deep(.action-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(255, 87, 34, 0.3) !important;
}

/* 🌍 国家分组视图 */
.grouped-view {
  margin: 0 -8px;
}
:deep(.country-panels) {
  background: transparent !important;
  box-shadow: none !important;
}
:deep(.country-panel) {
  border-radius: 12px !important;
  margin-bottom: 12px !important;
  border: 1px solid rgba(0,0,0,0.06) !important;
  overflow: hidden;
}
:deep(.country-panel .v-expansion-panel-title) {
  background: linear-gradient(135deg, #fff9f5, #ffffff) !important;
  font-weight: 600 !important;
}
:deep(.country-panel .v-expansion-panel-title--active) {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2) !important;
}

/* 📱 响应式优化 */
@media (max-width: 768px) {
  .recipe-col {
    padding: 4px;
  }
  .ingredient-row,
  .step-row {
    flex-wrap: wrap;
  }
  .ingredient-amount {
    max-width: 80px;
  }
}

/* 🌓 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .bg-gradient {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  .filter-card,
  .modern-card,
  :deep(.editor-card) {
    background: rgba(30, 30, 46, 0.95) !important;
    border-color: rgba(255,255,255,0.1);
  }
  :deep(.search-field .v-field),
  :deep(.filter-select .v-field),
  :deep(.modern-input .v-field) {
    background: rgba(40, 40, 60, 0.8) !important;
    border-color: rgba(255,255,255,0.1);
  }
}
</style>