<template>
  <v-container class="py-8 px-4 px-md-8 max-width-1400">
    <!-- 沉浸式头部 -->
    <v-card 
      class="mb-8 rounded-2xl overflow-hidden header-card" 
      elevation="0"
      :style="{ backgroundImage: `linear-gradient(135deg, rgba(255,152,0,0.9), rgba(230,74,25,0.9)), url(${getHeaderImage()})`, backgroundSize: 'cover', backgroundPosition: 'center' }"
    >
      <div class="d-flex flex-column flex-md-row justify-space-between align-start align-md-center pa-6 pa-md-8 gap-4">
        <div class="header-content">
          <div class="d-flex align-center gap-2 mb-3">
            <v-chip size="small" color="white" variant="tonal" prepend-icon="mdi-airplane-takeoff" class="font-weight-bold">
              Food Trip
            </v-chip>
            <div class="d-flex gap-1">
              <v-chip 
                v-for="(country, idx) in trip.countries?.slice(0, 3)" 
                :key="idx"
                size="x-small"
                color="white"
                variant="outlined"
                class="country-chip"
              >
                {{ getCountryFlag(country) }}
              </v-chip>
              <v-chip 
                v-if="(trip.countries?.length || 0) > 3"
                size="x-small"
                color="white"
                variant="outlined"
              >
                +{{ trip.countries.length - 3 }}
              </v-chip>
            </div>
          </div>
          <h1 class="text-h2 font-weight-black text-white mb-2 tracking-tight">
            {{ trip.title }}
          </h1>
          <p class="text-body-1 text-white-opacity d-flex align-center mb-3">
            <v-icon icon="mdi-calendar-range" size="small" class="mr-2" />
            {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
            <span class="mx-3 text-white-opacity-70">•</span>
            <v-icon icon="mdi-earth" size="small" class="mr-2" />
            {{ trip.countries?.join(', ') || 'No countries selected' }}
          </p>
          
          <div class="trip-progress" v-if="trip.days?.length">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-caption text-white font-weight-medium">Trip Progress</span>
              <span class="text-caption font-weight-bold text-white">{{ getTripProgress() }}%</span>
            </div>
            <v-progress-linear
              :model-value="getTripProgress()"
              color="white"
              height="8"
              rounded
              class="rounded-pill"
              bg-color="rgba(255,255,255,0.3)"
            />
          </div>
        </div>
        
        <div class="d-flex gap-3 header-actions">
          <!-- ✨ 智能规划按钮 -->
          <v-btn 
            color="white" 
            variant="elevated"
            size="large"
            rounded="pill"
            prepend-icon="mdi-wand"
            @click="openSmartPlanner"
            class="text-none font-weight-bold"
            :style="{ background: 'linear-gradient(135deg, #FFB74D, #FF5722)', color: 'white' }"
            :loading="planning"
          >
            {{ planning ? 'Planning...' : 'Auto-Plan' }}
          </v-btn>
          
          <v-btn 
            color="white" 
            size="large"
            rounded="pill"
            prepend-icon="mdi-plus"
            @click="addDishToTrip"
            class="text-none font-weight-bold header-btn-primary"
            elevation="4"
          >
            Add Dish
          </v-btn>
          <v-btn 
            color="white" 
            variant="outlined"
            size="large"
            rounded="pill"
            prepend-icon="mdi-delete"
            @click="deleteTrip"
            class="text-none header-btn-secondary"
          >
            Delete
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- 统计概览卡片 -->
    <v-row class="mb-8" v-if="trip.days?.length">
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-orange">
            <v-icon icon="mdi-food-fork-drink" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalDishes }}</div>
            <div class="stat-label">Total Dishes</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-green">
            <v-icon icon="mdi-check-circle" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ tastedDishes }}</div>
            <div class="stat-label">Tasted</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-blue">
            <v-icon icon="mdi-currency-usd" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">${{ totalBudget }}</div>
            <div class="stat-label">Est. Budget</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-purple">
            <v-icon icon="mdi-calendar-check" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ trip.days?.length || 0 }}</div>
            <div class="stat-label">Days Planned</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 标签页切换 -->
    <v-tabs v-model="activeTab" color="orange-darken-4" class="mb-6" show-arrows>
      <v-tab value="timeline">
        <v-icon start>mdi-timeline-text</v-icon>
        Timeline
      </v-tab>
      <v-tab value="budget">
        <v-icon start>mdi-chart-pie</v-icon>
        Budget
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Timeline -->
      <v-window-item value="timeline">
        <!-- 智能规划提示 -->
        <v-alert 
          v-if="!trip.days?.length && trip.countries?.length" 
          type="info" 
          variant="tonal" 
          class="mb-6"
          closable
        >
          <template #prepend>
            <v-icon icon="mdi-wand" />
          </template>
          <div>
            <strong>Tip:</strong> Click "✨ Auto-Plan" above to instantly generate a food itinerary for your trip!
          </div>
        </v-alert>

        <div v-for="(day, index) in sortedDays" :key="day.dayNumber" class="day-section mb-12">
          <div class="d-flex align-start mb-6">
            <div class="timeline-connector mr-4">
              <div class="timeline-line" :class="{ 'first': index === 0, 'last': index === sortedDays.length - 1 }"></div>
              <div class="day-badge">
                <span class="text-h6 font-weight-bold text-white">{{ day.dayNumber }}</span>
              </div>
            </div>
            
            <div class="flex-1">
              <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
                <h2 class="text-h5 font-weight-bold text-grey-darken-4">
                  Day {{ day.dayNumber }}
                  <span v-if="day.date" class="text-body-2 text-grey-darken-1 ml-2 font-weight-regular">
                    ({{ formatDate(day.date) }})
                  </span>
                </h2>
                <div class="d-flex align-center gap-2">
                  <v-chip size="small" variant="tonal" color="orange" class="font-weight-medium">
                    <v-icon start icon="mdi-food-fork-drink" size="14" />
                    ${{ getDayTotal(day) }} Est.
                  </v-chip>
                  <v-btn 
                    size="small"
                    variant="text"
                    color="error"
                    icon="mdi-delete"
                    @click.stop="removeDay(day.dayNumber)"
                    title="Remove this day"
                  />
                </div>
              </div>
              <p class="text-caption text-grey-darken-1">
                {{ day.dishes?.length || 0 }} dishes planned • 
                {{ day.dishes?.filter(d => d.tasted).length || 0 }} tasted
              </p>
            </div>
          </div>

          <draggable 
            v-model="day.dishes" 
            item-key="_id"
            class="d-flex flex-column gap-3"
            @end="saveTrip"
            handle=".drag-handle"
            group="dishes"
          >
            <template #item="{ element: dish }">
              <v-card 
                class="dish-card rounded-xl" 
                elevation="1"
                :class="{ 'tasted-dish': dish.tasted }"
              >
                <v-row no-gutters>
                  <v-col cols="auto" class="pa-4 d-flex align-center justify-center bg-grey-lighten-5">
                    <v-icon icon="mdi-drag" class="drag-handle" style="cursor: grab;" color="grey-darken-1" />
                  </v-col>
                  
                  <v-col cols="auto" class="pa-2">
                    <div class="dish-image-wrapper">
                      <v-avatar size="72" rounded="lg" class="border-thin">
                        <v-img 
                          :key="dish.image || 'placeholder'"
                          :src="dish.image || '/images/default-dish.jpg'" 
                          cover
                          class="dish-image"
                        >
                          <template #placeholder>
                            <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                              <v-icon icon="mdi-food" color="grey-lighten-1" size="32" />
                            </div>
                          </template>
                        </v-img>
                      </v-avatar>
                      <v-chip 
                        v-if="dish.tasted"
                        size="x-small"
                        color="success"
                        variant="flat"
                        class="tasted-badge"
                      >
                        ✓
                      </v-chip>
                    </div>
                  </v-col>

                  <v-col class="pa-4 d-flex flex-column justify-center">
                    <div class="d-flex align-center justify-space-between mb-1">
                      <v-card-title class="text-h6 font-weight-bold py-0 pl-0 pr-2 line-clamp-1">
                        {{ dish.name }}
                      </v-card-title>
                    </div>
                    <v-card-subtitle class="py-0 pl-0 text-body-2 d-flex align-center flex-wrap gap-1">
                      <v-icon icon="mdi-map-marker" size="14" class="mr-1" color="grey" />
                      <span class="text-grey-darken-2">{{ dish.country }}</span>
                      <span v-if="dish.city" class="text-grey-lighten-1">• {{ dish.city }}</span>
                      <span class="mx-2 text-grey-lighten-1">•</span>
                      <span class="font-weight-bold text-orange-darken-4">${{ dish.price || 15 }}</span>
                    </v-card-subtitle>
                  </v-col>

                  <v-col cols="auto" class="pa-4 d-flex align-center gap-1">
                    <v-tooltip :text="dish.tasted ? 'Mark as not tasted' : 'Mark as tasted'">
                      <template #activator="{ props }">
                        <v-btn 
                          v-bind="props"
                          :icon="dish.tasted ? 'mdi-check-circle' : 'mdi-check-circle-outline'"
                          :color="dish.tasted ? 'success' : 'grey-darken-1'"
                          size="small" 
                          variant="text"
                          @click.stop="toggleTasted(dish, day)"
                          class="action-btn"
                        />
                      </template>
                    </v-tooltip>
                    
                    <v-tooltip text="View recipe details">
                      <template #activator="{ props }">
                        <v-btn 
                          v-bind="props"
                          icon="mdi-eye"
                          size="small" 
                          variant="text"
                          color="grey-darken-1"
                          @click.stop="viewDish(dish)"
                          class="action-btn"
                        />
                      </template>
                    </v-tooltip>
                    
                    <v-tooltip text="Remove from day">
                      <template #activator="{ props }">
                        <v-btn 
                          v-bind="props"
                          icon="mdi-close"
                          size="small" 
                          variant="text"
                          color="error"
                          @click.stop="removeDish(dish, day)"
                          class="action-btn"
                        />
                      </template>
                    </v-tooltip>
                  </v-col>
                </v-row>
              </v-card>
            </template>
          </draggable>
          
          <div v-if="!day.dishes?.length" class="empty-day-placeholder mt-4 pa-8 text-center border-dashed rounded-xl bg-grey-lighten-5">
            <div class="empty-day-icon-wrapper">
              <v-icon icon="mdi-food-off" size="48" color="grey-lighten-2" class="mb-2 empty-day-icon" />
            </div>
            <p class="text-grey-darken-1 mb-3">No dishes planned for this day yet.</p>
            <v-btn size="small" variant="tonal" color="orange" @click="addDishToTrip" class="text-none">
              <v-icon start>mdi-plus</v-icon>
              Add a dish
            </v-btn>
          </div>
        </div>

        <div class="text-center mt-8">
          <v-btn 
            variant="outlined" 
            prepend-icon="mdi-plus" 
            @click="addDay" 
            size="large"
            rounded="pill"
            class="text-none add-day-btn"
          >
            Add New Day
          </v-btn>
        </div>
      </v-window-item>

      <!-- Budget Breakdown -->
      <v-window-item value="budget">
        <v-row>
          <!-- 总览卡片 -->
          <v-col cols="12" md="4">
            <v-card class="pa-6" elevation="2" color="orange" dark>
              <div class="text-h6 mb-2">Total Budget</div>
              <div class="text-h3 font-weight-bold">${{ totalBudget }}</div>
              <div class="text-caption mt-2">
                ${{ (totalBudget / (trip.days?.length || 1)).toFixed(0) }} / day
              </div>
            </v-card>
          </v-col>
          
          <!-- 按天预算 -->
          <v-col cols="12" md="8">
            <v-card class="pa-6" elevation="2">
              <h3 class="text-h6 font-weight-bold mb-4">Daily Breakdown</h3>
              <div v-for="day in sortedDays" :key="day.dayNumber" class="mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="font-weight-medium">Day {{ day.dayNumber }}</span>
                  <span class="font-weight-bold text-orange">${{ getDayTotal(day) }}</span>
                </div>
                <v-progress-linear
                  :model-value="trip.days?.length ? (getDayTotal(day) / totalBudget) * 100 : 0"
                  color="orange"
                  height="8"
                  rounded
                />
                <div class="text-caption text-grey mt-1">
                  {{ day.dishes?.length || 0 }} dishes
                </div>
              </div>
            </v-card>
          </v-col>
          
          <!-- 按国家预算表格 -->
          <v-col cols="12">
            <v-card class="pa-6" elevation="2">
              <h3 class="text-h6 font-weight-bold mb-4">Budget by Country</h3>
              <v-data-table
                v-if="countryBudgetData.length"
                :headers="budgetHeaders"
                :items="countryBudgetData"
                hide-default-footer
                class="elevation-0"
              >
                <template #item.total="{ item }">
                  <span class="font-weight-bold text-orange">${{ item.total }}</span>
                </template>
              </v-data-table>
              <div v-else class="text-center py-8 text-grey">
                <v-icon icon="mdi-food-off" size="48" class="mb-2" />
                <p>Add some dishes to see budget breakdown</p>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Smart Planner Dialog -->
    <v-dialog v-model="showPlanner" max-width="700" scrollable>
      <v-card class="rounded-2xl">
        <v-card-title class="d-flex justify-space-between align-center pa-6 border-b">
          <div>
            <span class="text-h5 font-weight-bold">Smart Food Planner</span>
            <p class="text-caption text-grey-darken-1 mt-1">Auto-generate your food itinerary</p>
          </div>
          <v-btn icon @click="showPlanner = false" variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <div class="mb-4">
            <p class="text-body-2 text-grey-darken-1 mb-3">
              This will auto-fill your trip with popular dishes from:
            </p>
            <div class="d-flex flex-wrap gap-2">
              <v-chip 
                v-for="country in trip.countries" 
                :key="country"
                color="orange" 
                variant="tonal"
                size="small"
              >
                {{ getCountryFlag(country) }} {{ country }}
              </v-chip>
            </div>
          </div>
          
          <v-alert type="info" variant="tonal" class="mb-4">
            <template #prepend>
              <v-icon icon="mdi-lightbulb" />
            </template>
            <div>
              <strong>How it works:</strong><br>
              • Groups dishes by city/country<br>
              • Assigns 3 dishes per day<br>
              • You can still edit, drag, or remove dishes after planning
            </div>
          </v-alert>
          
          <v-checkbox 
            v-model="confirmOverwrite"
            label="I understand this will replace my current itinerary"
            hide-details
          />
        </v-card-text>

        <v-card-actions class="pa-6 border-t">
          <v-spacer />
          <v-btn text @click="showPlanner = false" class="text-none">Cancel</v-btn>
          <v-btn 
            color="orange" 
            variant="elevated" 
            @click="executeSmartPlan"
            :disabled="!confirmOverwrite || planning"
            class="text-none"
          >
            <v-icon start>{{ planning ? '' : 'mdi-wand' }}</v-icon>
            {{ planning ? 'Planning...' : 'Generate Itinerary' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dish Selector Dialog -->
    <v-dialog v-model="showDishSelector" max-width="900px" scrollable transition="dialog-bottom-transition">
      <v-card class="rounded-2xl">
        <v-card-title class="d-flex justify-space-between align-center bg-orange-lighten-5 pa-6">
          <div>
            <span class="text-h5 font-weight-bold">Add Dish to {{ trip.title }}</span>
            <p class="text-caption text-grey-darken-1 mt-1">Select from available recipes in your trip countries</p>
          </div>
          <v-btn icon @click="closeDishSelector" variant="text" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <div class="d-flex flex-column flex-md-row gap-4 mb-6">
            <v-text-field
              v-model="dishSearchQuery"
              placeholder="Search dishes by name..."
              prepend-inner-icon="mdi-magnify"
              clearable
              density="comfortable"
              variant="outlined"
              rounded="lg"
              hide-details
              class="flex-grow-1"
            />
            <div v-if="trip.countries?.length > 1" class="d-flex gap-2 flex-wrap align-center">
              <span class="text-caption text-grey-darken-1 mr-2">Filter by:</span>
              <v-chip
                v-for="country in trip.countries"
                :key="country"
                :color="selectedDishCountry === country ? 'orange' : 'grey'"
                :variant="selectedDishCountry === country ? 'tonal' : 'outlined'"
                size="small"
                @click="selectedDishCountry = selectedDishCountry === country ? null : country"
                class="cursor-pointer filter-chip"
              >
                {{ getCountryFlag(country) }} {{ country }}
              </v-chip>
            </div>
          </div>

          <v-row v-if="dishSelectorLoading" justify="center">
            <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4">
              <v-skeleton-loader type="card" height="220" class="rounded-xl" />
            </v-col> 
          </v-row>

          <div v-else-if="filteredAvailableDishes.length === 0" class="text-center py-12">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-food-off</v-icon>
            <h3 class="text-h6 text-grey-darken-2">No dishes found</h3>
            <p class="text-grey">Try adjusting your search or filters</p>
          </div>

          <v-row v-else class="ma-n2">
            <v-col v-for="dish in filteredAvailableDishes" :key="dish._id" cols="12" sm="6" md="4" class="pa-2">
              <v-card
                class="dish-select-card rounded-xl"
                :class="{ 'already-added' : isAlreadyInTrip(dish._id) }"
                elevation="1"
                @click="selectDishFromList(dish)"
              >
                <v-img 
                  :src="dish.image || '/images/default-dish.jpg'" 
                  height="140px" 
                  cover
                  class="rounded-t-xl dish-select-image"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                      <v-icon icon="mdi-food" color="grey-lighten-1" size="32" />
                    </div>
                  </template>
                  <div v-if="isAlreadyInTrip(dish._id)" class="added-overlay d-flex align-center justify-center">
                    <v-chip color="success" variant="flat" prepend-icon="mdi-check" size="small">Added</v-chip>
                  </div>
                </v-img>
                
                <v-card-item class="pa-3">
                  <v-card-title class="text-h6 font-weight-bold py-0 line-clamp-1">{{ dish.name }}</v-card-title>
                  <v-card-subtitle class="py-1 text-body-2 d-flex align-center">
                    <v-icon icon="mdi-map-marker" size="14" class="mr-1" color="grey" />
                    {{ dish.country }}
                    <v-spacer></v-spacer>
                    <span class="font-weight-bold text-orange-darken-4">${{ dish.price || 15 }}</span>
                  </v-card-subtitle>
                </v-card-item>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn text @click="closeDishSelector" class="text-none">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="showSaveSnackbar" color="success" location="bottom" timeout="2000">
      <v-icon start>mdi-check-circle</v-icon>
      Changes saved successfully
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';

const route = useRoute();
const router = useRouter();
const trip = ref({});
const activeTab = ref('timeline');

const showDishSelector = ref(false);
const dishSearchQuery = ref('');
const selectedDishCountry = ref(null);
const availableDishes = ref([]);
const dishSelectorLoading = ref(false);
const showSaveSnackbar = ref(false);

// Smart Planner 状态
const showPlanner = ref(false);
const confirmOverwrite = ref(false);
const planning = ref(false);

// ✅ 坐标缓存（避免重复请求）
const coordsCache = new Map();

// ✅ 获取城市坐标（纯 API 方案）
async function getCityCoordinates(cityName, country) {
  const cacheKey = `${country.toLowerCase()}_${cityName.toLowerCase()}`;
  
  // 1. 先查缓存
  if (coordsCache.has(cacheKey)) {
    return coordsCache.get(cacheKey);
  }
  
  try {
    // 2. 调用后端代理的地理编码接口（使用相对路径）
    const res = await fetch(
      `/api/geocode?location=${encodeURIComponent(`${cityName}, ${country}`)}`
    );
    
    if (res.ok) {
      const data = await res.json();
      const coords = { lat: data.lat, lng: data.lng };
      coordsCache.set(cacheKey, coords);
      return coords;
    }
  } catch (err) {
    console.warn(`Failed to geocode ${cityName}, ${country}`, err);
  }
  
  // 3. API 失败时返回 null（稍后按字母顺序处理）
  return null;
}

const sortedDays = computed(() => {
  return [...(trip.value.days || [])].sort((a, b) => a.dayNumber - b.dayNumber);
});

const existingDishIds = computed(() => {
    return trip.value.days?.flatMap(day => 
        day.dishes?.map(dish => dish._id) || []
    ) || [];
});

const filteredAvailableDishes = computed(() => {
    let list = availableDishes.value;
    if (selectedDishCountry.value) {
        list = list.filter( d => d.country === selectedDishCountry.value);
    }
    if (dishSearchQuery.value.trim()) {
        const q = dishSearchQuery.value.toLowerCase();
        list = list.filter(d => 
            d.name.toLowerCase().includes(q) ||
            d.description?.toLowerCase().includes(q)
        );
    }
    return list;
});

const totalDishes = computed(() => {
  return trip.value.days?.reduce((sum, day) => sum + (day.dishes?.length || 0), 0) || 0;
});

const tastedDishes = computed(() => {
  return trip.value.days?.reduce((sum, day) => 
    sum + (day.dishes?.filter(d => d.tasted).length || 0), 0) || 0;
});

const totalBudget = computed(() => {
  return trip.value.days?.reduce((sum, day) => 
    sum + day.dishes?.reduce((dSum, d) => dSum + (d.price || 15), 0) || 0, 0) || 0;
});

// Budget 标签页所需
const budgetHeaders = [
  { title: 'Country', key: 'country' },
  { title: 'Dishes', key: 'dishes' },
  { title: 'Total', key: 'total', align: 'end' },
  { title: '% of Budget', key: 'percentage', align: 'end' }
];

const countryBudgetData = computed(() => {
  const data = {};
  
  trip.value.days?.forEach(day => {
    day.dishes?.forEach(dish => {
      if (!data[dish.country]) {
        data[dish.country] = { country: dish.country, dishes: 0, total: 0 };
      }
      data[dish.country].dishes++;
      data[dish.country].total += dish.price || 15;
    });
  });
  
  return Object.values(data).map(item => ({
    ...item,
    percentage: totalBudget.value > 0 
      ? `${((item.total / totalBudget.value) * 100).toFixed(1)}%` 
      : '0%'
  }));
});

function getDayTotal(day) {
  return day.dishes?.reduce((sum, d) => sum + (d.price || 15), 0) || 0;
}

function isAlreadyInTrip(dishId) {
    return existingDishIds.value.includes(dishId);
}

function getHeaderImage() {
  const country = trip.value.countries?.[0];
  const images = {
    'Japan': 'https://images.unsplash.com/photo-1545569341-9eb8b6f9f2ff?w=1200',
    'Thailand': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=1200',
    'Italy': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    'Mexico': 'https://images.unsplash.com/photo-1565299585325-2435d3947643?w=1200',
    'India': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200',
    'China': 'https://images.unsplash.com/photo-1563240670-a7c7fac1b778?w=1200',
    'USA': 'https://images.unsplash.com/photo-1565299627863-3a9c2f7b5c8e?w=1200'
  };
  return images[country] || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200';
}

function getCountryFlag(country) {
  const flags = {
    'Malaysia': '🇲🇾', 'Japan': '🇯', 'Thailand': '🇹🇭',
    'China': '🇨', 'India': '🇳', 'Italy': '🇮',
    'France': '🇫🇷', 'USA': '🇺🇸', 'Mexico': '🇲',
    'Spain': '🇪🇸', 'UK': '🇬', 'Germany': '🇪',
    'Korea': '🇰🇷', 'Vietnam': '🇻', 'Singapore': '🇬'
  };
  return flags[country] || '🌍';
}

function getTripProgress() {
  if (!trip.value.days?.length) return 0;
  const total = trip.value.days.reduce((sum, day) => 
    sum + (day.dishes?.length || 0), 0);
  if (total === 0) return 0;
  const tasted = trip.value.days.reduce((sum, day) => 
    sum + (day.dishes?.filter(d => d.tasted).length || 0), 0);
  return Math.round((tasted / total) * 100);
}

// ✨ Smart Planner 核心函数（纯 API 地理排序）
async function openSmartPlanner() {
  if (!trip.value.countries?.length) {
    alert("Please add countries to your trip settings first!");
    return;
  }
  confirmOverwrite.value = false;
  showPlanner.value = true;
}

async function executeSmartPlan() {
  if (!confirmOverwrite.value) return;
  
  planning.value = true;
  
  try {
    // 1. 加载相关菜谱（使用相对路径）
    const countriesParam = trip.value.countries.join(',');
    const res = await fetch(`/api/recipes?countries=${countriesParam}`);
    const data = await res.json();

    // 2. 双重过滤 - 确保只使用行程中的国家
    const tripCountries = new Set(trip.value.countries.map(c => c.toLowerCase()));
    const filteredData = data.filter(dish => {
      const dishCountry = (dish.country || '').toLowerCase();
      return tripCountries.has(dishCountry);
    });

    // 3. 按国家 + 城市分组
    const countryGroups = {};
    filteredData.forEach(dish => {
      const country = dish.country;
      const city = dish.city || country; // 如果没有 city，用 country 代替
      
      if (!countryGroups[country]) {
        countryGroups[country] = {};
      }
      if (!countryGroups[country][city]) {
        countryGroups[country][city] = [];
      }
      countryGroups[country][city].push(dish);
    });

    // 4. 智能排序：先按国家，再按城市地理坐标
    const sortedDays = [];
    
    // 4.1 按行程中的国家顺序处理（用户指定的顺序）
    for (const country of trip.value.countries) {
      const cities = countryGroups[country];
      if (!cities) continue;
      
      // 4.2 获取所有城市的坐标
      const cityCoords = [];
      for (const cityName of Object.keys(cities)) {
        const coords = await getCityCoordinates(cityName, country);
        cityCoords.push({
          name: cityName,
          dishes: cities[cityName],
          lat: coords?.lat ?? 0,
          lng: coords?.lng ?? 0,
          hasCoords: !!coords
        });
      }
      
      // 4.3 同一国家内排序：有坐标的按纬度（北→南），没坐标的按字母顺序放最后
      cityCoords.sort((a, b) => {
        // 有坐标的优先
        if (a.hasCoords && !b.hasCoords) return -1;
        if (!a.hasCoords && b.hasCoords) return 1;
        // 都有坐标：按纬度从北到南排序
        if (a.hasCoords && b.hasCoords) {
          return b.lat - a.lat;
        }
        // 都没坐标：按字母顺序
        return a.name.localeCompare(b.name);
      });
      
      // 4.4 填充行程（每个城市最多 3 道菜）
      for (const city of cityCoords) {
        const selectedDishes = city.dishes.slice(0, 3).map(d => ({
          _id: d._id,
          name: d.name,
          country: d.country,
          city: d.city,
          image: d.image || '/images/default-dish.jpg',
          price: d.price || 15,
          tasted: false
        }));

        if (selectedDishes.length > 0) {
          sortedDays.push({
            dayNumber: sortedDays.length + 1,
            dishes: selectedDishes
          });
        }
      }
    }

    // 5. 应用到行程
    trip.value.days = sortedDays;

    // 6. 保存
    await saveTrip();
    showPlanner.value = false;
    
  } catch (err) {
    console.error("Smart Plan failed:", err);
    alert("Failed to generate itinerary. Please try again.");
  } finally {
    planning.value = false;
  }
}

async function openDishSelector() {
    showDishSelector.value = true;
    dishSearchQuery.value = '';
    selectedDishCountry.value = null;
    if (availableDishes.value.length === 0) {
        await loadAvailableDishes();
    }
}

async function loadAvailableDishes() {
    dishSelectorLoading.value = true;
    try {
        const countriesParam = trip.value.countries?.join(',') || '';
        // ✅ 使用相对路径
        const url = countriesParam
            ? `/api/recipes?countries=${countriesParam}`
            : '/api/recipes';
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            
            availableDishes.value = trip.value.countries?.length > 0
                ? data.filter(d => {
                    const dishCountry = (d.country || '').toLowerCase();
                    return trip.value.countries.some(c => c.toLowerCase() === dishCountry);
                  })
                : data;

            await loadAvailableDishImages();
        }
    } catch (err) {
        console.error("Failed to load dishes", err);
    } finally {
        dishSelectorLoading.value = false;
    }
}

async function loadAvailableDishImages() {
    const dishesToLoad = availableDishes.value.filter(d => !d.image);
    
    if (dishesToLoad.length === 0) return;
    
    const imagePromises = dishesToLoad.map(async (dish) => {
        try {
            // ✅ 使用相对路径
            const imgRes = await fetch(
                `/api/dish-image?dish=${encodeURIComponent(dish.name)}&country=${encodeURIComponent(dish.country)}`
            );
            const imgData = await imgRes.json();
            
            const index = availableDishes.value.findIndex(d => d._id === dish._id);
            if (index !== -1) {
                availableDishes.value[index].image = imgData.image || '/images/default-dish.jpg';
            }
        } catch (err) {
            console.warn(`Failed to load image for ${dish.name}`, err);
            const index = availableDishes.value.findIndex(d => d._id === dish._id);
            if (index !== -1) {
                availableDishes.value[index].image = '/images/default-dish.jpg';
            }
        }
    });
    
    await Promise.allSettled(imagePromises);
}

function selectDishFromList(dish) {
    if (isAlreadyInTrip(dish._id)) {
        alert(`${dish.name} is already in this trip`);
        return;
    }
    const dayNumbers = trip.value.days?.map(d => d.dayNumber) || [1];
    const dayNumber = prompt(
        `Add "${dish.name}" to which day?`,
         dayNumbers.length > 0 ? dayNumbers[0] : `1`
    );
    if (!dayNumber) return;
    const day = trip.value.days?.find(d => d.dayNumber == dayNumber);
    if (!day) {
        alert(`Day ${dayNumber} not found`);
        return;
    }
    day.dishes = [...(day.dishes || []), {
        _id: dish._id,
        name: dish.name,
        country: dish.country,
        image: dish.image,
        price: dish.price || 15,
        tasted: false
    }];
    saveTrip();
    closeDishSelector();
}

function closeDishSelector() {
    showDishSelector.value = false;
    dishSearchQuery.value = '';
    selectedDishCountry.value = null;
}

onMounted(async () => {
    const tripId = route.params.id;
    if (!tripId) {
        console.error("No trip ID in route");
        return;
    }
    await loadTrip(tripId);
    await loadDishImages();
});

async function loadTrip(tripId) {
  const userId = localStorage.getItem("userId");
  if (!userId || !tripId) return;
  
  try {
    console.log('📥 Loading trip:', tripId);
    // ✅ 使用相对路径
    const res = await fetch(`/api/trips/${userId}/${tripId}`);
    if (res.ok) {
      const tripData = await res.json();
      console.log('✅ Trip loaded:', tripData);
      console.log('📊 Days count:', tripData.days?.length);
      
      // 检查第一天第一道菜的数据
      if (tripData.days?.[0]?.dishes?.[0]) {
        const firstDish = tripData.days[0].dishes[0];
        console.log('🍽️ First dish:', {
          name: firstDish.name,
          image: firstDish.image,
          hasImage: !!firstDish.image
        });
      }
      
      trip.value = tripData;
      
      // 等待 Vue 响应式更新后再加载图片
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadDishImages();
    } else {
      console.error('Failed to load trip:', res.status);
    }
  } catch (err) {
    console.error("Failed to load trip", err);
  }
}

async function loadDishImages() {
  if (!trip.value.days?.length) {
    console.log('⚠️ No days to load images for');
    return;
  }

  console.log('🖼️ Loading images for', trip.value.days.length, 'days');
  
  // ✅ 修复：不仅检查空字符串，还要检查是否是默认图片路径
  const defaultImagePath = '/images/default-dish.jpg';
  
  const updatedDays = await Promise.all(
    trip.value.days.map(async (day, dayIndex) => {
      const updatedDishes = await Promise.all(
        day.dishes.map(async (dish, dishIndex) => {
          // ✅ 修复：如果是默认图片路径，也要重新获取真实图片
          const needsImage = !dish.image || 
                            dish.image === '' || 
                            dish.image.trim() === '' ||
                            dish.image === defaultImagePath ||
                            dish.image.includes('default-dish');
          
          if (needsImage) {
            console.log(`🔄 Loading image for Day ${day.dayNumber}, Dish ${dishIndex + 1}: ${dish.name}`);
            
            try {
              // ✅ 使用相对路径
              const imgRes = await fetch(
                `/api/dish-image?dish=${encodeURIComponent(dish.name)}&country=${encodeURIComponent(dish.country)}`
              );
              const imgData = await imgRes.json();
              
              console.log(`✅ Image loaded for ${dish.name}:`, imgData.image);
              
              // ✅ 返回新对象，使用 API 返回的真实图片（保持相对路径或完整 URL）
              return { 
                ...dish, 
                image: imgData.image || defaultImagePath 
              };
            } catch (err) {
              console.warn(`❌ Failed to load image for ${dish.name}`, err);
              return { 
                ...dish, 
                image: defaultImagePath 
              };
            }
          }
          
          // 已有真实图片，保持原样（Express 会处理相对路径）
          return dish;
        })
      );
      return { ...day, dishes: updatedDishes };
    })
  );

  console.log('🔄 Updating trip.value.days...');
  trip.value.days = updatedDays;
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('✅ Days updated');
  if (trip.value.days[0]?.dishes[0]) {
    console.log('🍽️ First dish after update:', {
      name: trip.value.days[0].dishes[0].name,
      image: trip.value.days[0].dishes[0].image
    });
  }
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDishToTrip() {
    openDishSelector();
}

function toggleTasted(dish, day) {
  dish.tasted = !dish.tasted;
  saveTrip();
}

function viewDish(dish) {
  if (dish._id && !dish._id.startsWith('temp-')) {
    router.push(`/recipe/${dish._id}`);
  } else {
    alert("Recipe details not available for this dish");
  }
}

function removeDish(dish, day) {
  if (confirm(`Remove "${dish.name}" from Day ${day.dayNumber}?`)) {
    day.dishes = (day.dishes || []).filter(d => d._id !== dish._id);
    saveTrip();
  }
}

function addDay() {
    const days = trip.value.days || [];
    const dayNumbers = days
    .map(d => d.dayNumber)
    .filter(n => typeof n === 'number' && !isNaN(n));
    const maxDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 0;
    trip.value.days = [
        ...days,
        { dayNumber: maxDay + 1, dishes: [] }
    ];
    saveTrip();
}

function removeDay(dayNumber) {
  if (!confirm(`Are you sure you want to remove Day ${dayNumber}? This will also remove all dishes planned for that day.`)) {
    return;
  }
  
  trip.value.days = (trip.value.days || []).filter(d => d.dayNumber !== dayNumber);

  trip.value.days = trip.value.days
  .sort((a, b) => a.dayNumber - b.dayNumber)
  .map((day, idx) => ({ ...day, dayNumber: idx + 1 }));

  saveTrip();
}

async function saveTrip() {
  const userId = localStorage.getItem("userId");
  const tripId = route.params.id;
  if (!userId || !tripId) return;
  
  try {
    // ✅ 使用相对路径
    await fetch(`/api/trips/${userId}/${tripId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: trip.value.days })
    });
    showSaveSnackbar.value = true;
    await loadDishImages();
  } catch (err) {
    console.error("Failed to save trip", err);
  }
}

async function deleteTrip() {
  if (!confirm("Delete this entire trip?")) return;
  
  const userId = localStorage.getItem("userId");
  const tripId = route.params.id;
  if (!userId || !tripId) return;
  try {
    // ✅ 使用相对路径
    await fetch(`/api/trips/${userId}/${tripId}`, {
      method: "DELETE"
    });
    router.push('/trips');
  } catch (err) {
    console.error("Failed to delete trip", err);
  }
}
</script>

<style scoped>
/* 样式部分保持不变，与之前相同 */
.max-width-1400 { max-width: 1400px; margin: 0 auto; }
.tracking-tight { letter-spacing: -0.025em; }
.gap-4 { gap: 16px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.flex-1 { flex: 1; min-width: 0; }

.header-card {
  position: relative;
  color: white;
}
.header-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,152,0,0.85) 0%, rgba(230,74,25,0.85) 100%);
  z-index: 1;
}
.header-content { position: relative; z-index: 2; max-width: 700px; }
.header-actions { position: relative; z-index: 2; }
.header-btn-primary {
  background: white !important;
  color: #e64a19 !important;
  transition: transform 0.2s ease;
}
.header-btn-primary:hover { transform: translateY(-2px); }
.header-btn-secondary {
  border-color: rgba(255,255,255,0.5) !important;
  color: white !important;
  transition: all 0.2s ease;
}
.header-btn-secondary:hover {
  background: rgba(255,255,255,0.1) !important;
  border-color: white !important;
}
.text-white-opacity { color: rgba(255, 255, 255, 0.95); }
.text-white-opacity-70 { color: rgba(255, 255, 255, 0.7); }
.country-chip { border-color: rgba(255,255,255,0.6) !important; color: white !important; font-size: 12px; }
.trip-progress { max-width: 400px; margin-top: 8px; }

.stat-card {
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon.bg-orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
.stat-icon.bg-green { background: linear-gradient(135deg, #4caf50, #388e3c); }
.stat-icon.bg-blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
.stat-icon.bg-purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
.stat-content { flex: 1; }
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #2d3436;
  line-height: 1.2;
  margin-bottom: 2px;
}
.stat-label {
  font-size: 12px;
  color: #636e72;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeline-connector {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: linear-gradient(to bottom, #ff9800, #ff5722);
  opacity: 0.3;
}

.timeline-line.first { top: 24px; bottom: 50%; }
.timeline-line.last { top: 50%; bottom: 0; }
.timeline-line:first-child:last-child { display: none; }
.day-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.35);
  position: relative;
  z-index: 2;
  transition: transform 0.2s ease;
}
.day-section:hover .day-badge { transform: scale(1.05); }

.dish-card {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(0,0,0,0.04);
}
.dish-card:hover {
  transform: translateX(6px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
  border-color: rgba(255, 87, 34, 0.25);
}
.dish-card.tasted-dish {
  background: linear-gradient(to right, #f1f8e9, #ffffff);
  border-left: 4px solid #4caf50;
}
.dish-image-wrapper { position: relative; }
.dish-image { transition: transform 0.3s ease; }
.dish-card:hover .dish-image { transform: scale(1.05); }
.tasted-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.action-btn { transition: transform 0.15s ease; }
.action-btn:active { transform: scale(0.9); }
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-day-placeholder {
  transition: all 0.3s ease;
}
.empty-day-placeholder:hover {
  background: #fff3e0 !important;
  border-color: #ffccbc !important;
}
.empty-day-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-day-icon { animation: pulse 2s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}

.dish-select-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}
.dish-select-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.12) !important;
}
.dish-select-card.already-added {
  opacity: 0.65;
  filter: grayscale(0.7);
  cursor: not-allowed;
}
.dish-select-card.already-added:hover { transform: none; }
.dish-select-image { transition: transform 0.3s ease; }
.dish-select-card:hover .dish-select-image { transform: scale(1.03); }
.added-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.filter-chip { transition: all 0.2s ease; }
.filter-chip:hover { transform: translateY(-2px); }

.border-thin { border: 1px solid rgba(0,0,0,0.08); }
.border-dashed { border: 2px dashed #e0e0e0; }
.cursor-pointer { cursor: pointer; }
.shadow-sm { box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; }

@media (max-width: 768px) {
  .header-card .pa-6 { padding: 24px !important; }
  .text-h2 { font-size: 1.75rem !important; }
  .header-actions { width: 100%; justify-content: center; }
  .header-btn-primary, .header-btn-secondary {
    flex: 1;
    max-width: 200px;
    justify-content: center;
  }
  .timeline-connector { margin-right: 12px !important; }
  .day-badge { width: 40px; height: 40px; }
  .dish-card .v-row > .v-col { padding: 8px !important; }
  .dish-image-wrapper .v-avatar { width: 56px !important; height: 56px !important; }
}

@media (max-width: 480px) {
  .header-card .pa-6 { padding: 20px 16px !important; }
  .text-h2 { font-size: 1.5rem !important; }
  .header-actions { flex-direction: column; gap: 12px !important; }
  .stat-card { padding: 16px 12px; }
  .stat-value { font-size: 22px; }
}
</style>

<script>
export default {
  name: "TripDetail"
}
</script>