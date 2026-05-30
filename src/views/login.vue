<template>
  <div class="auth-page-bg">
    <v-container class="fill-height" style="max-width: 450px;">
      <v-card class="auth-card rounded-2xl" elevation="12">
        <!-- 顶部装饰条 -->
        <div class="card-header-decoration"></div>

        <v-card-text class="pa-8">
          <div class="text-center mb-6">
            <div class="icon-circle mx-auto mb-4">
              <v-icon size="40" color="white">mdi-login</v-icon>
            </div>
            <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">Welcome Back!</h2>
            <p class="text-body-2 text-grey">Please log in to continue</p>
          </div>

          <v-form ref="formRef" @submit.prevent="handleLogin">
            <!-- 邮箱 -->
            <div class="input-group mb-4">
              <label class="input-label">Email Address</label>
              <div class="input-field-wrapper">
                <v-icon class="input-icon" color="grey">mdi-email</v-icon>
                <v-text-field
                  v-model="email"
                  :rules="emailRules"
                  type="email"
                  placeholder="your@email.com"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                ></v-text-field>
              </div>
            </div>

            <!-- 密码 -->
            <div class="input-group mb-2">
              <label class="input-label">Password</label>
              <div class="input-field-wrapper">
                <v-icon class="input-icon" color="grey">mdi-lock</v-icon>
                <v-text-field
                  v-model="password"
                  :rules="passwordRules"
                  type="password"
                  placeholder="Enter your password"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                ></v-text-field>
              </div>
            </div>

            <!-- 忘记密码链接 -->
            <div class="text-right mt-2 mb-6">
              <router-link to="/forgot-password" class="text-decoration-none text-blue font-weight-medium">
                Forgot Password?
              </router-link>
            </div>

            <!-- 登录按钮 -->
            <v-btn
              block
              size="large"
              color="#ff5722"
              variant="flat"
              class="btn-submit"
              :loading="loading"
              type="submit"
            >
              Login
            </v-btn>

            <!-- 注册链接 -->
            <p class="switch-link text-center mt-4 mb-0">
              Don't have an account? 
              <router-link to="/register" class="text-blue font-weight-bold text-decoration-none">
                Register
              </router-link>
            </p>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const email = ref('');
const password = ref('');

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => (v && v.length >= 6) || "Password must be at least 6 characters"
];

async function handleLogin() {
  const { valid } = await formRef.value.validate();

  if (valid) {
    loading.value = true;

    try {
      // ✅ 使用相对路径
      const res = await fetch('/api/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value })
      });

      if (res.ok) {
        const data = await res.json();
        const avatar = data.avatar && data.avatar !== "null" ? data.avatar : "";

        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userAvatar", avatar);
        localStorage.setItem("userRole", data.role);

        alert("Login Successful!");

        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        const error = await res.json();
        alert("Login failed: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      loading.value = false;
    }
  }
}
</script>

<style scoped>
.auth-page-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  background: #ffffff;
  position: relative;
  overflow: hidden;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(to right, #ff5722, #ff9100);
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff5722, #ff9100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(255, 87, 34, 0.3);
  transition: transform 0.3s ease;
}

.icon-circle:hover { transform: scale(1.05); }

.input-group { position: relative; }

.input-label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  font-weight: 600;
  margin-bottom: 8px;
}

.input-field-wrapper { position: relative; }

.input-icon {
  position: absolute;
  top: 14px;
  left: 12px;
  z-index: 1;
}

.custom-input :deep(.v-field) {
  padding-left: 40px;
  border-radius: 12px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.custom-input :deep(.v-field--focused) {
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-submit {
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  transition: all 0.3s ease;
  padding: 12px;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 87, 34, 0.4);
}

.switch-link {
  font-size: 0.9rem;
  color: #666;
}

.text-blue { color: #2196f3 !important; }

@media (max-width: 600px) {
  .auth-card { padding: 0; }
  .pa-8 { padding: 32px 24px !important; }
}
</style>