<template>
  <div class="password-page-bg">
    <v-container class="fill-height" style="max-width: 450px;">
      <v-card class="password-card rounded-xl" elevation="8">
        <div class="card-header-decoration"></div>

        <v-card-text class="pa-8">
          <div class="text-center mb-6">
            <div class="icon-circle mx-auto mb-4">
              <v-icon size="32" color="white">mdi-email-fast</v-icon>
            </div>
            <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">Forgot Password?</h2>
            <p class="text-body-2 text-grey">Enter your email to receive a reset link</p>
          </div>

          <v-alert v-if="sent" type="success" variant="tonal" class="mb-6" icon="mdi-check-circle">
            Reset link sent to <strong>{{ email }}</strong><br>
            <span class="text-caption">Check your inbox (and spam folder)</span>
          </v-alert>

          <v-form v-else @submit.prevent="sendResetLink">
            <div class="input-group mb-4">
              <label class="input-label">Email Address</label>
              <div class="input-field-wrapper">
                <v-icon class="input-icon" color="grey">mdi-email</v-icon>
                <v-text-field
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :rules="[rules.required, rules.email]"
                ></v-text-field>
              </div>
            </div>

            <div class="action-buttons mt-8">
              <v-btn
                block
                size="large"
                color="#ff5722"
                variant="flat"
                class="btn-submit"
                :loading="loading"
                type="submit"
              >
                Send Reset Link
              </v-btn>
              <v-btn
                block
                size="large"
                variant="text"
                color="grey"
                class="mt-3"
                @click="$router.push('/login')"
              >
                ← Back to Login
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const email = ref("")
const loading = ref(false)
const sent = ref(false)

const rules = {
  required: v => !!v || "Email is required",
  email: v => /.+@.+\..+/.test(v) || "Invalid email format"
}

async function sendResetLink() {
  if (!email.value) {
    alert("Please enter your email")
    return
  }
  
  loading.value = true
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    
    if (res.ok) {
      const data = await res.json()
      sent.value = true

      if (data.token) {
        setTimeout(() => {
          router.push({ 
            path: '/reset-password', 
            query: { token: data.token, email: data.email } 
          })
        }, 1500) 
      } else {
        setTimeout(() => {
          sent.value = false
        }, 3000)
      }
    } else {
      const data = await res.json()
      alert(`${data.error || 'Failed to send reset link'}`)
    }
  } catch (err) {
    console.error('Send reset link failed:', err)
    alert('System error, please try again later')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
.btn-submit {
    border-radius: 10px; 
    font-weight: 600; 
    letter-spacing: 0.5px;
    text-transform: none; 
    transition: transform 0.2s;
}
.btn-submit:hover {
    transform: translateY(-1px); 
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}
</style>