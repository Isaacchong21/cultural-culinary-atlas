<template>
  <div class="password-page-bg">
    <v-container class="fill-height" style="max-width: 450px;">
      <v-card class="password-card rounded-xl" elevation="8">
        <div class="card-header-decoration"></div>
        <v-card-text class="pa-8">
          <div v-if="verifying" class="text-center py-8">
            <v-progress-circular indeterminate color="blue" size="40" class="mb-4" />
            <p class="text-grey">Verifying reset link...</p>
          </div>

          <div v-else-if="error" class="text-center py-8">
            <v-icon size="48" color="error" class="mb-4">mdi-alert-circle</v-icon>
            <h3 class="text-h6 font-weight-bold text-grey mb-2">Invalid Link</h3>
            <p class="text-body-2 text-grey-darken-1 mb-4">{{ error }}</p>
            <v-btn color="blue" @click="$router.push('/forgot-password')">Request New Link</v-btn>
          </div>

          <v-form v-else @submit.prevent="resetPassword">
            <div class="text-center mb-6">
              <div class="icon-circle mx-auto mb-4">
                <v-icon size="32" color="white">mdi-lock-reset</v-icon>
              </div>
              <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">Set New Password</h2>
              <p class="text-body-2 text-grey">for {{ email }}</p>
            </div>

            <div class="input-group mb-4">
              <label class="input-label">New Password</label>
              <div class="input-field-wrapper">
                <v-icon class="input-icon" color="grey">mdi-key-variant</v-icon>
                <v-text-field
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter new password"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :rules="[rules.required, rules.minLength, rules.complexity]"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                ></v-text-field>
              </div>
            </div>

            <div class="input-group mb-4">
              <label class="input-label">Confirm Password</label>
              <div class="input-field-wrapper">
                <v-icon class="input-icon" color="grey">mdi-check-circle</v-icon>
                <v-text-field
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm your password"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :rules="[rules.required, rules.match]"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                ></v-text-field>
              </div>
            </div>

            <div class="action-buttons mt-8">
              <v-btn
                block
                size="large"
                color="#2196f3"
                variant="flat"
                class="btn-submit"
                :loading="loading"
                type="submit"
              >
                Reset Password
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const token = ref(route.query.token)
const email = ref(route.query.email)
const newPassword = ref("")
const confirmPassword = ref("")
const loading = ref(false)
const verifying = ref(true)
const error = ref("")

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const rules = {
  required: v => !!v || "Field is required",
  minLength: v => (v && v.length >= 8) || "At least 8 characters",
  complexity: v => /[A-Za-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) || "Must contain letters, numbers & symbol",
  match: v => v === newPassword.value || "Passwords do not match"
}

onMounted(async () => {
  if (!token.value || !email.value) {
    error.value = "Missing token or email"
    verifying.value = false
    return
  }

  try {
    verifying.value = false
  } catch (err) {
    error.value = "Invalid or expired link"
    verifying.value = false
  }
})

async function resetPassword() {
  if (newPassword.value !== confirmPassword.value) {
    alert("Passwords do not match")
    return
  }

  loading.value = true
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        email: email.value,
        newPassword: newPassword.value
      })
    })

    if (res.ok) {
      alert("Password reset successfully! Please log in with your new password.")
      router.push('/login')
    } else {
      const data = await res.json()
      error.value = data.error || "Failed to reset password"
    }
  } catch (err) {
    console.error('Reset password failed:', err)
    error.value = "System error, please try again"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card-header-decoration {
  background: linear-gradient(to right, #2196f3, #64b5f6);
}
.icon-circle {
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}
.btn-submit {
  background: #2196f3 !important;
}
.btn-submit:hover {
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4) !important;
}

.password-page-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
    display: flex; 
    align-items: center; 
    justify-content: center;
}
.password-card {
    background: #ffffff; 
    position: relative; 
    overflow: visible;
}

.card-header-decoration {
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 8px;
    background: linear-gradient(to right, #2196f3, #64b5f6);
    border-radius: 12px 12px 0 0;
}

.icon-circle {
    width: 70px; 
    height: 70px;
    background: linear-gradient(135deg, #2196f3, #64b5f6);
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.input-group { 
    position: relative; 
}

.input-label {
    display: block; 
    font-size: 0.85rem; 
    color: #555; 
    font-weight: 600; 
    margin-bottom: 8px;
}

.input-field-wrapper { 
    position: relative; 
}

.input-icon { 
    position: absolute; 
    top: 14px; 
    left: 12px; 
    z-index: 1; 
}

.custom-input :deep(.v-field) {
    padding-left: 40px; 
    border-radius: 10px; 
    background-color: #fafafa;
    transition: all 0.3s ease;
}

.custom-input :deep(.v-field--focused) {
    background-color: #fff; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>