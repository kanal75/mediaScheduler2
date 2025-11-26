<template>
  <div class="speech-wrapper">
    <div class="speech-controls p-inputgroup">
      <Button
        label="Spela in"
        icon="pi pi-microphone"
        class="p-button-primary"
        @click="startRecording"
        :disabled="isRecording"
      />
      <Button
        label="Stoppa"
        icon="pi pi-stop"
        class="p-button-primary stop-button ml-3"
        @click="stopRecording"
        :disabled="!isRecording"
      />
    </div>

    <small class="status" :class="{ 'status-active': isRecording }">
      {{ status }}
    </small>

    <div class="field mt-3">
      <label class="field-label">Transkriberad text</label>
      <Textarea
        v-model="transcript"
        auto-resize
        rows="3"
        class="w-full"
        readonly
      />
    </div>

    <div class="field mt-3">
      <label class="field-label">JSON-svar från /oalink</label>
      <Textarea
        :value="jsonDisplay"
        auto-resize
        rows="4"
        class="w-full font-mono text-xs"
        readonly
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import Button from "primevue/button";
import Textarea from "primevue/textarea";

export default defineComponent({
  name: "SpeechInput",
  components: { Button, Textarea },
  emits: ["schedule-from-speech"],
  setup(_, { emit }) {
    const status = ref("Ingen inspelning pågår.");
    const transcript = ref("");
    const jsonResult = ref<unknown | null>(null);
    const isRecording = ref(false);
    let mediaRecorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];

    const jsonDisplay = computed(() =>
      jsonResult.value ? JSON.stringify(jsonResult.value, null, 2) : ""
    );

    const reset = () => {
      chunks = [];
      transcript.value = "";
      jsonResult.value = null;
    };

    const startRecording = async () => {
      reset();
      status.value = "Förbereder mikrofon...";

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          status.value = "Skickar ljud till servern...";

          const blob = new Blob(chunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "inspelning.webm");

          try {
            const resp = await fetch("http://localhost:5000/api/speech", {
              method: "POST",
              body: formData,
            });

            const text = await resp.text();
            transcript.value = text || "(tomt svar)";
            status.value = "Text mottagen, skickar vidare till /oalink...";

            const oalinkUrl =
              "http://127.0.0.1/oalink?text=" +
              encodeURIComponent(text) +
              "&xslt=OA_MEDIASCHEDULER_TIME.xsl";

            const oalinkResp = await fetch(oalinkUrl, {
              method: "GET",
            });

            const json = await oalinkResp.json();
            jsonResult.value = json;
            emit("schedule-from-speech", json);

            status.value = "Klar ✓";
          } catch (err) {
            status.value = "Fel vid serverkontakt: " + String(err);
          } finally {
            isRecording.value = false;
          }
        };

        mediaRecorder.start();
        isRecording.value = true;
        status.value = "Spelar in...";
      } catch (err) {
        status.value = "Mikrofonfel: " + String(err);
        isRecording.value = false;
      }
    };

    const stopRecording = () => {
      if (mediaRecorder && isRecording.value) {
        mediaRecorder.stop();
        status.value = "Bearbetar ljud...";
      }
    };

    return {
      status,
      transcript,
      jsonDisplay,
      isRecording,
      startRecording,
      stopRecording,
    };
  },
});
</script>

<style scoped>
.speech-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status {
  margin-top: 8px;
  font-style: italic;
  color: #666;
}
.status-active {
  color: var(--primary-color);
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: inline-block;
}

.stop-button :deep(.pi-stop) {
  color: #ef4444; /* solid red stop icon on white button */
}
</style>
