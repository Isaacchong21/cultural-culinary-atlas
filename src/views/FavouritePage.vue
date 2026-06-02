<template>
  <v-container class="py-10 px-4 px-md-8 max-width-1400">
    <!-- Header -->
    <v-row justify="center" class="mb-8">
      <v-col cols="12" md="10" class="text-center">
        <h1 class="text-h3 font-weight-black mb-2 text-grey-darken-4">My Favourites</h1>

        <!-- 控制栏：排序 + 视图切换 + 统计 -->
        <v-sheet rounded="xl" elevation="3" class="pa-4 control-bar" v-if="favouriteDishes.length > 0">
          <v-row align="center" justify="center" class="ma-n2">
            <!-- 排序 -->
            <v-col cols="12" sm="4" class="px-2">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Sort by"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-sort"
              ></v-select>
            </v-col>
            
            <v-col cols="12" sm="3" class="px-2">
              <v-btn-toggle
                v-model="viewMode"
                variant="outlined"
                density="comfortable"
                mandatory
                class="w-100"
              >
                <v-btn value="grid" icon="mdi-view-grid" title="Grid View" />
                <v-btn value="list" icon="mdi-view-list" title="List View" />
              </v-btn-toggle>
            </v-col>
            
            <!-- 统计 -->
            <v-col cols="12" sm="3" class="px-2">
              <v-chip variant="tonal" color="orange" class="font-weight-bold">
                <v-icon start>mdi-heart</v-icon>
                {{ favouriteDishes.length }} saved
              </v-chip>
            </v-col>
            
            <v-col cols="12" sm="2" class="px-2">
              <v-chip variant="tonal" color="primary">
                <v-icon start>mdi-earth</v-icon>
                {{ favouriteCountries.length }} countries
              </v-chip>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading" justify="center">
      <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" :height="viewMode === 'grid' ? 320 : 120" class="rounded-xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-else-if="favouriteDishes.length === 0" class="text-center py-16 empty-state">
      <div class="empty-icon-wrapper">
        <v-icon icon="mdi-heart-off" size="80" color="grey-lighten-2" />
      </div>
      <h3 class="text-h5 text-grey-darken-2 font-weight-bold mt-6 mb-3">No favourites yet</h3>
      <p class="text-grey mb-8 max-width-400 mx-auto">
        Explore recipes from around the world and save the ones you love to your personal collection.
      </p>
      <v-btn 
        color="orange-darken-4"
        size="large"
        rounded="pill"
        prepend-icon="mdi-compass"
        to="/recipes"
        class="text-none font-weight-bold"
        elevation="2"
      >
        Explore Recipes
      </v-btn>
    </div>

    <!-- ✅ 列表视图：扁平列表（无分组） -->
    <v-list v-if="viewMode === 'list' && favouriteDishes.length > 0" class="bg-transparent pa-0" lines="two">
      <v-list-item
        v-for="dish in favouriteDishes"
        :key="dish._id"
        :value="dish._id"
        class="mb-3 rounded-xl favourite-item"
        @click="goToDetail(dish._id)"
      >
        <template #prepend>
          <v-avatar size="80" rounded="lg" class="border-thin">
            <v-img :src="dish.image" :alt="dish.name" cover>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                  <v-icon icon="mdi-food" color="grey-lighten-1" size="32" />
                </div>
              </template>
            </v-img>
          </v-avatar>
        </template>

        <v-list-item-title class="font-weight-bold text-body-1 mb-1">{{ dish.name }}</v-list-item-title>
        <v-list-item-subtitle class="text-grey-darken-1 mb-2">
          {{ dish.description || 'A delightful traditional recipe' }}
        </v-list-item-subtitle>
        
        <div class="d-flex align-center justify-space-between mt-1">
          <v-chip size="small" color="orange" variant="tonal" class="font-weight-medium">
            <v-icon start icon="mdi-earth" size="14" />
            {{ dish.country }}
          </v-chip>
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-grey">View Recipe</span>
            <v-icon icon="mdi-arrow-right" size="16" color="orange" />
          </div>
        </div>

        <template #append>
          <v-btn
            icon="mdi-heart"
            size="small"
            color="red"
            variant="tonal"
            class="ml-2 remove-btn"
            @click.stop="toggleFavourite(dish._id)"
            aria-label="Remove from favourites"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- ✅ 网格视图：扁平网格（无分组） -->
    <v-row v-else-if="viewMode === 'grid' && favouriteDishes.length > 0" class="ma-n2">
      <v-col v-for="dish in favouriteDishes" :key="dish._id" cols="12" sm="6" md="4" lg="3">
        <v-card 
          elevation="2" 
          class="recipe-card-grid rounded-xl" 
          @click="goToDetail(dish._id)"
        >
          <div class="card-image-wrapper">
            <v-img :src="dish.image" :alt="dish.name" height="220px" cover>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                  <v-progress-circular indeterminate color="grey" size="40"></v-progress-circular>
                </div>
              </template>
            </v-img>
            
            <!-- ✅ 小国家标签（轻量级归属标识） -->
            <div class="country-chip">{{ dish.country }}</div>
            
            <button
              class="heart-btn"
              :class="{ active: true, clicked: isAnimating[dish._id] }"
              @click.stop="toggleFavourite(dish._id)"
              aria-label="Remove from favourites"
            >
              <v-icon icon="mdi-heart" color="red" />
            </button>
          </div>
          
          <div class="card-body">
            <h3 class="dish-title">{{ dish.name }}</h3>
            <p class="dish-desc">{{ dish.description || 'A delightful traditional recipe' }}</p>
            <div class="card-footer">
              <span class="view-link">View Recipe <v-icon icon="mdi-arrow-right" size="14" /></span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// State
const sortBy = ref("name-asc");
const viewMode = ref("grid");
const favourites = ref([]);
const allDishes = ref([]);
const loading = ref(true);
const isAnimating = ref({});

// Sort options
const sortOptions = [
  { title: "Name A-Z", value: "name-asc" },
  { title: "Name Z-A", value: "name-desc" },
  { title: "Country A-Z", value: "country-asc" },
  { title: "Recently Added", value: "newest" }
];

// Computed: Favourite Dishes (sorted)
const favouriteDishes = computed(() => {
  if (!Array.isArray(allDishes.value)) return [];
  
  let list = [...allDishes.value];
  
  // 过滤：只保留在 favourites 数组中的菜品
  list = list.filter(d => 
    favourites.value.some(favId => favId === (d._id || d.id))
  );
  
  // 排序
  switch (sortBy.value) {
    case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "name-desc": list.sort((a, b) => b.name.localeCompare(a.name)); break;
    case "country-asc": list.sort((a, b) => a.country.localeCompare(b.country)); break;
    case "newest": list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
  }
  
  return list;
});

// Computed: Unique countries in favourites
const favouriteCountries = computed(() => {
  const countries = new Set();
  favouriteDishes.value.forEach(dish => {
    if (dish.country) countries.add(dish.country);
  });
  return Array.from(countries);
});

function goToDetail(id) {
  router.push(`/recipe/${id}`);
}

async function loadUserFavourites() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    favourites.value = [];
    return;
  }

  try {
    const res = await fetch(`/api/favourites/${userId}`);
    if (res.ok) {
      const data = await res.json();
      favourites.value = data.dishes?.map(d => d._id) || [];
    }
  } catch (err) {
    console.error("Failed to load favourites:", err);
    favourites.value = [];
  }
}

// ✅ 修复后的 toggleFavourite 函数
async function toggleFavourite(dishId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please login to save favourites");
    return;
  }

  isAnimating.value[dishId] = true;
  setTimeout(() => { isAnimating.value[dishId] = false; }, 300);
  
  const dish = allDishes.value.find(d => d._id === dishId || d.id === dishId);
  if (!dish) return;

  // ✅ 判断当前是否已收藏
  const isFav = favourites.value.includes(dishId);

  try {
    let res;
    if (isFav) {
      // ❌ 已收藏 → 调用 DELETE 接口移除
      res = await fetch(`/api/favourites/${userId}/${dishId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        // ✅ 从本地数组移除
        favourites.value = favourites.value.filter(id => id !== dishId);
      }
    } else {
      // ✅ 未收藏 → 调用 POST 接口添加
      res = await fetch(`/api/favourites/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish })
      });
      
      if (res.ok) {
        const updated = await res.json();
        favourites.value = updated.dishes?.map(d => d._id) || [];
      }
    }
    
    if (!res.ok) {
      throw new Error("Failed to update favourites");
    }
    
  } catch (err) {
    console.error("Failed to toggle favourite:", err);
    alert("Failed to update favourites");
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    allDishes.value = Array.isArray(data) ? data.map(d => ({ ...d, id: d.id || d._id })) : [];
    
    // Image lazy loading
    const imagePromises = allDishes.value.map(async (dish, index) => {
      if (!dish.image) {
        try {
          const imgRes = await fetch(`/api/dish-image?dish=${encodeURIComponent(dish.name)}&country=${encodeURIComponent(dish.country)}`);
          const imgData = await imgRes.json();
          allDishes.value[index].image = imgData.image || "/images/default-dish.jpg";
        } catch (err) {
          allDishes.value[index].image = "/images/default-dish.jpg";
        }
      }
    });
    
    await Promise.allSettled(imagePromises);
    await loadUserFavourites();

  } catch (err) {
    console.error("Failed to load recipes:", err);
    allDishes.value = [];
  } finally {
    loading.value = false;
  }
});

onActivated(() => {
  if (!loading.value && allDishes.value.length > 0) {
    loadUserFavourites();
  }
})
</script>

<script>
export default { name: "FavouritesPage" }
</script>

<style scoped>
.max-width-1400 { max-width: 1400px; margin: 0 auto; }
.max-width-400 { max-width: 400px; }
.w-100 { width: 100%; }
.gap-2 { gap: 8px; }
.border-thin { border: 1px solid rgba(0,0,0,0.08); }

.control-bar {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
}

.recipe-card-grid {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.35s ease;
  border: 1px solid rgba(0,0,0,0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.recipe-card-grid:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.12) !important;
}
.card-image-wrapper { position: relative; height: 220px; overflow: hidden; }
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
  z-index: 2;
}
.heart-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2;
}
.heart-btn:hover { transform: scale(1.15); background: #fff; }
.heart-btn.active { background: #fff; }
.heart-btn.clicked { animation: heartPop 0.3s ease; }
.card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.dish-title { font-size: 1rem; font-weight: 700; color: #2d3436; margin: 0 0 6px; line-height: 1.3; }
.dish-desc {
  font-size: 0.85rem;
  color: #636e72;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
.card-footer { margin-top: auto; }
.view-link { font-size: 0.85rem; color: #ff5722; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }

.favourite-item {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}
.favourite-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  border-color: rgba(255, 152, 0, 0.3);
}
.remove-btn { transition: transform 0.2s ease; }
.remove-btn:hover { transform: scale(1.1); }

.empty-state {
  background: linear-gradient(to bottom, #fff3e0, #ffffff);
  border-radius: 24px;
  border: 2px dashed #ffe0b2;
}
.empty-icon-wrapper {
  width: 100px;
  height: 100px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

@keyframes heartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@media (max-width: 960px) {
  .card-image-wrapper { height: 180px; }
  .control-bar .v-row { flex-direction: column; }
  .control-bar .v-col { width: 100% !important; margin-bottom: 8px; }
}
@media (max-width: 600px) {
  .favourite-item { flex-direction: column; align-items: flex-start !important; }
  .favourite-item :deep(.v-list-item__append) { align-self: flex-end; margin-top: 12px; }
}
</style>