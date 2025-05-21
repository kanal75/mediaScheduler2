<template>
  <v-rating
    half-increments
    hover
    :length="5"
    :size="20"
    :model-value="rating"
    active-color="primary"
    :readonly="isGroup"
    @update:model-value="updateRating"
  />
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";

export default defineComponent({
  name: "priorityCellRenderer",
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
