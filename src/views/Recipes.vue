<template>
  <v-container class="py-8 recipes-container">
    <v-row justify="center" class="mb-8">
      <v-col cols="12" md="10" class="text-center">
        <h1 class="text-h3 font-weight-black mb-2 text-grey-darken-4">
          {{ selectedCountry ? `${selectedCountry} Recipes` : 'Discover Recipes' }}
        </h1>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          {{ selectedCountry 
            ? `Explore authentic flavors from ${selectedCountry}` 
            : 'Explore authentic flavors from every corner of the globe' 
          }}
        </p>

        <v-sheet rounded="xl" elevation="3" class="pa-4 control-bar">
          <v-row align="center" justify="center" class="ma-n2">
            <v-col cols="12" sm="4" class="px-2">
              <v-select
                v-model="selectedCountry"
                :items="countries"
                :label="selectedCountry ? 'Change Country' : 'Filter by Country'"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                prepend-inner-icon="mdi-earth"
                class="modern-select"
              />
            </v-col>
            
            <!-- 排序 -->
            <v-col cols="12" sm="3" class="px-2">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Sort by"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-sort"
                class="modern-select"
              />
            </v-col>
            
            <!-- 视图切换 -->
            <v-col cols="12" sm="3" class="px-2">
              <v-btn-toggle
                v-model="viewMode"
                variant="outlined"
                density="compact"
                mandatory
                class="w-100 view-toggle"
              >
                <v-btn value="grid" icon="mdi-view-grid" title="Grid View" />
                <v-btn value="list" icon="mdi-view-list" title="List View" />
              </v-btn-toggle>
            </v-col>
            
            <!-- 结果计数 -->
            <v-col cols="12" sm="2" class="px-2 d-flex align-center justify-center">
              <v-chip variant="tonal" color="orange" class="font-weight-bold">
                {{ filteredDishes.length }} dishes
              </v-chip>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading" justify="center">
      <v-col v-for="i in 8" :key="i" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" height="320" class="rounded-xl" />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="filteredDishes.length === 0" justify="center" class="py-16">
      <v-col cols="12" class="text-center">
        <v-icon icon="mdi-silverware-fork-knife" size="80" color="grey-lighten-2" class="mb-4" />
        <h3 class="text-h6 text-grey-darken-2 font-weight-bold">
          {{ selectedCountry ? `No recipes found in ${selectedCountry}` : 'No recipes found' }}
        </h3>
        <p class="text-grey mt-2">
          {{ selectedCountry 
            ? 'Try clearing the country filter or adjusting your search' 
            : 'Try adjusting your filters or search terms' 
          }}
        </p>
        <v-btn variant="text" color="orange" @click="resetFilters" class="mt-4">
          Reset Filters
        </v-btn>
      </v-col>
    </v-row>

    <!-- List View with Expansion Panels -->
    <v-expansion-panels 
      v-if="viewMode === 'list'" 
      v-model="expandedPanels" 
      multiple 
      class="mb-8"
    >
      <v-expansion-panel
        v-for="(dishes, country) in groupedDishes"
        :key="country"
        :value="country"
        class="mb-4 rounded-xl"
      >
        <v-expansion-panel-title class="bg-grey-lighten-4 font-weight-bold">
          <div class="d-flex align-center gap-3">
            <v-icon icon="mdi-earth" color="orange-darken-4" />
            <span>{{ country }}</span>
            <v-chip size="small" color="orange" variant="tonal">
              {{ dishes.length }} dishes
            </v-chip>
          </div>
        </v-expansion-panel-title>
        
        <v-expansion-panel-text>
          <v-row class="ma-n2">
            <v-col v-for="dish in dishes" :key="dish._id" cols="12" sm="6" md="4">
              <v-card 
                elevation="1" 
                class="recipe-card-list rounded-lg mb-3" 
                @click="goToDetail(dish._id)"
              >
                <v-row no-gutters>
                  <v-col cols="4" class="pa-2">
                    <div class="list-image-wrapper">
                      <img :src="dish.image || '/images/default-dish.jpg'" :alt="dish.name" />
                      <div
                        class="heart-btn-small"
                        :class="{ active: isFavourite(dish._id) }"
                        @click.stop="toggleFavourite(dish._id)"
                      >
                        <v-icon :icon="isFavourite(dish._id) ? 'mdi-heart' : 'mdi-heart-outline'" size="18" color="red" />
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="8" class="pa-4 d-flex flex-column justify-center">
                    <div class="d-flex align-center justify-space-between mb-1">
                      <h3 class="text-h6 font-weight-bold">{{ dish.name }}</h3>
                      <v-chip size="x-small" color="orange" variant="tonal">{{ dish.country }}</v-chip>
                    </div>
                    <p class="text-body-2 text-grey-darken-1 mb-2 line-clamp-2">
                      {{ dish.description || 'No description available' }}
                    </p>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Grid View -->
    <template v-else>
      <div v-for="(dishes, country) in groupedDishes" :key="country" class="country-section mb-10">
        <!-- 国家标题 -->
        <div class="country-header d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-3">
            <v-icon icon="mdi-earth" size="24" color="orange-darken-4" />
            <h2 class="text-h5 font-weight-bold text-grey-darken-4">{{ country }}</h2>
            <v-chip size="small" color="orange" variant="tonal">
              {{ dishes.length }} dishes
            </v-chip>
          </div>
          
          <!-- 只有未选国家时才显示展开/收起按钮 -->
          <v-btn 
            v-if="!selectedCountry"
            size="small" 
            variant="text" 
            color="grey-darken-1"
            @click="toggleCountryExpand(country)"
          >
            {{ expandedCountries.includes(country) ? '▼ Collapse' : '▶ Expand' }}
          </v-btn>
        </div>
        
        <!-- 菜品网格显示逻辑 -->
        <v-expand-transition>
          <div v-if="shouldShowCountryGrid(country)">
            <v-row class="ma-n2">
              <v-col v-for="dish in dishes" :key="dish._id" cols="12" sm="6" md="4" lg="3">
                <v-card 
                  elevation="2" 
                  class="recipe-card-grid rounded-xl" 
                  @click="goToDetail(dish._id)"
                >
                  <div class="card-image-wrapper">
                    <img :src="dish.image || '/images/default-dish.jpg'" :alt="dish.name" />
                    <div class="country-chip">{{ dish.country }}</div>
                    <div
                      class="heart-btn"
                      :class="{ active: isFavourite(dish._id) }"
                      @click.stop="toggleFavourite(dish._id)"
                    >
                      <v-icon :icon="isFavourite(dish._id) ? 'mdi-heart' : 'mdi-heart-outline'" color="red" />
                    </div>
                  </div>
                  <div class="card-content">
                    <h3 class="dish-name">{{ dish.name }}</h3>
                    <p class="dish-desc">{{ dish.description || 'No description available' }}</p>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
        
        <v-divider class="my-6" v-if="country !== Object.keys(groupedDishes).pop()" />
      </div>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useSearchStore } from "@/stores/search";
import { userDataService } from "@/services/userDataService";

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();

// State
const selectedCountry = ref("");
const sortBy = ref("name-asc");
const viewMode = ref("grid");
const loading = ref(true);
const allDishes = ref([]);
const countries = ref([]);
const expandedCountries = ref([]);
const expandedPanels = ref([]);

// Favorites
const favouriteIds = ref([]);
try {
  const stored = localStorage.getItem("favouriteIds");
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) favouriteIds.value = parsed;
  }
} catch (err) {
  console.warn("Failed to parse favouriteIds", err);
  favouriteIds.value = [];
}

// Sort options
const sortOptions = [
  { title: "Name A-Z", value: "name-asc" },
  { title: "Name Z-A", value: "name-desc" },
  { title: "Country A-Z", value: "country-asc" },
  { title: "Newest First", value: "newest" }
];

// Computed: Filtered & Sorted Dishes
const filteredDishes = computed(() => {
  if (!Array.isArray(allDishes.value)) return [];
  
  let list = [...allDishes.value];
  
  // Country filter
  if (selectedCountry.value) {
    list = list.filter(d => d.country === selectedCountry.value);
  }
  
  // Search filter
  if (searchStore.term.trim()) {
    const q = searchStore.term.toLowerCase();
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  }
  
  // Sorting
  switch (sortBy.value) {
    case "name-asc":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      list.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "country-asc":
      list.sort((a, b) => a.country.localeCompare(b.country));
      break;
    case "newest":
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
  }
  
  return list;
});

const groupedDishes = computed(() => {
  const groups = {};
  
  filteredDishes.value.forEach(dish => {
    const country = dish.country || "Unknown";
    if (!groups[country]) groups[country] = [];
    groups[country].push(dish);
  });
  
  return Object.keys(groups).sort().reduce((acc, country) => {
    acc[country] = groups[country];
    return acc;
  }, {});
});

function isFavourite(dishId) {
  if (!Array.isArray(favouriteIds.value)) return false;
  const dishIdStr = String(dishId);
  return favouriteIds.value.some(id => String(id) === dishIdStr);
}

function goToDetail(id) {
  router.push(`/recipe/${id}`);
}

async function toggleFavourite(dishId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please login to save favourites");
    return;
  }
  
  const dish = allDishes.value.find(d => {
    const dId = d._id || d.id;
    return String(dId) === String(dishId);
  });
  if (!dish) return;
  
  const isFav = isFavourite(dishId);
  const dishIdStr = String(dishId);
  
  try {
    if (isFav) {
      const res = await fetch(`/api/favourites/${userId}/${dishId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        favouriteIds.value = favouriteIds.value.filter(id => String(id) !== dishIdStr);
        localStorage.setItem("favouriteIds", JSON.stringify(favouriteIds.value));
      }
    } else {
      const res = await fetch(`/api/favourites/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish })
      });
      
      if (res.ok) {
        const updated = await res.json();
        favouriteIds.value = (updated.dishes?.map(d => String(d._id)) || []).filter(Boolean);
        localStorage.setItem("favouriteIds", JSON.stringify(favouriteIds.value));
      }
    }
  } catch (err) {
    console.error("Failed to toggle favourite", err);
    alert("Failed to save, please try again.");
  }
}

function resetFilters() {
  selectedCountry.value = "";
  searchStore.clear();
  sortBy.value = "name-asc";
  if (route.query.country) {
    router.replace({ query: { ...route.query, country: undefined } });
  }
}

function shouldShowCountryGrid(country) {
  if (selectedCountry.value) {
    return country === selectedCountry.value;
  }
  return expandedCountries.value.includes(country);
}

function toggleCountryExpand(country) {
  if (selectedCountry.value) return;
  
  const idx = expandedCountries.value.indexOf(country);
  if (idx === -1) {
    expandedCountries.value.push(country);
  } else {
    expandedCountries.value.splice(idx, 1);
  }
}

watch(selectedCountry, (newCountry) => {
  if (newCountry) {
    router.replace({ query: { ...route.query, country: newCountry } });
    if (!expandedCountries.value.includes(newCountry)) {
      expandedCountries.value = [newCountry];
      expandedPanels.value = [newCountry];
    }
  } else {
    if (route.query.country) {
      router.replace({ query: { ...route.query, country: undefined } });
    }
    expandedCountries.value = [];
    expandedPanels.value = [];
  }
});

watch(
  () => route.query.country,
  (newCountry) => {
    if (newCountry && newCountry !== selectedCountry.value) {
      selectedCountry.value = newCountry;
    }
  }
);

onMounted(async () => {
  loading.value = true;
  try {
    // ✅ 使用相对路径
    const res = await fetch('/api/recipes');
    const data = await res.json();
    
    // 映射数据，确保每个 dish 都有唯一的 id
    const mappedDishes = Array.isArray(data) ? data.map(d => ({ ...d, id: d.id || d._id })) : [];
    allDishes.value = mappedDishes;
    
    countries.value = [...new Set(mappedDishes.map(d => d.country).filter(Boolean))].sort();
    
    // ✅ 优化图片加载：使用 Promise.allSettled 并行加载，避免索引错位
    const imagePromises = mappedDishes.map(async (dish) => {
      if (!dish.image) {
        try {
          // ✅ 使用相对路径
          const imgRes = await fetch(`/api/dish-image?dish=${encodeURIComponent(dish.name)}&country=${encodeURIComponent(dish.country)}`);
          const imgData = await imgRes.json();
          // 直接修改对象属性，因为 mappedDishes 是响应式数组的引用
          dish.image = imgData.image || "/images/default-dish.jpg";
        } catch (err) {
          dish.image = "/images/default-dish.jpg";
        }
      }
    });
    
    await Promise.allSettled(imagePromises);
    
    // 处理路由参数预过滤
    if (route.query.country) {
      const matchedCountry = countries.value.find(
        c => c.toLowerCase() === route.query.country.toLowerCase()
      );

      if (matchedCountry) {
        selectedCountry.value = matchedCountry;
        expandedCountries.value = [matchedCountry];
        expandedPanels.value = [matchedCountry];
      }
    } else if (countries.value.length > 0) {
      expandedCountries.value = [...countries.value];
      expandedPanels.value = [...countries.value];
    }
  } catch (err) {
    console.error("Failed to load recipes:", err);
    allDishes.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<script>
export default {
  name: "RecipesPage"
}
</script>

<style scoped>
.recipes-container {
  max-width: 1200px;
}

.control-bar {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
}

.w-100 { width: 100%; }
.gap-3 { gap: 12px; }

.country-section {
  padding: 8px 0;
}

.country-header {
  padding: 8px 16px;
  background: rgba(255, 243, 224, 0.5);
  border-radius: 12px;
  border-left: 4px solid #ff9800;
}

.recipe-card-grid {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recipe-card-grid:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.12) !important;
}

.card-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.recipe-card-grid:hover .card-image-wrapper img {
  transform: scale(1.08);
}

.country-chip {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.heart-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2;
}

.heart-btn:hover {
  transform: scale(1.15);
  background: #fff;
}

.heart-btn.active {
  background: #fff;
}

.card-content {
  padding: 14px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dish-name {
  font-size: 1rem;
  font-weight: 700;
  color: #2d3436;
  margin: 0 0 6px;
  line-height: 1.3;
}

.dish-desc {
  font-size: 0.85rem;
  color: #636e72;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.recipe-card-list {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(0,0,0,0.04);
}

.recipe-card-list:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  border-color: rgba(255, 152, 0, 0.3);
}

.list-image-wrapper {
  position: relative;
  height: 100%;
  min-height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.list-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.heart-btn-small {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.heart-btn-small:hover {
  transform: scale(1.1);
}

.heart-btn-small.active {
  background: #fff;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.v-expansion-panel-title) {
  min-height: 56px !important;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 16px 24px !important;
}

@media (max-width: 960px) {
  .card-image-wrapper { height: 160px; }
  .list-image-wrapper { min-height: 80px; }
  .control-bar .v-row { flex-direction: column; }
  .control-bar .v-col { width: 100% !important; margin-bottom: 8px; }
}

@media (max-width: 600px) {
  .control-bar {
    padding: 12px !important;
  }

  .modern-select :deep(.v-field) {
    min-height: 40px !important;
    font-size: 13px !important;
  }

  .view-toggle :deep(.v-btn) {
    min-width: 48px !important;
    height: 40px !important;
  }

  .stats-chip {
    font-size: 12px !important;
    padding: 0 8px !important;
  }
}
</style>