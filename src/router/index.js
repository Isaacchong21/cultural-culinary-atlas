import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import '@fortawesome/fontawesome-free/css/all.css'
import Home from '../views/Home.vue'
import Country from '../views/Country.vue'
import Recipes from '../views/Recipes.vue'
import Favourites from '../views/FavouritePage.vue'
import RecipeDetail from '../views/RecipeDetail.vue'
import TripList from '../views/TripList.vue'
import Community from '../views/Community.vue'
import Post from '../views/Post.vue'
import Login from '../views/login.vue'
import Register from '../views/register.vue'
import UserProfile from '../views/UserProfile.vue'
import AdminDashboard from '../admin/AdminDashboard.vue'
import NotFound from '../views/NotFound.vue'
import UserManagement from '../admin/UserManagement.vue'
import RecipeManagement from '../admin/RecipesManagement.vue'
import PostManagement from '../admin/PostManagement.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import TripDetail from '../views/TripDetail.vue'
import PostDetail from '../views/PostDetail.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', component: Home },
      { path: 'country', component: Country },
      { path: 'recipes', component: Recipes },
      { path: 'favourites', component: Favourites },
      { path: 'recipe/:id', component: RecipeDetail },
      { path: 'trips', component: TripList },
      { path: 'trips/:id', component: TripDetail},
      { path: 'community', component: Community },
      { path: 'post', component: Post},
      { 
        path: 'post/:id',  // ✅ 相对路径，正确
        name: 'PostDetail',
        component: PostDetail,
        props: true
      },
      { 
        path: 'profile', 
        redirect: to => {
          const userId = localStorage.getItem('userId')
          return userId ? `/profile/${userId}` : '/community'
        }
      },
      { 
        path: 'profile/:id', 
        component: UserProfile,
        props: true
      },
      { path: 'admin', component: AdminDashboard },
      { path: 'admin/users', component: UserManagement},
      { path: 'admin/recipes', component: RecipeManagement},
      { path: 'admin/posts', component: PostManagement}
    ]
  },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword},
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ 修复：使用新语法（返回路由值，而不是调用 next()）
router.beforeEach((to, from) => {
  const isAuthenticated = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  const requiresAuth = ['/trips', '/favourites', '/post', '/admin']
  const requiresAdmin = ['/admin']

  if (requiresAuth.some(path => to.path.startsWith(path))) {
    if (!isAuthenticated) {
      return '/login'  // ✅ 直接返回路由路径
    }
  }

  if (requiresAdmin.some(path => to.path.startsWith(path))) {
    if (!isAuthenticated) {
      return '/login'
    }
    if (userRole !== 'admin') {
      return '/community'
    }
  }

  // ✅ 不需要调用 next()，默认继续导航
})

export default router