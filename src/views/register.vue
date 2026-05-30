<template>
  <v-container fluid class="pt-16 bg-grey-lighten-4">
    <v-row class="h-100" justify="center" align="center">
      <v-col cols="12" md="6" class="d-none d-md-flex flex-column justify-center align-center pa-8" style="background-color:#ff5722;">
        <div class="text-center">
          <v-icon size="120" color="white" class="mb-6">mdi-utensils</v-icon>
          <h1 class="text-h2 font-weight-bold text-white mb-4">Food Voyage</h1>
          <p class="text-h6 text-grey-lighten-3">Start your culinary journey and discover authentic global cuisine.</p>
        </div>
      </v-col>

      <v-col cols="12" md="5" lg="4">
        <v-card elevation="4" rounded="lg" class="pa-4">
          <v-card-text>
            <div class="text-center mb-6">
              <h2 class="text-h3 font-weight-bold" style="color:#ff5722;">Join Us</h2>
              <p class="text-grey mt-2">Create an account and start planning your food adventure</p>
            </div>

            <v-form ref="formRef" v-model="valid" @submit.prevent="register">
              <v-text-field
                v-model="username"
                :rules="usernameRules"
                label="Username"
                placeholder="Please enter your username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                required
              ></v-text-field>

              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                placeholder="example@mail.com"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                type="email"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                placeholder="At least 8 characters"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                required
              ></v-text-field>

              <v-text-field
                v-model="confirmPassword"
                :rules="confirmPasswordRules"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm Password"
                placeholder="Re-enter your password"
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                variant="outlined"
                density="comfortable"
                class="mb-6"
                required
              ></v-text-field>

              <v-btn
                type="submit"
                :loading="loading"
                block
                size="large"
                style="background-color:#ff5722; color:white;"
                class="mb-4 font-weight-bold"
              >
              Register Now
              </v-btn>

              <div class="text-center">
                <span class="text-grey">Already have an account?</span>
                <router-link to="/login" class="text-decoration-none ml-1 font-weight-bold" style="color:#d32f2f">
                  Login
                </router-link>
              </div>

            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref(null);
const valid = ref(false);
const loading = ref(false);

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const usernameRules = [
  v => !!v || 'Please enter a username',
  v => (v && v.length >= 3) || 'Username must be at least 3 characters'
];

const emailRules = [
  v => !!v || 'Please enter an email',
  v => /.+@.+\..+/.test(v) || 'Please enter a valid email address'
];

const passwordRules = [
  v => !!v || 'Please enter a password',
  v => (v && v.length >= 6) || 'Password must be at least 6 characters'
];

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === password.value || 'Passwords do not match'
];

const register = async () => {
  const { valid } = await formRef.value.validate();
  
  if (valid) {
    loading.value = true;

    try {
      // ✅ 使用相对路径
      const res = await fetch('/api/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value,
          email: email.value,
          password: password.value
        })
      });

      if (res.ok){
        alert("Registration successful! Please login.")
        router.push("/login")
      } else {
        const error = await res.json();
        alert("Registration failed: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally{
      loading.value = false;
    }
  }
};
</script>