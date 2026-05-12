let generationState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  payload: null,
  result: null,
  error: null,
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(generationState));
}

function updateState(patch) {
  generationState = { ...generationState, ...patch };
  emit();
}

function notifySuccess() {
  if (typeof window === "undefined") return;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Reel Ready", {
      body: "Your reel has been generated successfully.",
      tag: "reel-generated",
      requireInteraction: false,
    });
  }
}

export function getGenerationState() {
  return generationState;
}

export function subscribeGeneration(listener) {
  listeners.add(listener);
  listener(generationState);
  return () => listeners.delete(listener);
}

export async function startGeneration({ payload, generateUrl, timeoutMs = 420000 }) {
  if (generationState.status === "running") {
    return generationState;
  }

  updateState({
    status: "running",
    startedAt: Date.now(),
    finishedAt: null,
    payload,
    result: null,
    error: null,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Webhook error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    if (!data.success || (!data.videoUrl && !data.imageUrl)) {
      throw new Error(data.error || "Backend returned an unexpected response");
    }

    updateState({
      status: "success",
      finishedAt: Date.now(),
      result: data,
      error: null,
    });

    notifySuccess();
    return generationState;
  } catch (error) {
    const reason = error?.name === "AbortError"
      ? `Request timed out after ${Math.round(timeoutMs / 1000)}s`
      : error?.message || "Unknown network error";

    updateState({
      status: "error",
      finishedAt: Date.now(),
      error: reason,
    });

    return generationState;
  } finally {
    clearTimeout(timeoutId);
  }
}
