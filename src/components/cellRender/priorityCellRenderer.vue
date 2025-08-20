<template>
  <div class="priority-cell">
    <Rating
      :modelValue="rating"
      :readonly="isGroup"
      :cancel="false"
      @update:modelValue="updateRating"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import Rating from "primevue/rating";

export default defineComponent({
  name: "priorityCellRenderer",
  components: { Rating },
  props: {
    params: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    // Use the row's data priority field as the model
    const rating = ref(props.params.data?.priority ?? props.params.value);
    // Disable editing if on group row
    const isGroup = computed(() => props.params.node?.group === true);

    // Update the grid value and the row's data priority field
    const updateRating = (newRating: string | number) => {
      const ratingNumber =
        typeof newRating === "string" ? parseFloat(newRating) : newRating;
      rating.value = ratingNumber;
      if (props.params.setValue) {
        props.params.setValue(ratingNumber);
      }
      // Save the updated schedule to the database (like other editors)
      if (
        props.params.data &&
        props.params.context &&
        props.params.context.rootStore
      ) {
        props.params.context.rootStore.upsertSchedule({
          ...props.params.data,
          priority: ratingNumber,
        });
      }
    };

    // Watch for external changes to the priority field
    watch(
      () => props.params.data?.priority,
      (newVal) => {
        rating.value = newVal;
      }
    );

    return {
      rating,
      updateRating,
      isGroup,
    };
  },
});
</script>

<style>
.priority-cell {
  display: flex !important;
  align-items: center; /* vertical center inside AG Grid row height */
  justify-content: center; /* horizontal center */
  height: 100%;
  width: 100%;
}
/* Ensure PrimeVue rating doesn't introduce extra vertical spacing */
:deep(.p-rating) {
  line-height: 1;
}
</style>
