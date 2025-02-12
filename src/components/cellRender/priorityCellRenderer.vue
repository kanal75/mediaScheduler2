<template>
  <v-rating
    half-increments
    hover
    :length="5"
    :size="20"
    :model-value="rating"
    active-color="primary"
    @update:model-value="updateRating"
  />
</template>

<script>
export default {
  name: "priorityCellRenderer",
  props: ["params"],
  data() {
    return {
      // Initialize the rating from the cell value
      rating: this.params.value,
    };
  },
  methods: {
    updateRating(newRating) {
      this.rating = newRating;
      // Optionally, update the grid value if needed:
      if (this.params.setValue) {
        this.params.setValue(newRating);
      }
    },
  },
  watch: {
    // Update the rating if the grid value changes externally
    "params.value"(newVal) {
      this.rating = newVal;
    },
  },
};
</script>
