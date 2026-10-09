<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="static-popup w-full max-w-sm px-6 pt-5 pb-4 text-center" role="dialog" aria-modal="true">
      <div class="font-ui text-white leading-relaxed" style="text-shadow: 1px 1px 0 #000">
        <slot />
      </div>
      <div class="mt-5 flex justify-center gap-3">
        <button type="button" class="wow-btn min-w-[7rem]" @click="$emit('accept')">{{ acceptText }}</button>
        <button v-if="declineText" type="button" class="wow-btn min-w-[7rem]" @click="$emit('decline')">{{ declineText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  acceptText: { type: String, default: 'Accept' },
  declineText: { type: String, default: 'Decline' }, // pass '' for a single-button popup
})
defineEmits(['accept', 'decline'])
</script>

<style scoped>
/* Classic StaticPopup: navy-black dialog with gold border */
.static-popup {
  border-radius: 6px;
  border: 3px solid transparent;
  background:
    linear-gradient(180deg, rgb(10 14 40 / 0.97) 0%, rgb(2 3 12 / 0.97) 100%) padding-box,
    var(--gold-border) border-box;
  box-shadow: 0 0 0 1px #000, inset 0 0 24px rgb(0 0 0 / 0.8), 0 12px 40px rgb(0 0 0 / 0.85);
}
</style>
