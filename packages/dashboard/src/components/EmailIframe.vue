<template>
  <iframe
    ref="iframe"
    class="w-full h-full border-0"
    sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"
    @load="onLoad"
  ></iframe>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
	body: string;
}>();

const iframe = ref<HTMLIFrameElement | null>(null);

const updateIframeContent = () => {
	if (iframe.value && props.body) {
		const doc = iframe.value.contentDocument;
		if (doc) {
			doc.open();
			doc.write(`
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                background-color: #f8f8f8;
                color: #333;
                font-family: sans-serif;
                padding: 1rem;
              }
            </style>
          </head>
          <body>
            ${props.body}
          </body>
        </html>
      `);
			doc.close();
		}
	}
};

const onLoad = () => {
	updateIframeContent();
};

watch(
	() => props.body,
	() => {
		updateIframeContent();
	},
);
</script>
