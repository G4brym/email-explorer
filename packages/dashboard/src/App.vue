<template>
  <router-view />
  <Toast />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Toast from "@/components/Toast.vue";
import { useAppSettings } from "@/composables/useAppSettings";

const { fetchSettings } = useAppSettings();

onMounted(() => {
	fetchSettings();
});
</script>
