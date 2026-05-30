<template>
  <div class="map-wrapper">
    
    <!-- ✅ 简化底部提示（仅提供信息，非交互） -->
    <div class="map-footer-badge">
      <span class="badge-text">💡 Click any marker to explore recipes</span>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="map-overlay">
      <div class="spinner"></div>
      <p class="mt-3 text-grey-darken-2">Locating culinary destinations...</p>
    </div>

    <!-- 地图容器 -->
    <div id="map" class="map-container"></div>

    <!-- ✅ 右上角玻璃态工具栏（始终可见 + 水平排列） -->
    <div class="map-toolbar">
      <!-- 🌏 Browse All (主操作) -->
      <router-link 
        to="/country" 
        class="toolbar-btn primary" 
        title="Browse all countries"
      >
        <v-icon start size="18">mdi-earth</v-icon>
        <span class="btn-label">Browse</span>
      </router-link>
      
      <v-divider vertical inset class="toolbar-divider" />
      
      <!-- 🌍 Fit View -->
      <button 
        class="toolbar-btn" 
        @click="fitAllMarkers" 
        title="Fit all markers in view"
      >
        <v-icon start size="18">mdi-image-filter-center-focus</v-icon>
        <span class="btn-label">Fit</span>
      </button>
      
      <v-divider vertical inset class="toolbar-divider" />
      
      <!-- 🎲 Random Explore -->
      <button 
        class="toolbar-btn" 
        @click="exploreRandom" 
        title="Discover a random country"
      >
        <v-icon start size="18">mdi-dice-multiple</v-icon>
        <span class="btn-label">Random</span>
      </button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";

const router = useRouter();
const searchStore = useSearchStore();

const loading = ref(true);
let map = null;
let markersLayer = null;
let allBounds = [];
const countryDataMap = ref({}); 
const userTrips = ref([]);

async function getCountryInfo(country) {
  const cacheKey = `info_${country.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(country)}&format=json&limit=1&addressdetails=1`
    );
    const data = await res.json();
    
    if (data.length > 0) {
      const item = data[0];
      const code = item.address?.country_code || 'un'; 
      
      const info = {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        code: code
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(info));
      return info;
    }
  } catch (err) {
    console.error(`Failed to fetch info for ${country}`, err);
  }
  return null;
}

async function loadUserTrips() {
  const userId = localStorage.getItem("userId");
  if (!userId) return [];
  
  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/trips/${userId}`);
    if (res.ok) {
      const trips = await res.json();
      userTrips.value = trips;
      return trips;
    }
  } catch (err) {
    console.warn("Failed to load trips", err);
  }
  return [];
}

function isInAnyTrip(dishId) {
  return userTrips.value.some(trip => 
    trip.days?.some(day => 
      day.dishes?.some(d => (d._id || d.id) === dishId)
    )
  );
}

async function addDishToTrip(dish) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please login to add to trip");
    return false;
  }

  const dishId = dish._id || dish.id;
  
  if (userTrips.value.length === 0) {
    await loadUserTrips();
  }
  
  let targetTrip = userTrips.value[0];
  
  if (!targetTrip) {
    if (!confirm("No trips found. Create a new trip for this dish?")) {
      return false;
    }
    
    const newTrip = {
      title: `${dish.country} Food Adventure`,
      description: `Exploring ${dish.country} cuisine`,
      countries: [dish.country],
      days: [{ dayNumber: 1, dishes: [] }]
    };
    
    // ✅ 使用相对路径
    const createRes = await fetch(`/api/trips/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrip)
    });
    
    if (!createRes.ok) throw new Error("Failed to create trip");
    targetTrip = await createRes.json();
    userTrips.value.push(targetTrip);
  }
  
  let targetDay = targetTrip.days?.find(d => d.dayNumber === 1);
  if (!targetDay) {
    targetDay = { dayNumber: 1, dishes: [] };
    targetTrip.days = [...(targetTrip.days || []), targetDay];
  }
  
  const exists = targetDay.dishes?.some(d => (d._id || d.id) === dishId);
  if (exists) {
    console.log("ℹ️ Already in trip:", dish.name);
    return true;
  }
  
  targetDay.dishes = [...(targetDay.dishes || []), {
    _id: dishId,
    name: dish.name,
    country: dish.country,
    image: dish.image,
    price: dish.price || 15,
    tasted: false
  }];
  
  // ✅ 使用相对路径
  const saveRes = await fetch(`/api/trips/${userId}/${targetTrip._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: targetTrip.days })
  });
  
  if (!saveRes.ok) throw new Error("Failed to save trip");
  
  const updatedTrip = await saveRes.json();
  const tripIndex = userTrips.value.findIndex(t => t._id === targetTrip._id);
  if (tripIndex !== -1) {
    userTrips.value[tripIndex] = updatedTrip;
  }
  
  console.log("✓ Added to trip:", dish.name);
  return true;
}

async function removeDishFromTrip(dish) {
  const userId = localStorage.getItem("userId");
  if (!userId) return false;
  
  const dishId = dish._id || dish.id;
  
  let foundTrip = null;
  let foundDay = null;
  
  for (const trip of userTrips.value) {
    foundDay = trip.days?.find(d => 
      d.dishes?.some(dish => (dish._id || dish.id) === dishId)
    );
    if (foundDay) {
      foundTrip = trip;
      break;
    }
  }
  
  if (!foundTrip || !foundDay) {
    console.warn("Dish not found in any trip");
    return false;
  }
  
  foundDay.dishes = (foundDay.dishes || []).filter(
    d => (d._id || d.id) !== dishId
  );
  
  // ✅ 使用相对路径
  const saveRes = await fetch(`/api/trips/${userId}/${foundTrip._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: foundTrip.days })
  });
  
  if (!saveRes.ok) throw new Error("Failed to save trip");
  
  const updatedTrip = await saveRes.json();
  const tripIndex = userTrips.value.findIndex(t => t._id === foundTrip._id);
  if (tripIndex !== -1) {
    userTrips.value[tripIndex] = updatedTrip;
  }
  
  console.log("✓ Removed from trip:", dish.name);
  return true;
}

async function toggleTripPlan(dish) {
  const dishId = dish._id || dish.id;
  
  try {
    if (userTrips.value.length === 0) {
      await loadUserTrips();
    }
    
    const alreadyInTrip = isInAnyTrip(dishId);
    
    if (alreadyInTrip) {
      await removeDishFromTrip(dish);
    } else {
      await addDishToTrip(dish);
    }
    
    return !alreadyInTrip;
  } catch (err) {
    console.error("Failed to toggle trip plan", err);
    alert("Failed to update. Please try again.");
    return null;
  }
}

async function handleAddToTrip(dishId, btnElement, countryName) {
  if (!dishId) {
    console.warn("✗ Add to trip: missing dishId");
    return;
  }
  
  const countryData = countryDataMap.value[countryName];
  if (!countryData) {
    console.warn("✗ Add to trip: country not found", countryName);
    return;
  }
  
  const targetDish = countryData.dishes.find(d => (d._id || d.id) == dishId);
  if (!targetDish) {
    console.warn("✗ Add to trip: dish not found", dishId);
    return;
  }
  
  const newState = await toggleTripPlan(targetDish);
  
  if (newState !== null) {
    if (newState) {
      btnElement.textContent = "✓";
      btnElement.classList.add("active");
      btnElement.title = "Added to trip";
      
      const dishItem = btnElement.closest(".dish-item");
      if (dishItem && !dishItem.querySelector(".route-tag")) {
        const infoDiv = dishItem.querySelector(".dish-info");
        if (infoDiv) {
          const tag = document.createElement("span");
          tag.className = "route-tag";
          tag.textContent = "✓ In Trip";
          infoDiv.appendChild(tag);
        }
      }
      console.log("✓ Added to trip:", targetDish.name);
    } else {
      btnElement.textContent = "➕";
      btnElement.classList.remove("active");
      btnElement.title = "Add to my trip";
      
      const dishItem = btnElement.closest(".dish-item");
      if (dishItem) {
        const tag = dishItem.querySelector(".route-tag");
        if (tag) tag.remove();
      }
      console.log("✓ Removed from trip:", targetDish.name);
    }
  }
}

function performMapSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;

  const searchInput = document.querySelector('.search-field input');
  const originalPlaceholder = searchInput?.placeholder || 'Search...';
  if (searchInput) {
    searchInput.placeholder = '🔍 Searching...';
    searchInput.disabled = true;
  }

  const countryMatch = Object.keys(countryDataMap.value).find(c => 
    c.toLowerCase().includes(q)
  );
  if (countryMatch) {
    const target = countryDataMap.value[countryMatch];
    map.flyTo(target.coords, 6, { animate: true, duration: 1.5 });
    setTimeout(() => {
      target.marker.openPopup();
      restoreSearchInput(searchInput, originalPlaceholder);
    }, 1200);
    return;
  }

  for (const [country, data] of Object.entries(countryDataMap.value)) {
    const dishMatch = data.dishes.find(d => d.name.toLowerCase().includes(q));
    if (dishMatch) {
      map.flyTo(data.coords, 8, { animate: true, duration: 1.5 });
      setTimeout(() => {
        data.marker.openPopup();
        setTimeout(() => {
          highlightDishInPopup(dishMatch._id || dishMatch.id);
          restoreSearchInput(searchInput, originalPlaceholder);
        }, 300);
      }, 1200);
      return;
    }
  }

  restoreSearchInput(searchInput, originalPlaceholder);
  alert(`No results found for "${query}"`);
  searchStore.clear();
}

function restoreSearchInput(input, originalPlaceholder) {
  if (input) {
    input.placeholder = originalPlaceholder;
    input.disabled = false;
  }
}

function highlightDishInPopup(dishId) {
  const popup = document.querySelector(".leaflet-popup-content");
  if (!popup) return;
  
  const items = popup.querySelectorAll(".dish-item");
  items.forEach(item => {
    if (item.dataset.id === dishId) {
      item.style.background = "#fff3e0";
      item.style.borderColor = "#ffccbc";
      item.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        item.style.background = "";
        item.style.borderColor = "";
      }, 2500);
    }
  });
}

watch(
  () => searchStore.term,
  (newTerm) => {
    if (searchStore.context === "map" && newTerm && map) {
      performMapSearch(newTerm);
    }
  }
);

function exploreRandom() {
  const countries = Object.values(countryDataMap.value);
  if (countries.length === 0) return;
  
  const random = countries[Math.floor(Math.random() * countries.length)];
  map.flyTo(random.coords, 6, { animate: true, duration: 1.5 });
  setTimeout(() => random.marker.openPopup(), 1200);
}

onMounted(async () => {
  map = L.map("map", {
    zoomControl: false,
    worldCopyJump: true,
    maxBounds: [[-90, -180], [90, 180]],
    zoomSnap: 0.5,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);

  try {
    await loadUserTrips();

    // ✅ 使用相对路径
    const res = await fetch('/api/recipes');
    const recipes = await res.json();
    
    const grouped = {};
    recipes.forEach((r) => {
      const country = r.country || "Unknown";
      if (!grouped[country]) grouped[country] = [];
      grouped[country].push({ ...r, _id: r._id || r.id });
    });

    markersLayer = L.layerGroup().addTo(map);
    allBounds = [];
    countryDataMap.value = {};

    for (const country of Object.keys(grouped)) {
      await new Promise(r => setTimeout(r, 150 + Math.random() * 200));

      const info = await getCountryInfo(country);
      if (!info) continue; 
      
      allBounds.push([info.lat, info.lon]);
      const count = grouped[country].length;
      const dishes = grouped[country];
      
      const flagUrl = `https://flagcdn.com/w80/${info.code.toLowerCase()}.png`;

      const icon = L.divIcon({
        className: "custom-marker pulse-marker",
        html: `
          <div class="marker-pin">
            <img src="${flagUrl}" alt="${country} flag" class="flag-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/197/197374.png'">
            <span class="count-badge">${count}</span>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50] 
      });

      const featuredDishes = dishes.slice(0, 3);
      const popupContent = `
        <div class="custom-popup">
          <div class="popup-header">
            <h3>${country}</h3>
            <span class="badge">${count} Recipe${count > 1 ? "s" : ""}</span>
          </div>
          
          <div class="popup-featured">
            ${featuredDishes.map(dish => {
              const dishId = dish._id || dish.id;
              const inTrip = isInAnyTrip(dishId);
              return `
              <div class="dish-item featured" data-id="${dishId}">
                <div class="dish-info">
                  <span class="dish-name">${dish.name}</span>
                  ${inTrip ? '<span class="route-tag">✓ In Trip</span>' : ''}
                </div>
                <div class="dish-actions">
                  <span class="view-btn">View →</span>
                  <button class="add-route-btn ${inTrip ? 'active' : ''}" 
                          data-id="${dishId}" 
                          title="${inTrip ? 'Already in trip' : 'Add to my trip'}">
                    ${inTrip ? '✓' : '➕'}
                  </button>
                </div>
              </div>
            `}).filter(Boolean).join("")}
          </div>
          
          <div class="popup-footer">
            <a href="/country/${country.toLowerCase().replace(/\s+/g, '-')}" 
               class="view-all-btn"
               data-router-link
               data-slug="${country.toLowerCase().replace(/\s+/g, '-')}"
            >
              View all ${count} recipes →
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([info.lat, info.lon], { icon }).addTo(markersLayer);

      marker.bindTooltip(country, {
        className: "custom-tooltip",
        sticky: true,
        direction: "top",
        offset: [0, -10]
      });

      countryDataMap.value[country] = {
        coords: [info.lat, info.lon],
        marker: marker,
        dishes: dishes
      };

      marker.bindPopup(popupContent, {
        className: "leaflet-custom-popup",
        maxWidth: 300,
        closeButton: true,
      });

      marker.on("popupopen", (e) => {
        setTimeout(() => {
          const popupEl = e.popup.getElement();
          if (!popupEl) return;

          L.DomEvent.disableClickPropagation(popupEl);
          L.DomEvent.disableScrollPropagation(popupEl);

          if (popupEl._hasClickHandler) return;
          popupEl._hasClickHandler = true;

          popupEl.addEventListener("click", (clickEvent) => {
            const viewBtn = clickEvent.target.closest(".view-btn");
            if (viewBtn) {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();

              const dishItem = viewBtn.closest(".dish-item");
              const id = dishItem?.dataset.id;

              if (id && id !== "undefined" && id !== "null") {
                router.push(`/recipe/${id}`);
              }
              return;
            }

            const routeBtn = clickEvent.target.closest(".add-route-btn");
            if (routeBtn) {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();
              const dishId = routeBtn.dataset.id;
              const countryName = country;
              handleAddToTrip(dishId, routeBtn, countryName);
              return;
            }
            
            const viewAllBtn = clickEvent.target.closest(".view-all-btn");
            if (viewAllBtn) {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();
              const slug = viewAllBtn.dataset.slug;
              if (slug) {
                router.push(`/country/${slug}`);
              }
              return;
            }
          });
        }, 150);
      });
    }

    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 5, animate: true });
    }
  } catch (err) {
    console.error("Failed to load recipes", err);
  } finally {
    loading.value = false;
    setTimeout(() => map.invalidateSize(), 200);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function fitAllMarkers() {
  if (allBounds.length > 0 && map) {
    map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 5, animate: true });
  }
}
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0,0,0,0.05);
}

.map-container {
  width: 100%;
  height: 100vh;
  z-index: 1;
}

/* ✅ 简化底部提示 */
.map-footer-badge {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 998;
  pointer-events: none;
}

.badge-text {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  color: #666;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.map-toolbar {
  position: absolute;
  top: 24px;
  left: 24px;
  right: auto;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0;
  
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  padding: 6px 8px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.4) inset;
  
  transition: all 0.2s ease;
}

.map-toolbar:hover {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
  transform: translateY(-1px);
}

/* ✅ 分隔线 */
.toolbar-divider {
  border-color: rgba(0, 0, 0, 0.08) !important;
  margin: 0 4px !important;
  height: 24px !important;
}

/* ✅ 按钮样式 */
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  
  font-size: 13px;
  font-weight: 500;
  color: #444;
  
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  
  min-width: auto;
}

.toolbar-btn:hover {
  background: rgba(255, 87, 34, 0.08);
  color: #ff5722;
}

.toolbar-btn:active {
  transform: scale(0.98);
}

/* ✅ 主按钮（Browse All）高亮 */
.toolbar-btn.primary {
  color: #ff5722;
  font-weight: 600;
}

.toolbar-btn.primary:hover {
  background: rgba(255, 87, 34, 0.12);
}

/* ✅ 按钮标签（移动端可隐藏） */
.btn-label {
  display: inline;
}

/* ✅ 加载遮罩 */
.map-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #f0f0f0;
  border-top-color: #ff5722;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg)}
}

/* ✅ 移动端适配：隐藏文字，只显示图标 */
@media (max-width: 768px) {
  .map-toolbar {
    top: 16px;
    left: 16px;
    right: auto;
    padding: 4px 6px;
    border-radius: 12px;
  }
  
  .btn-label {
    display: none;
  }
  
  .toolbar-btn {
    padding: 8px;
    border-radius: 8px;
  }
  
  .toolbar-divider {
    margin: 0 2px !important;
    height: 20px !important;
  }
  
  .badge-text {
    font-size: 11px;
    padding: 4px 12px;
  }
}

/* ✅ 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .map-toolbar {
    background: rgba(30, 30, 46, 0.85);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 1px 0 rgba(255, 255, 255, 0.05) inset;
  }
  
  .toolbar-btn {
    color: #e2e8f0;
  }
  
  .toolbar-btn:hover {
    background: rgba(255, 87, 34, 0.15);
    color: #ff9e80;
  }
  
  .toolbar-divider {
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
  
  .badge-text {
    background: rgba(30, 30, 46, 0.9);
    color: #cbd5e1;
  }
}
</style>

<style>
/* 基础标记样式 */
.custom-marker {
  background: transparent !important;
  border: none !important;
}

.marker-pin {
  width: 55px;
  height: 55px;
  background: #ffffff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.9);
  overflow: hidden;
}

.marker-pin img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.marker-pin:hover {
  transform: rotate(-45deg) scale(1.15);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.count-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ff5722;
  color: white;
  font-size: 11px;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 2;
}

/* 脉冲动画 */
.pulse-marker::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 87, 34, 0.3);
  animation: pulse 2s infinite;
  z-index: -1;
  pointer-events: none;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.8); opacity: 0.3; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* Tooltip 样式 */
.custom-tooltip {
  background: rgba(30, 30, 30, 0.9) !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
}
.custom-tooltip::before {
  border-top-color: rgba(30, 30, 30, 0.9) !important;
}

/* 弹窗样式 */
.leaflet-popup-content-wrapper.leaflet-custom-popup {
  border-radius: 16px !important;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.12) !important;
  padding: 0 !important;
  overflow: hidden;
}

.leaflet-popup-tip {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.leaflet-popup-content {
  margin: 0 !important;
  width: 100% !important;
  line-height: 1.4;
}

.custom-popup {
  padding: 16px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2d3436;
}

.badge {
  background: #fff3e0;
  color: #e65100;
  padding: 4px 20px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* ✅ 新增：特色推荐区域样式 */
.popup-featured {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

/* ✅ 新增：弹窗底部样式 */
.popup-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ff5722;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
}
.view-all-btn:hover {
  text-decoration: underline;
}

/* 菜品项样式 */
.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.dish-item:hover {
  background: #fff3e0;
  border-color: #ffccbc;
  transform: translateX(4px);
}

/* ✅ 新增：特色菜品项样式 */
.dish-item.featured {
  background: #fff9f5;
  border-color: #ffe0b2;
}

.dish-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.dish-name {
  font-size: 13px;
  color: #444;
  font-weight: 500;
}

.route-tag {
  font-size: 10px;
  color: #4caf50;
  font-weight: 600;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.dish-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-btn {
  font-size: 12px;
  color: #ff5722;
  font-weight: 600;
  opacity: 0.8;
}

.dish-item:hover .view-btn {
  opacity: 1;
}

/* 加入行程按钮样式 */
.add-route-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ff5722;
  background: white;
  color: #ff5722;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.add-route-btn:hover {
  background: #ff5722;
  color: white;
  transform: scale(1.1);
}

.add-route-btn.active {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
  cursor: default;
}

.add-route-btn.active:hover {
  transform: none;
}

.leaflet-popup-close-button {
  display: none;
}
</style>