<template>
  <div class="explore-container">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <v-container>
        <v-row justify="center" class="text-center">
          <v-col cols="12" md="8">
            <div class="hero-content">
              <h1 class="hero-title">Explore Global Flavors</h1>
              <p class="hero-subtitle">
                Click on a country to discover its authentic recipes. 
                Perfect for when you're craving something new!
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <v-container class="py-8">
      <!-- 简化统计栏 -->
      <v-row class="mb-6" v-if="!loading && countries.length > 0">
        <v-col cols="12" class="text-center">
          <v-chip variant="tonal" color="orange" size="small">
            {{ filteredCountries.length }} countries • {{ totalRecipes }} recipes
          </v-chip>
        </v-col>
      </v-row>

      <!-- 加载状态 -->
      <v-row v-if="loading">
        <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4" lg="3">
          <v-skeleton-loader type="card" height="320" class="rounded-lg" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="(country, index) in filteredCountries"
          :key="country.name"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <router-link 
            :to="`/recipes?country=${country.slug}`" 
            class="country-link"
          >
            <v-card
              class="country-card"
              elevation="2"
              hover
              height="100%"
              :style="{ animationDelay: `${index * 0.1}s`}"
            >
              <v-img
                :src="country.image"
                height="240px"
                cover
                class="country-image"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                    <v-progress-circular indeterminate color="orange" size="40" />
                  </div>
                </template>

                <div class="image-overlay">
                  <div class="country-flag">
                    <span>{{ getFlagEmoji(country.name) }}</span>
                  </div>
                  <div class="recipe-count">
                    <v-icon icon="mdi-food-variant" size="14" />
                    {{ country.count }}
                  </div>
                </div>

                <div class="card-footer">
                  <h3 class="country-name">{{ country.name }}</h3>
                  <p class="country-recipes">
                    {{ country.count }} recipe{{ country.count !== 1 ? 's' : '' }}
                  </p>
                  <div class="explore-btn">
                    Explore Recipes
                    <v-icon icon="mdi-arrow-right" size="16" />
                  </div>
                </div>
              </v-img>
            </v-card>
          </router-link>
        </v-col>
      </v-row>

      <!-- 空状态 -->
      <v-row v-if="filteredCountries.length === 0 && !loading">
        <v-col class="text-center py-16">
          <div class="empty-state">
            <v-icon icon="mdi-map-search" size="80" color="grey-lighten-2" class="mb-4" />
            <h3 class="text-h5 text-grey-darken-1 mt-4">No countries found</h3>
            <p class="text-grey mt-2 mb-4">
              Try a different search or 
              <router-link to="/recipes" class="text-orange font-weight-medium">
                browse all recipes →
              </router-link>
            </p>
            <v-btn variant="outlined" color="grey-darken-1" @click="searchStore.clear()" rounded="pill">
              <v-icon icon="mdi-refresh" start />
              Clear Search
            </v-btn>
          </div>
        </v-col>
      </v-row> 
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useSearchStore } from "@/stores/search";

const searchStore = useSearchStore();
const countries = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    // ✅ 使用相对路径
    const res = await fetch('/api/recipes');
    const data = await res.json();

    const map = {};
    for (const recipe of data) {
      if (!map[recipe.country]) {
        map[recipe.country] = {
          name: recipe.country,
          slug: recipe.country.toLowerCase().replace(/\s+/g, "-"),
          count: 0,
          image: "" 
        };
      }
      map[recipe.country].count++;
    }

    // 加载国家图片
    for (const country of Object.keys(map)) {
      try {
        // ✅ 使用相对路径
        const heroRes = await fetch(`/api/hero-image?country=${country}`);
        const heroData = await heroRes.json();
        map[country].image = heroData.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(country)}`;
      } catch (err) {
        console.error(`Failed to fetch hero image for ${country}`, err);
        map[country].image = `https://via.placeholder.com/600x400?text=${encodeURIComponent(country)}`;
      }
    }

    countries.value = Object.values(map);
  } catch (err) {
    console.error("Failed to load countries", err);
  } finally {
    loading.value = false;
  }
});

const filteredCountries = computed(() => {
  if (!searchStore.term) return countries.value;
  const query = searchStore.term.toLowerCase();
  return countries.value.filter(c => c.name.toLowerCase().includes(query));
});

const totalRecipes = computed(() => 
  countries.value.reduce((sum, c) => sum + c.count, 0)
);

const getFlagEmoji = (countryName) => {
  const countryMap = {
    "China": "🇨🇳", "Japan": "🇯🇵", "Thailand": "🇹🇭",
    "India": "🇮", "Italy": "🇹", "France": "🇫🇷",
    "Mexico": "🇲🇽", "USA": "🇺🇸", "Korea": "🇰🇷",
    "Vietnam": "🇻🇳", "Spain": "🇪🇸", "Greece": "🇬🇷",
    "Turkey": "🇹", "Brazil": "🇷", "UK": "🇬",
    "Germany": "🇩🇪", "Australia": "🇦", "Canada": "🇦",
    "Indonesia": "🇮🇩", "Malaysia": "🇲🇾", "Philippines": "🇵🇭",
    "Singapore": "🇸🇬", "Nepal": "🇳🇵", "Peru": "🇵🇪",
    "Lebanon": "🇱🇧", "Morocco": "🇲🇦", "Ethiopia": "🇪🇹",
    "Nigeria": "🇳🇬", "South Africa": "🇿", "Egypt": "🇬"
  };
  return countryMap[countryName] || "🍳";
};
</script>

<style scoped>
.explore-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF8F0 0%, #FFFFFF 100%);
}

.hero-section {
  padding: 40px 0 30px;
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFB347 100%);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin: 0 0 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.country-link {
  text-decoration: none;
  display: block;
  height: 100%;
}

.country-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-radius: 16px !important;
  animation: fadeInUp 0.6s ease-out both;
}

.country-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
}

.country-image {
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.country-flag {
  background: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.recipe-count {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 20px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
}

.country-name {
  font-size: 1.4rem;
  font-weight: bold;
  color: white;
  margin: 0 0 4px;
  line-height: 1.2;
}

.country-recipes {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 12px;
}

.explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 13px;
  font-weight: bold;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  transition: all 0.2s;
}

.country-card:hover .explore-btn {
  background: white;
  color: #FF6B35;
}

.empty-state {
  padding: 40px 20px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<script>
export default {
  name: "ExploreByCountry"
}
</script>