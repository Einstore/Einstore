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

  const loaderScript = document.createElement("script");
  loaderScript.async = true;
  loaderScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  loaderScript.dataset.analytics = "google";
  document.head.appendChild(loaderScript);

  const inlineScript = document.createElement("script");
  inlineScript.dataset.analytics = "google";
  inlineScript.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', ${JSON.stringify(measurementId)});
  `;
  document.head.appendChild(inlineScript);

  scriptInjected = true;
};

export const enableAnalytics = (measurementId: string) => {
  if (!measurementId || currentMeasurementId === measurementId) {
    return;
  }
  if (scriptInjected && currentMeasurementId) {
    currentMeasurementId = measurementId;
    window.gtag?.("config", measurementId);
    return;
  }
  currentMeasurementId = measurementId;
  injectAnalyticsScript(measurementId);
};

export const trackPageView = (path: string) => {
  if (!currentMeasurementId || !path) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    send_to: currentMeasurementId,
  });
};
