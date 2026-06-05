<template>
  <div class="recipe-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching delicious details...</p>
    </div>

    <div v-else-if="recipe" class="recipe-layout">
      <div class="recipe-visual">
        <div class="image-wrapper">
          <img :src="recipe.image || placeholderImg" :alt="recipe.name" />
          <div class="image-overlay">
            <span class="country-tag">📍 {{ recipe.country }}</span>
          </div>
        </div>
        
        <div class="quick-actions">
          <button 
            class="action-btn primary" 
            @click="toggleTripPlan" 
            :class="{ active: isInAnyTrip }"
            :disabled="addingToTrip"
          >
            <span v-if="addingToTrip">Adding...</span>
            <span v-else-if="isInAnyTrip">✓ In Trip</span>
            <span v-else>+ Add to Trip</span>
          </button>
          <button class="action-btn secondary" @click="goBack">
            ← Back to {{ recipe?.country || 'Country' }}
          </button>
        </div>
      </div>

      <div class="recipe-details">
        <h1 class="recipe-title">{{ recipe.name }}</h1>
        <p class="recipe-desc">{{ recipe.description || 'A classic dish representing the authentic flavors of this region.' }}</p>

        <div v-if="formattedIngredients.length" class="section ingredients-section">
          <h2>🥗 Ingredients</h2>
          <div class="ingredient-grid">
            <span v-for="(ing, i) in formattedIngredients" :key="i" class="ingredient-chip">{{ ing }}</span>
          </div>
        </div>

        <div v-if="recipe.steps && recipe.steps.length" class="section steps-section">
          <h2>👨‍ Cooking Steps</h2>
          <div class="steps-timeline">
            <div v-for="(step, i) in recipe.steps" :key="i" class="step-item">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-content">{{ step }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <p>😕 Recipe not found or failed to load.</p>
      <button class="action-btn secondary" @click="goBack" style="width: auto; margin-top: 20px;">Go Back</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const recipe = ref(null);
const loading = ref(true);
const addingToTrip = ref(false);

const placeholderImg = 'https://via.placeholder.com/600x400?text=Loading+Image';

const userTrips = ref([]);
const currentTripId = ref(null);

const formattedIngredients = computed(() => {
  if (!recipe.value?.ingredients) return [];
  return recipe.value.ingredients.map(ing => {
    if (typeof ing === 'object' && ing.item) {
      return `${ing.amount || ''} ${ing.item}`.trim();
    }
    return String(ing);
  }).filter(Boolean);
});

const countrySlug = computed(() => {
  if (!recipe.value?.country) return '';
  return recipe.value.country.toLowerCase().replace(/\s+/g, "-");
});

const isInAnyTrip = computed(() => {
  if (!recipe.value) return false;
  const dishId = recipe.value._id || recipe.value.id;
  return userTrips.value.some(trip => 
    trip.days?.some(day => day.dishes?.some(d => (d._id || d.id) === dishId))
  );
});

async function loadUserTrips() {
  const userId = localStorage.getItem("userId");
  if (!userId) return [];
  
  try {
    // ✅ 使用相对路径
    const res = await fetch(`/api/trips/${userId}`);
    if (res.ok) {
      const trips = await res.json();
      userTrips.value = trips;
      if (trips.length > 0 && !currentTripId.value) {
        currentTripId.value = trips[0]._id;
      }
      return trips;
    }
  } catch (err) {
    console.warn("Failed to load trips", err);
  }
  return [];
}

function formatDishForTrip(dish) {
  let imageUrl = dish.image || '';
  if (imageUrl && !imageUrl.startsWith('http')) {
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
      // ✅ 使用相对路径
      imageUrl = imageUrl;
    }
  }
  return {
    _id: dish._id || dish.id,
    name: dish.name,
    country: dish.country,
    city: dish.city || '',
    image: imageUrl,
    price: dish.price || 15,
    tasted: false
  };
}

async function createSimpleTrip(country, firstDishName) {
  const userId = localStorage.getItem("userId");
  const newTrip = {
    title: `${country} Food Adventure`,
    description: `Started with ${firstDishName}`,
    countries: [country],
    days: [{ dayNumber: 1, date: null, dishes: [] }]
  };
  
  // ✅ 使用相对路径
  const res = await fetch(`/api/trips/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTrip)
  });
  
  if (!res.ok) throw new Error("Failed to create trip");
  return await res.json();
}

async function addDishToTrip(dish) {
  const userId = localStorage.getItem("userId");
  if (!userId) { alert("Please login to add to trip"); return false; }
  
  const dishId = dish._id || dish.id;
  const dishCountry = dish.country;
  
  try {
    await loadUserTrips();
    const matchingTrips = userTrips.value.filter(trip => 
      trip.countries?.some(c => c.toLowerCase() === dishCountry.toLowerCase())
    );
    
    let targetTrip;
    if (matchingTrips.length > 0) {
      const tripList = matchingTrips.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
      const choice = prompt(`📍 Found trips for ${dishCountry}:\n\n${tripList}\n\nEnter trip number to add "${dish.name}" (or type "new" to create):`, "1");
      
      if (choice === null) return false;
      if (choice.toLowerCase() === 'new') {
        targetTrip = await createSimpleTrip(dishCountry, dish.name);
        userTrips.value.push(targetTrip);
        currentTripId.value = targetTrip._id;
      } else {
        const idx = parseInt(choice) - 1;
        if (isNaN(idx) || idx < 0 || idx >= matchingTrips.length) { alert("Invalid selection."); return false; }
        targetTrip = matchingTrips[idx];
      }
    } else {
      const create = confirm(`🌍 No trips found for ${dishCountry}. Create a new trip and add "${dish.name}"?`);
      if (!create) return false;
      targetTrip = await createSimpleTrip(dishCountry, dish.name);
      userTrips.value.push(targetTrip);
      currentTripId.value = targetTrip._id;
    }
    
    if (!targetTrip.days || targetTrip.days.length === 0) {
      targetTrip.days = [{ dayNumber: 1, date: null, dishes: [] }];
    }
    let targetDay = targetTrip.days.find(d => d.dayNumber === 1);
    if (!targetDay) {
      targetDay = { dayNumber: 1, date: null, dishes: [] };
      targetTrip.days.push(targetDay);
    }
    
    const exists = targetDay.dishes?.some(d => (d._id || d.id) === dishId);
    if (exists) { alert(`✅ "${dish.name}" is already in "${targetTrip.title}"!`); return true; }
    
    const newDish = formatDishForTrip(dish);
    targetDay.dishes = [...(targetDay.dishes || []), newDish];
    
    // ✅ 使用相对路径
    const saveRes = await fetch(`/api/trips/${userId}/${targetTrip._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: targetTrip.days })
    });
    
    if (!saveRes.ok) {
      const err = await saveRes.json();
      throw new Error(err.error || "Failed to save trip");
    }
    
    const updatedTrip = await saveRes.json();
    const tripIndex = userTrips.value.findIndex(t => t._id === targetTrip._id);
    if (tripIndex !== -1) userTrips.value[tripIndex] = updatedTrip;
    
    const goNow = confirm(`✅ Added to Day 1 of "${targetTrip.title}"! Go to manage?`);
    if (goNow) router.push(`/trips/${targetTrip._id}`);
    
    localStorage.setItem('tripUpdated', Date.now().toString());
    console.log("✓ Added to trip:", dish.name);
    return true;
  } catch (err) {
    console.error("Failed to add dish to trip:", err);
    alert(`Failed to add to trip: ${err.message}`);
    return false;
  }
}

async function removeDishFromTrip(dish) {
  const userId = localStorage.getItem("userId");
  if (!userId) return false;
  const dishId = dish._id || dish.id;
  
  let foundTrip = null;
  let foundDay = null;
  for (const trip of userTrips.value) {
    foundDay = trip.days?.find(d => d.dishes?.some(d => (d._id || d.id) === dishId));
    if (foundDay) { foundTrip = trip; break; }
  }
  
  if (!foundTrip || !foundDay) { console.warn("Dish not found"); return false; }
  
  foundDay.dishes = (foundDay.dishes || []).filter(d => (d._id || d.id) !== dishId);
  
  // ✅ 使用相对路径
  const saveRes = await fetch(`/api/trips/${userId}/${foundTrip._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: foundTrip.days })
  });
  
  if (!saveRes.ok) throw new Error("Failed to save trip");
  
  const updatedTrip = await saveRes.json();
  const tripIndex = userTrips.value.findIndex(t => t._id === foundTrip._id);
  if (tripIndex !== -1) userTrips.value[tripIndex] = updatedTrip;
  
  console.log("✓ Removed from trip:", dish.name);
  return true;
}

async function toggleTripPlan() {
  if (!recipe.value || addingToTrip.value) return;
  addingToTrip.value = true;
  
  try {
    const dish = recipe.value;
    const dishId = dish._id || dish.id;
    const alreadyInTrip = userTrips.value.some(trip => 
      trip.days?.some(day => day.dishes?.some(d => (d._id || d.id) === dishId))
    );
    
    if (alreadyInTrip) {
      const confirmRemove = confirm(`Remove "${dish.name}" from your trip?`);
      if (confirmRemove) {
        await removeDishFromTrip(dish);
        alert(`✅ Removed from trip.`);
      }
    } else {
      await addDishToTrip(dish);
    }
  } catch (err) {
    console.error("Failed to toggle trip plan", err);
    alert("Failed to update.");
  } finally {
    addingToTrip.value = false;
  }
}

onMounted(async () => {
  const id = route.params.id;
  try {
    await loadUserTrips();
    
    // ✅ 使用相对路径
    const res = await fetch(`/api/recipes/${id}`);
    if (!res.ok) throw new Error('Network response was not ok');
    recipe.value = await res.json();

    if (recipe.value.image && !recipe.value.image.startsWith('http')) {
      if (recipe.value.image.startsWith('/uploads/') || recipe.value.image.startsWith('/images/')) {
        // ✅ 保持相对路径
        recipe.value.image = recipe.value.image;
      }
    }
    
    if (!recipe.value.image) {
      try {
        // ✅ 使用相对路径
        const imgRes = await fetch(`/api/dish-image?dish=${encodeURIComponent(recipe.value.name)}&country=${encodeURIComponent(recipe.value.country)}`);
        const data = await imgRes.json();
        recipe.value.image = data.image || placeholderImg;
      } catch {
        recipe.value.image = placeholderImg;
      }
    }
  } catch (err) {
    console.error("Failed to fetch recipe:", err);
    recipe.value = null;
  } finally {
    loading.value = false;
  }
});

function goBack() {
  const from = route.query.from;
  const country = recipe.value?.country;
  
  if (from === 'country' && country) {
    const slug = country.toLowerCase().replace(/\s+/g, '-');
    router.push(`/country/${slug}`);
  } else if (from === 'recipes') {
    router.push('/recipes');
  } else if (from === 'favourites') {
    router.push('/favourites');
  } else if (from === 'trips') {
    router.push('/trips');
  } else {
    router.back();
  }
}
</script>

<style scoped>
.recipe-page {
  --primary: #FF5722; 
  --primary-dark: #E64A19; 
  --success: #4CAF50;
  --bg: #F8F9FA; 
  --card-bg: #FFFFFF; 
  --text-main: #2D3436;
  --text-muted: #636E72; 
  --border: #DFE6E9; 
  --shadow: 0 12px 35px rgba(0,0,0,0.08);
  --radius: 20px;
  min-height: 100vh; 
  background: var(--bg); 
  padding: 20px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
  color: var(--text-main);
}

.recipe-layout {
  max-width: 1100px; 
  margin: 0 auto; 
  background: var(--card-bg);
  border-radius: var(--radius); 
  box-shadow: var(--shadow);
  display: grid; 
  grid-template-columns: 1fr; 
  overflow: hidden;
}

@media (min-width: 900px) {
  .recipe-layout { 
    grid-template-columns: 42% 58%; 
    min-height: 85vh; 
  }

  .recipe-visual { 
    position: sticky; 
    top: 20px; 
    height: calc(100vh - 40px); 
    display: flex; 
    flex-direction: column; 
  }
}

.recipe-visual { 
  background: #111; 
  position: relative; 
}

.image-wrapper { 
  flex: 1; 
  position: relative; 
  overflow: hidden; 
}

.image-wrapper img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  display: block; 
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); 
}

.recipe-visual:hover .image-wrapper img { 
  transform: scale(1.04); 
}

.image-overlay { 
  position: absolute; 
  top: 20px; 
  left: 20px; 
}

.country-tag {
  background: rgba(255,255,255,0.92); 
  backdrop-filter: blur(10px);
  padding: 8px 16px; 
  border-radius: 50px; 
  font-weight: 600; 
  font-size: 0.9rem;
  color: var(--text-main); 
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.quick-actions { 
  padding: 20px; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  background: var(--card-bg); 
  border-top: 1px solid var(--border); 
}

@media (min-width: 900px) { 
  .quick-actions { 
    border-top: none; 
    border-bottom: 1px solid var(--border); 
  } 
}

.action-btn {
  width: 100%; 
  padding: 14px; 
  border: none; 
  border-radius: 12px;
  font-size: 1rem; 
  font-weight: 600; 
  cursor: pointer; 
  transition: all 0.2s ease;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 8px;
}

.action-btn:disabled { 
  opacity: 0.6; 
  cursor: not-allowed; 
}

.action-btn.primary { 
  background: var(--primary); 
  color: white; 
}

.action-btn.primary:hover { 
  background: var(--primary-dark); 
  transform: translateY(-2px); 
}

.action-btn.primary.active { 
  background: var(--success); 
}

.action-btn.secondary { 
  background: transparent; 
  color: var(--text-muted); 
  border: 2px solid var(--border); 
}

.action-btn.secondary:hover { 
  border-color: var(--text-muted); 
  color: var(--text-main); 
}

.recipe-details { 
  padding: 40px; 
  overflow-y: auto; 
}

.recipe-title { 
  font-size: 2.4rem; 
  font-weight: 800; 
  color: var(--text-main); 
  margin: 0 0 16px 0; 
  line-height: 1.15; 
  letter-spacing: -0.5px; 
}

.recipe-desc { 
  font-size: 1.15rem; 
  line-height: 1.7; 
  color: var(--text-muted); 
  margin-bottom: 40px; 
  border-left: 4px solid var(--primary); 
  padding-left: 20px; 
}

.section { 
  margin-bottom: 45px; 
}

.section h2 { 
  font-size: 1.3rem; 
  font-weight: 700; 
  color: var(--text-main); 
  margin-bottom: 20px; 
  display: flex; 
  align-items: center; 
  gap: 10px; 
}

.ingredient-grid { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 10px; 
}

.ingredient-chip {
  background: #FFF3E0; 
  color: #E65100; 
  padding: 8px 16px; 
  border-radius: 50px;
  font-size: 0.95rem; 
  font-weight: 500; 
  border: 1px solid #FFE0B2;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ingredient-chip:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 4px 8px rgba(230, 81, 0, 0.15); 
}

.steps-timeline { 
  position: relative; 
  padding-left: 35px; 
}

.steps-timeline::before { 
  content: ''; 
  position: absolute; 
  left: 13px; 
  top: 12px; 
  bottom: 12px; 
  width: 2px; 
  background: var(--border); 
}

.step-item { 
  position: relative; 
  margin-bottom: 24px; 
  padding-bottom: 4px; 
}

.step-item:last-child { 
  margin-bottom: 0; 
}

.step-number {
  position: absolute; 
  left: -35px; 
  top: 2px; 
  width: 28px; 
  height: 28px;
  background: var(--primary); 
  color: white; 
  border-radius: 50%;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 0.85rem; 
  font-weight: bold; 
  z-index: 1; 
  box-shadow: 0 0 0 5px var(--card-bg);
}

.step-content {
  font-size: 1.05rem; 
  line-height: 1.65; 
  color: var(--text-main);
  background: #FAFAFA; 
  padding: 18px; 
  border-radius: 14px; 
  border: 1px solid var(--border);
  transition: background 0.2s;
}

.step-content:hover { 
  background: #F5F5F5; 
}

.loading-state, .error-state { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  height: 60vh; 
  color: var(--text-muted); 
  text-align: center; 
}

.spinner { 
  width: 44px; 
  height: 44px; 
  border: 4px solid var(--border); 
  border-top-color: var(--primary); 
  border-radius: 50%; 
  animation: spin 1s linear infinite; 
  margin-bottom: 20px; 
}

@keyframes spin { 
  to { 
    transform: rotate(360deg); 
  } 
}

@media (max-width: 899px) {
  .recipe-page { 
    padding: 12px; 
  }

  .recipe-title { 
    font-size: 1.8rem; 
  }

  .recipe-details { 
    padding: 24px; 
  }

  .image-wrapper { 
    height: 280px; 
  }
}
</style>