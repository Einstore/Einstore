let currentMeasurementId: string | null = null;
let scriptInjected = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const injectAnalyticsScript = (measurementId: string) => {
  if (scriptInjected) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.analytics = "google";
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  scriptInjected = true;
};

export const enableAnalytics = (measurementId: string) => {
  if (!measurementId || currentMeasurementId === measurementId) {
    return;
  }
  currentMeasurementId = measurementId;
  injectAnalyticsScript(measurementId);
  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId);
};

export const trackPageView = (path: string) => {
  if (!currentMeasurementId || !path) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    send_to: currentMeasurementId,
  });
};
