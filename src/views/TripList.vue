<template>
  <v-container class="py-10 px-4 px-md-8 max-width-1400">
    <!-- 增强版头部区域 -->
    <div class="page-header mb-10">
      <div class="header-content">
        <div class="header-icon-wrapper">
          <v-icon icon="mdi-airplane-takeoff" size="48" color="white" />
        </div>
        <div>
          <h1 class="text-h2 font-weight-black text-white mb-2 tracking-tight">
            My Food Trips
          </h1>
          <p class="text-body-1 text-white-opacity">
            Plan your culinary adventures around the world
          </p>
        </div>
      </div>
      <v-btn 
        color="white" 
        size="large"
        rounded="pill"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
        class="text-none font-weight-bold header-btn"
        elevation="4"
      >
        New Trip
      </v-btn>
      <!-- 装饰元素 -->
      <div class="header-decoration">
        <v-icon icon="mdi-food" size="32" class="deco-icon-1" />
        <v-icon icon="mdi-compass" size="24" class="deco-icon-2" />
        <v-icon icon="mdi-map-marker" size="28" class="deco-icon-3" />
      </div>
    </div>

    <!-- 统计概览卡片（仅当有行程时显示） -->
    <v-row class="mb-8" v-if="trips.length > 0 && !loading">
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-blue">
            <v-icon icon="mdi-map" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ trips.length }}</div>
            <div class="stat-label">Total Trips</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-orange">
            <v-icon icon="mdi-earth" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCountries }}</div>
            <div class="stat-label">Countries</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-green">
            <v-icon icon="mdi-food-fork-drink" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalDishes }}</div>
            <div class="stat-label">Dishes</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" elevation="2">
          <div class="stat-icon bg-purple">
            <v-icon icon="mdi-calendar-check" size="24" color="white" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalDays }}</div>
            <div class="stat-label">Days Planned</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 加载状态 -->
    <v-row v-if="loading" justify="center">
      <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4">
        <v-skeleton-loader type="card" height="320" class="rounded-2xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- 空状态 - 增强版 -->
    <div v-else-if="trips.length === 0" class="empty-state">
      <div class="empty-illustration">
        <v-icon icon="mdi-map-marker-radius" size="100" color="orange" class="main-icon" />
        <div class="floating-icons">
          <v-icon icon="mdi-food" size="36" color="orange-lighten-2" class="float-icon-1" />
          <v-icon icon="mdi-airplane" size="32" color="orange-lighten-1" class="float-icon-2" />
          <v-icon icon="mdi-compass" size="36" color="orange" class="float-icon-3" />
        </div>
      </div>
      <h2 class="text-h3 font-weight-bold text-grey-darken-3 mt-6 mb-3">
        Start Your Food Journey
      </h2>
      <p class="text-body-1 text-grey mb-8 max-width-500 mx-auto">
        Create your first culinary adventure and discover amazing dishes from around the world
      </p>
      <v-btn 
        color="orange" 
        size="x-large" 
        rounded="pill" 
        variant="tonal"
        prepend-icon="mdi-compass"
        @click="openCreateDialog"
        class="text-none font-weight-bold"
        elevation="3"
      >
        Create First Trip
      </v-btn>
    </div>

    <!-- 行程卡片网格 - 增强版 -->
    <v-row v-else class="ma-n3">
      <v-col v-for="trip in trips" :key="trip._id" cols="12" sm="6" md="4" class="pa-3">
        <v-card 
          class="trip-card rounded-2xl"
          elevation="0"
          @click="viewTrip(trip._id)"
        >
          <!-- 卡片顶部彩色装饰条 -->
          <div class="card-top-decoration" :style="{ background: getTripColor(trip) }"></div>
          
          <!-- 国家旗帜背景装饰 -->
          <div class="card-country-bg">
            <span 
              v-for="(country, idx) in trip.countries?.slice(0, 3)" 
              :key="idx"
              class="country-flag-bg"
              :style="{ 
                opacity: 0.08, 
                transform: `rotate(${idx * 12 - 12}deg)`,
                fontSize: '60px'
              }"
            >
              {{ getCountryFlag(country) }}
            </span>
          </div>

          <v-card-item class="pa-6">
            <!-- 标题区域 -->
            <div class="d-flex justify-space-between align-start mb-4">
              <div class="flex-1">
                <v-card-title class="text-h5 font-weight-bold text-grey-darken-4 mb-2 line-clamp-2">
                  {{ trip.title }}
                </v-card-title>
                <v-card-subtitle class="text-body-2 text-grey-darken-1 d-flex align-center">
                  <v-icon icon="mdi-calendar-range" size="16" class="mr-2" />
                  {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
                </v-card-subtitle>
              </div>
              <v-avatar :color="getTripColor(trip)" size="48" class="trip-avatar shadow-sm">
                <v-icon icon="mdi-airplane-takeoff" color="white" size="24" />
              </v-avatar>
            </div>

            <!-- 统计标签 -->
            <div class="d-flex flex-wrap gap-2 mb-4">
              <v-chip 
                size="small" 
                color="blue" 
                variant="flat"
                label
                class="font-weight-medium"
              >
                <v-icon start icon="mdi-earth" size="16" />
                {{ trip.countries?.length || 0 }} Countries
              </v-chip>
              <v-chip 
                size="small" 
                color="orange" 
                variant="flat"
                label
                class="font-weight-medium"
              >
                <v-icon start icon="mdi-food-fork-drink" size="16" />
                {{ getTotalDishes(trip) }} Dishes
              </v-chip>
            </div>

            <!-- 进度条（如果行程有天数） -->
            <div class="mb-4" v-if="trip.days?.length">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-caption text-grey-darken-1">Trip Progress</span>
                <span class="text-caption font-weight-bold text-orange">{{ getTripProgress(trip) }}%</span>
              </div>
              <v-progress-linear
                :model-value="getTripProgress(trip)"
                color="orange"
                height="6"
                rounded
                class="rounded-pill"
              />
            </div>

            <!-- 底部操作 -->
            <v-divider class="mb-4"></v-divider>
            <div class="d-flex justify-space-between align-center">
              <v-btn 
                size="small" 
                variant="text" 
                color="grey-darken-1"
                @click.stop="deleteTrip(trip._id)"
                class="text-none"
              >
                Delete
              </v-btn>
              <v-btn 
                size="small" 
                :color="getTripColor(trip)"
                variant="tonal"
                append-icon="mdi-arrow-right"
                class="text-none font-weight-bold"
              >
                View Trip
              </v-btn>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- ✅ 创建行程对话框（保持原有设计，微调） -->
    <v-dialog v-model="showCreateDialog" max-width="500px" transition="dialog-bottom-transition">
      <v-card class="rounded-2xl" elevation="10">
        <v-card-title class="text-h5 font-weight-bold bg-orange-lighten-5 py-4 px-6">
          <v-icon icon="mdi-plus-circle" color="orange-darken-4" class="mr-2" />
          Create New Trip
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-text-field
            v-model="newTrip.title"
            label="Trip Title"
            placeholder="e.g., Japan Food Adventure"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            prepend-inner-icon="mdi-label"
            required
            hide-details="auto"
            class="mb-4"
          />
          
          <v-autocomplete
            v-model="newTrip.countries"
            :items="availableCountries"
            label="Select Countries"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            multiple
            chips
            closable-chips
            prepend-inner-icon="mdi-earth"
            hint="Select countries with recipes in our database"
            persistent-hint
            no-data-text="Loading countries..."
            class="mb-4"
          />
          
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="newTrip.startDate"
                label="Start Date"
                type="date"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-calendar-start"
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newTrip.endDate"
                label="End Date"
                type="date"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-calendar-end"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            color="grey-darken-1" 
            @click="closeCreateDialog"
            class="text-none"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="orange-darken-4" 
            @click="confirmCreateTrip" 
            :disabled="!canCreate"
            rounded="pill"
            class="text-none font-weight-bold px-6"
            elevation="2"
          >
            Create Trip
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const trips = ref([]);
const loading = ref(true);

// ✅ 创建对话框相关状态
const showCreateDialog = ref(false);
const availableCountries = ref([]);
const newTrip = ref({
  title: '',
  countries: [],
  startDate: '',
  endDate: ''
});

// ✅ 判断是否可以创建
const canCreate = computed(() => {
  return newTrip.value.title.trim() && newTrip.value.countries.length > 0;
});

// ✅ 计算属性：统计数据
const totalCountries = computed(() => {
  const countries = new Set();
  trips.value.forEach(trip => {
    trip.countries?.forEach(c => countries.add(c));
  });
  return countries.size;
});

const totalDishes = computed(() => {
  return trips.value.reduce((sum, trip) => sum + getTotalDishes(trip), 0);
});

const totalDays = computed(() => {
  return trips.value.reduce((sum, trip) => sum + (trip.days?.length || 0), 0);
});

onMounted(async () => {
  await loadTrips();
  if (availableCountries.value.length === 0) {
    loadAvailableCountries();
  }
});

async function loadTrips() {
  loading.value = true;
  const userId = localStorage.getItem('userId');
  if (!userId) {
    loading.value = false;
    return;
  }

  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/trips/${userId}`);
    if (res.ok) {
      trips.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load trips:', err);
  } finally {
    loading.value = false;
  }
}

async function loadAvailableCountries() {
  try {
    // ✅ 使用相对路径
    const res = await fetch('/api/countries');
    if (res.ok) {
      availableCountries.value = await res.json();
    }
  } catch (err) {
    console.error("Failed to load countries", err);
  }
}

function formatDate(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTotalDishes(trip) {
  return trip.days?.reduce((sum, day) => sum + (day.dishes?.length || 0), 0) || 0;
}

// ✅ 辅助函数：获取行程主题色
function getTripColor(trip) {
  const colors = ['#ff9800', '#f57c00', '#ef6c00', '#e65100', '#ff5722'];
  const index = (trip.countries?.length || 1) % colors.length;
  return colors[index];
}

// ✅ 辅助函数：获取国家旗帜表情
function getCountryFlag(country) {
  const flags = {
    'Malaysia': '🇲🇾', 'Japan': '🇯', 'Thailand': '🇹🇭',
    'China': '🇨🇳', 'India': '🇮', 'Italy': '🇹',
    'France': '🇫🇷', 'USA': '🇺', 'Mexico': '🇽',
    'Spain': '🇪🇸', 'UK': '🇬', 'Germany': '🇪',
    'Korea': '🇰🇷', 'Vietnam': '🇻', 'Singapore': '🇬'
  };
  return flags[country] || '🌍';
}

// ✅ 辅助函数：计算行程进度（基于已品尝的菜品）
function getTripProgress(trip) {
  if (!trip.days?.length) return 0;
  const totalDishes = trip.days.reduce((sum, day) => 
    sum + (day.dishes?.length || 0), 0);
  if (totalDishes === 0) return 0;
  
  const tastedDishes = trip.days.reduce((sum, day) => 
    sum + (day.dishes?.filter(d => d.tasted).length || 0), 0);
  
  return Math.round((tastedDishes / totalDishes) * 100);
}

function openCreateDialog() {
  showCreateDialog.value = true;
  newTrip.value = { title: '', countries: [], startDate: '', endDate: '' };
  if (availableCountries.value.length === 0) {
    loadAvailableCountries();
  }
}

function closeCreateDialog() {
  showCreateDialog.value = false;
}

async function confirmCreateTrip() {
  if (!canCreate.value) {
    alert("Please fill in title and select at least one country");
    return;
  }
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("Please login to create a trip");
    return;
  }
  
  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/trips/${userId}`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTrip.value.title.trim(),
        countries: newTrip.value.countries,
        startDate: newTrip.value.startDate || undefined,
        endDate: newTrip.value.endDate || undefined
      })
    });
    
    if (res.ok) {
      const trip = await res.json();
      trips.value.push(trip);
      closeCreateDialog();
      viewTrip(trip._id);
    } else {
      const error = await res.json();
      alert(`Failed to create trip: ${error.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("Failed to create trip", err);
    alert("Failed to create trip. Please try again.");
  }
}

function viewTrip(tripId) {
  router.push(`/trips/${tripId}`);
}

async function deleteTrip(tripId) {
  if (!confirm("Delete this trip?")) return;

  const userId = localStorage.getItem('userId');
  try {
    // ✅ 使用相对路径
    await fetch(`/api/trips/${userId}/${tripId}`, { 
      method: 'DELETE' 
    });
    trips.value = trips.value.filter(t => t._id !== tripId);
  } catch (err) {
    console.error("Failed to delete trip", err);
  }
}
</script>

<style scoped>
/* 样式部分保持不变，与之前相同 */
.max-width-1400 {
  max-width: 1400px;
  margin: 0 auto;
}

.tracking-tight {
  letter-spacing: -0.025em;
}

/* ========== 头部区域 ========== */
.page-header {
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 50%, #e64a19 100%);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(255, 87, 34, 0.35);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 2;
}

.header-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.header-btn {
  position: relative;
  z-index: 2;
  transition: transform 0.2s ease;
}

.header-btn:hover {
  transform: translateY(-2px);
}

.header-decoration {
  position: absolute;
  top: 0;
  right: 0;
  padding: 20px;
  pointer-events: none;
  opacity: 0.3;
}

.deco-icon-1 { position: absolute; top: 20px; right: 60px; animation: float 4s ease-in-out infinite; }
.deco-icon-2 { position: absolute; top: 60px; right: 20px; animation: float 4s ease-in-out infinite 1s; }
.deco-icon-3 { position: absolute; top: 40px; right: 100px; animation: float 4s ease-in-out infinite 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

.text-white-opacity {
  color: rgba(255, 255, 255, 0.9);
}

/* ========== 统计卡片 ========== */
.stat-card {
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
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

.stat-icon.bg-blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
.stat-icon.bg-orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
.stat-icon.bg-green { background: linear-gradient(135deg, #4caf50, #388e3c); }
.stat-icon.bg-purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }

.stat-content {
  flex: 1;
  min-width: 0;
}

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

/* ========== 空状态增强版 ========== */
.empty-state {
  text-align: center;
  padding: 100px 20px;
  background: linear-gradient(180deg, #fff3e0 0%, #ffffff 100%);
  border-radius: 32px;
  position: relative;
  overflow: hidden;
  border: 2px dashed #ffe0b2;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.05) 0%, transparent 60%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-illustration {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto;
}

.main-icon {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 12px rgba(255, 152, 0, 0.3));
}

.floating-icons {
  position: absolute;
  inset: 0;
}

.float-icon-1 {
  position: absolute;
  top: 5%;
  left: 5%;
  animation: floatIcon 3s ease-in-out infinite;
}

.float-icon-2 {
  position: absolute;
  top: 50%;
  right: 5%;
  animation: floatIcon 3s ease-in-out infinite 0.5s;
}

.float-icon-3 {
  position: absolute;
  bottom: 5%;
  left: 20%;
  animation: floatIcon 3s ease-in-out infinite 1s;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-25px) scale(1.1); opacity: 1; }
}

.max-width-500 {
  max-width: 500px;
}


.trip-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: white;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.trip-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(255, 87, 34, 0.25);
}

.card-top-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  transition: height 0.3s ease;
}

.trip-card:hover .card-top-decoration {
  height: 8px;
}

.card-country-bg {
  position: absolute;
  top: 30px;
  right: -10px;
  pointer-events: none;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.country-flag-bg {
  display: block;
  margin-bottom: -35px;
  user-select: none;
  transition: transform 0.3s ease;
}

.trip-card:hover .country-flag-bg {
  transform: scale(1.05);
}

.trip-avatar {
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.trip-card:hover .trip-avatar {
  transform: scale(1.05);
}

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
}

.gap-2 {
  gap: 8px;
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.flex-1 {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .page-header {
    padding: 30px 20px;
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .header-decoration {
    display: none;
  }
  
  .stat-card {
    padding: 16px 12px;
  }
  
  .stat-value {
    font-size: 22px;
  }
  
  .empty-state {
    padding: 60px 16px;
  }
  
  .empty-illustration {
    width: 140px;
    height: 140px;
  }
  
  .main-icon {
    font-size: 80px !important;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 24px 16px;
  }
  
  .text-h2 {
    font-size: 1.75rem !important;
  }
  
  .header-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>