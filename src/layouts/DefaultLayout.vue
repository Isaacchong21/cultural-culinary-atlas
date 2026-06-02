<template>
  <v-app class="app-theme">
    <v-app-bar 
      :elevation="scrolled ? 4 : 0" 
      :class="{ 'glass-effect': scrolled }"
      height="70"
      sticky
      role="banner"
      aria-label="Main Navigation"
      class="app-bar-custom"
    >
      <v-btn 
        icon="mdi-menu" 
        variant="text" 
        class="mr-1 mr-md-2" 
        @click="toggleDrawer"
        aria-label="Toggle navigation menu"
      ></v-btn>

      <v-btn to="/" variant="text" class="pa-0 ml-1 ml-md-3 mt-1 logo-btn" style="min-width: auto;" aria-label="Go to Homepage">
        <v-img
          :src="Logo"
          alt="Cultural Culinary Atlas Logo"
          :height="$vuetify.display.mdAndUp ? 90 : 60"
          :width="$vuetify.display.mdAndUp ? 120 : 80"
          contain
        ></v-img>
      </v-btn>

      <v-divider vertical inset class="mx-1 mx-md-2 d-none d-md-flex" opacity="0.1"></v-divider>

      <v-expand-transition v-if="userRole === 'user'">
        <div class="w-100 mx-2 mx-md-4" v-show="$vuetify.display.mdAndUp || !isSearchMobileHidden">
          <v-text-field
            v-model="searchTerm"
            placeholder="Search cuisines, countries..."
            variant="solo-filled"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            bg-color="grey-lighten-4"
            rounded="pill"
            class="search-bar-custom"
            :style="{ maxWidth: $vuetify.display.mdAndUp ? '400px' : '100%' }"
            @keyup.enter="handleSearchSubmit"
            aria-label="Search recipes and countries"
          >
            <template #append-inner v-if="searchTerm">
              <v-icon icon="mdi-close-circle" size="small" @click="searchStore.clear()" aria-label="Clear search" />
            </template>
          </v-text-field>
        </div>
      </v-expand-transition>

      <v-spacer></v-spacer>

      <v-btn 
        v-if="userRole === 'user'"
        icon="mdi-magnify" 
        variant="text" 
        class="d-md-none mr-1" 
        @click="isSearchMobileHidden = !isSearchMobileHidden"
        aria-label="Toggle mobile search"
      ></v-btn>

      <v-badge
        v-if="isAuthenticated && userRole === 'user'"
        :content="$vuetify.display.mdAndUp ? unreadCount : null"
        :model-value="unreadCount > 0"
        color="error"
        :offset-x="$vuetify.display.mdAndUp ? 10 : 6"
        :offset-y="$vuetify.display.mdAndUp ? 10 : 6"
        class="mr-2 mr-md-6"
        aria-label="Notifications"
      >
        <v-menu offset-y min-width="360" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn 
              icon="mdi-bell-outline" 
              variant="text" 
              v-bind="props"
              @click="fetchNotifications"
              class="notification-btn"
              aria-label="Open notifications menu"
            />
          </template>
          
          <v-card class="notification-panel" role="region" aria-label="Notifications Panel">
            <v-card-title class="d-flex align-center justify-space-between pa-4 border-b">
              <span class="text-h6 font-weight-bold">Notifications</span>
              <v-btn 
                v-if="notifications.length" 
                size="small" 
                variant="text" 
                color="orange"
                @click="markAllAsRead"
                class="text-none"
                aria-label="Mark all as read"
              >
                Mark all as read
              </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-0">
              <div v-if="!notifications.length" class="text-center py-8">
                <v-icon icon="mdi-bell-ring-outline" size="48" color="grey-lighten-2" class="mb-2" />
                <p class="text-grey-darken-1">No new notifications</p>
              </div>
              
              <v-list v-else class="py-0" max-height="400" style="overflow-y:auto;" role="list">
                <v-list-item
                  v-for="notif in notifications"
                  :key="notif._id"
                  :class="{ 'unread-bg': !notif.isRead }"
                  class="py-3 px-4 border-b"
                  @click="handleNotificationClick(notif)"
                  role="listitem"
                  tabindex="0"
                >
                  <template #prepend>
                    <v-avatar 
                      size="36" 
                      :color="getNotificationColor(notif.type)" 
                      variant="tonal"
                      class="mr-3"
                    >
                      <v-icon :icon="getNotificationIcon(notif.type)" size="20" />
                    </v-avatar>
                  </template>
                  
                  <div class="flex-1">
                    <v-list-item-title class="font-weight-medium text-body-2">
                      {{ notif.title }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption text-grey-darken-1 mt-1">
                      {{ notif.message }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle class="text-caption text-grey mt-1">
                      {{ timeAgo(notif.createdAt) }}
                    </v-list-item-subtitle>
                  </div>
                  
                  <v-icon 
                    v-if="!notif.isRead" 
                    icon="mdi-circle" 
                    size="8" 
                    color="orange" 
                    class="ml-2"
                    aria-label="Unread notification"
                  />
                </v-list-item>
              </v-list>
            </v-card-text>
            
            <v-card-actions v-if="notifications.length" class="pa-3 border-t">
              <v-btn 
                variant="text" 
                color="orange" 
                size="small"
                class="text-none w-100"
                @click="viewAllNotifications"
              >
                View all notifications →
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-badge>

      <template v-if="!isAuthenticated">
        <v-btn variant="text" color="grey-darken-2" to="/login" class="text-none font-weight-medium d-none d-md-inline" aria-label="Log in">Log in</v-btn>
        <v-btn variant="flat" color="orange-darken-4" to="/register" class="text-none font-weight-bold ml-1 ml-md-2 rounded-lg d-none d-md-inline-flex" aria-label="Sign up">Sign up</v-btn>
        <v-btn v-if="!$vuetify.display.mdAndUp" variant="text" color="orange-darken-4" to="/login" class="text-none font-weight-bold" aria-label="Log in">
          <v-icon start>mdi-login</v-icon> Login
        </v-btn>
      </template>

      <v-menu v-else offset-y min-width="280">
        <template #activator="{ props }">
          <v-btn variant="text" class="pa-0 user-menu-btn" v-bind="props" aria-label="User account menu">
            <v-avatar :size="$vuetify.display.mdAndUp ? 40 : 32" class="ring-border">
              <v-img :src="UserProfile.avatar" alt="User Avatar" cover />
            </v-avatar>
            <div class="d-none d-md-flex flex-column align-start line-height-1 ml-2">
              <span class="text-caption font-weight-bold text-grey-darken-4">{{ UserProfile.name }}</span>
              <span class="text-overline text-grey-lighten-1">View Profile</span>
            </div>
            <v-icon icon="mdi-chevron-down" size="small" class="ml-1 d-none d-md-flex" />
          </v-btn>
        </template>

        <v-list class="py-2 rounded-lg" elevation="8" role="menu">
          <v-list-item class="px-4 py-3 bg-grey-lighten-5 rounded-lg mb-2">
            <v-avatar start size="40">
              <v-img :src="UserProfile.avatar" cover />
            </v-avatar>
            <v-list-item-title class="font-weight-bold">{{ UserProfile.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-truncate">{{ UserProfile.email }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-1"></v-divider>

          <v-list-item to="/profile" prepend-icon="mdi-account-outline" title="My Profile" subtitle="Manage account settings" link role="menuitem"></v-list-item>
          
          <v-divider class="my-1"></v-divider>

          <v-list-item @click="logout" prepend-icon="mdi-logout" title="Logout" base-color="error" role="menuitem"></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer 
      v-model="drawer" 
      :permanent="$vuetify.display.mdAndUp"
      :temporary="!$vuetify.display.mdAndUp"
      app
      color="surface"
      border
      role="navigation"
      aria-label="Main Navigation Menu"
    >
      <div v-if="$vuetify.display.mdAndUp" class="d-flex align-center px-4 py-3 border-b">
        <span class="text-subtitle-2 font-weight-bold text-grey-darken-1">MENU</span>
      </div>
      
      <v-list nav density="comfortable" class="pt-2" role="list">
        <template v-if="userRole === 'user'">
          <v-list-subheader class="text-grey-darken-2 font-weight-bold pl-4" role="listitem">DISCOVER</v-list-subheader>
          
          <v-list-item to="/country" prepend-icon="mdi-earth-box" title="Countries" role="listitem" @click="handleNavigationClick">
            <template #prepend>
              <v-icon icon="mdi-earth-box" :color="$route.path.includes('/country') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>
          
          <v-list-item to="/recipes" prepend-icon="mdi-silverware-fork-knife" title="Recipes" role="listitem" @click="handleNavigationClick">
             <template #prepend>
              <v-icon icon="mdi-silverware-fork-knife" :color="$route.path.includes('/recipes') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>

          <v-list-subheader class="text-grey-darken-2 font-weight-bold pl-4 mt-4" role="listitem">MY JOURNEY</v-list-subheader>

          <v-list-item to="/favourites" prepend-icon="mdi-heart" title="Favourites" badge="3" badge-color="primary" role="listitem" @click="handleNavigationClick">
             <template #prepend>
              <v-icon icon="mdi-heart" :color="$route.path.includes('/favourites') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>

          <v-list-item to="/trips" prepend-icon="mdi-map-marker-path" title="Trip" badge="3" badge-color="primary" role="listitem" @click="handleNavigationClick">
             <template #prepend>
              <v-icon icon="mdi-map-marker-path" :color="$route.path.includes('/trips') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>
          
          <v-list-item to="/community" prepend-icon="mdi-account-group-outline" title="Community" role="listitem" @click="handleNavigationClick">
             <template #prepend>
              <v-icon icon="mdi-account-group-outline" :color="$route.path.includes('/community') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>

          <v-list-item to="/post" prepend-icon="mdi-pencil-plus-outline" title="Post" role="listitem" @click="handleNavigationClick">
             <template #prepend>
              <v-icon icon="mdi-pencil-plus-outline" :color="$route.path.includes('/post') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>

          <v-list-item to="/ai-chef" prepend-icon="mdi-chef-hat" title="Chef" role="listitem" @click="handleNavigationClick">
            <template #prepend>
              <v-icon icon="mdi-chef-hat" :color="$route.path.includes('/ai-chef') ? 'orange-darken-4' : 'grey-darken-1'" />
            </template>
          </v-list-item>
        </template>

        <template v-else-if="userRole === 'admin'">
          <v-list-subheader class="text-red-darken-2 font-weight-bold pl-4" role="listitem">ADMIN PANEL</v-list-subheader>
          
          <v-list-item to="/admin" prepend-icon="mdi-monitor-dashboard" title="Dashboard" base-color="red" role="listitem" @click="handleNavigationClick"></v-list-item>
          <v-list-item to="/admin/users" prepend-icon="mdi-account-cog" title="Users" base-color="red" role="listitem" @click="handleNavigationClick"></v-list-item>
          <v-list-item to="/admin/recipes" prepend-icon="mdi-food-drumstick" title="Recipes" base-color="red" role="listitem" @click="handleNavigationClick"></v-list-item>
          <v-list-item to="/admin/posts" prepend-icon="mdi-file-document-edit" title="Posts" base-color="red" role="listitem" @click="handleNavigationClick"></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-5 main-area" role="main" aria-label="Main Content Area">
      <v-container fluid class="pa-0 content-container">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.fullPath"/>
          </keep-alive>
        </router-view>
      </v-container>
    </v-main>

    <v-footer 
      app
      color="grey-lighten-4" 
      class="pa-0 border-t-light"
      height="auto"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <v-container fluid class="py-3">
        <v-row justify="center" class="text-center" no-gutters>
          <v-col cols="12" class="mb-2">
            <div class="d-flex align-center justify-center mb-2">
              <v-icon icon="mdi-earth" color="orange" size="28" class="mr-2" />
              <span class="text-h6 font-weight-bold text-orange-darken-4">Cultural Culinary Atlas</span>
            </div>
            <p class="text-body-2 text-grey-darken-1 mb-3">
              Discover authentic recipes from around the world
            </p>
          </v-col>
          <v-col cols="12">
            <span class="text-caption text-grey-darken-1 d-block">
              <strong class="text-orange-darken-4">Cultural Culinary Atlas</strong> 
              © {{ new Date().getFullYear() }} • COS30043 Project
            </span>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSearchStore } from "@/stores/search";
import Logo from '@/assets/logo.jpg';
import DefaultAvatar from '@/assets/default-profile.jpg';

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();

const isAuthenticated = ref(!!localStorage.getItem("userId"));
const userRole = ref(localStorage.getItem("userRole") || "user");
const searchTerm = ref("");
const drawer = ref(true);
const scrolled = ref(false);
const isSearchMobileHidden = ref(true);

const notifications = ref([]);
const notificationLoading = ref(false);

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.isRead).length
);

function toggleDrawer() {
  drawer.value = !drawer.value;
}

function handleNavigationClick() {
  if (window.innerWidth < 960) {
    drawer.value = false;
  }
}

function handleSearchSubmit() {
  const term = searchTerm.value.trim();
  if (!term) return;

  if (route.path === '/' || route.path === '/map') {
    searchStore.setSearch(term, "map");
  } else if (route.path === '/recipes') {
    searchStore.setSearch(term, "recipes");
  } else {
    searchStore.setSearch(term, "recipes");
    router.push('/recipes');
  }
}

function getSafeAvatar() {
  const avatar = localStorage.getItem("userAvatar");
  return avatar && avatar !== "null" && avatar.trim() !== "" ? avatar : DefaultAvatar;
}

const UserProfile = ref({
  name: localStorage.getItem("userName") || "Guest",
  email: localStorage.getItem("userEmail") || "",
  avatar: getSafeAvatar()
});

function handleScroll() {
  scrolled.value = window.scrollY > 10;
}

async function fetchNotifications() {
  if (notificationLoading.value) return;
  notificationLoading.value = true;
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const res = await fetch(`/api/notifications/${userId}`);
    if (res.ok) notifications.value = await res.json();
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  } finally {
    notificationLoading.value = false;
  }
}

async function markAsRead(notifId) {
  const notif = notifications.value.find(n => n._id === notifId);
  if (notif && !notif.isRead) {
    notif.isRead = true;
    try {
      await fetch(`/api/notifications/${notifId}/read`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' } 
      });
    } catch (err) {
      console.warn('Failed to sync read status:', err);
    }
  }
}

async function markAllAsRead() {
  notifications.value.forEach(n => n.isRead = true);
  try {
    const userId = localStorage.getItem('userId');
    if (userId) {
      await fetch(`/api/notifications/${userId}/read-all`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' } 
      });
    }
  } catch (err) {
    console.warn('Failed to sync read-all status:', err);
  }
}

function handleNotificationClick(notif) {
  markAsRead(notif._id);
  if (notif.relatedPostId) {
    if (['admin_approval', 'admin_reject'].includes(notif.type)) {
      router.push(`/post/${notif.relatedPostId}`);
    } else if (['like', 'comment'].includes(notif.type)) {
      router.push('/community');
    }
  }
}

function viewAllNotifications() {
  markAllAsRead();
  router.push('/profile?tab=notifications');
}

function getNotificationIcon(type) {
  const icons = {
    'like': 'mdi-heart', 'comment': 'mdi-comment-text', 'follow': 'mdi-account-plus',
    'admin_approval': 'mdi-check-circle', 'admin_reject': 'mdi-close-circle',
    'trip_update': 'mdi-map-marker-path', 'system': 'mdi-bell'
  };
  return icons[type] || 'mdi-bell';
}

function getNotificationColor(type) {
  const colors = {
    'like': 'pink', 'comment': 'blue', 'follow': 'purple',
    'admin_approval': 'green', 'admin_reject': 'orange',
    'trip_update': 'teal', 'system': 'grey'
  };
  return colors[type] || 'grey';
}

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

let notificationInterval = null;
function startNotificationPolling() {
  if (notificationInterval) clearInterval(notificationInterval);
  notificationInterval = setInterval(() => {
    if (isAuthenticated.value && userRole.value === 'user') fetchNotifications();
  }, 5 * 60 * 1000);
}

function logout() {
  localStorage.clear();
  isAuthenticated.value = false;
  userRole.value = "user";
  UserProfile.value = { name: "Guest", email: "", avatar: DefaultAvatar };
  notifications.value = [];
  if (notificationInterval) clearInterval(notificationInterval);
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);

  if (window.innerWidth < 960) {
    drawer.value = false;
  } else {
    drawer.value = true;
  }
  
  if (isAuthenticated.value && userRole.value === 'user') {
    fetchNotifications();
    startNotificationPolling();
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (notificationInterval) clearInterval(notificationInterval);
});
</script>

<style scoped>
:deep(.v-application__wrap) {
  min-height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.v-main) {
  flex: 1 0 auto !important;
  min-height: auto !important;
  height: auto !important;
  display: flex;
  flex-direction: column;
}

:deep(.v-main > .v-container),
:deep(.v-main .v-container > .v-row) {
  flex: 0 0 auto !important;
  min-height: auto !important;
}

:deep(.v-footer) {
  flex: 0 0 auto !important;
  width: 100%;
  position: relative !important;
  z-index: 1; 
}

.glass-effect {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.search-bar-custom :deep(.v-field__input) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
.search-bar-custom :deep(.v-field--variant-solo-filled) {
  box-shadow: none !important;
}

.ring-border {
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.line-height-1 { 
  line-height: 1.2; 
}

.v-list-item--active { 
  position: relative; 
}

.v-list-item--active::before {
  content: "";
  position: absolute;
  left: 0; top: 10%; bottom: 10%;
  width: 4px;
  background-color: rgb(230, 81, 0);
  border-radius: 0 4px 4px 0;
}

.notification-btn {
  position: relative;
  transition: transform 0.2s ease;
}
.notification-btn:hover { transform: scale(1.1); }

.notification-panel {
  border-radius: 16px !important;
  overflow: hidden;
}

.unread-bg { 
  background: rgba(255, 152, 0, 0.04) !important; 
}

.border-b { 
  border-bottom: 1px solid rgba(0,0,0,0.06); }
.border-t-light { 
  border-top: 1px solid rgba(0,0,0,0.06) !important; 
}

:deep(.v-list)::-webkit-scrollbar { 
  width: 4px; 
}

:deep(.v-list)::-webkit-scrollbar-track { 
  background: transparent; 
}

:deep(.v-list)::-webkit-scrollbar-thumb { 
  background: rgba(0,0,0,0.2); border-radius: 4px; 
}

.v-btn:focus-visible, .v-list-item:focus-visible {
  outline: 2px solid #ff5722 !important;
  outline-offset: 2px !important;
}

@media (max-width: 600px) {
  .app-bar-custom { 
    padding: 0 4px !important; 
  }

  .logo-btn { 
    margin-left: 2px !important; 
  }

  .notification-btn { 
    margin-right: 2px !important; 
  }

  .user-menu-btn { 
    margin-right: 2px !important; 
  }

  .d-xs-none { 
    display: none !important; 
  }
}

@media (max-width: 360px) {
  .v-app-bar { 
    height: 60px !important; 
  }

  .logo-btn :deep(img) { 
    height: 50px !important; 
    width: 65px !important; 
  }

  .v-footer .text-caption { 
    font-size: 0.7rem !important; 
  }
}
</style>