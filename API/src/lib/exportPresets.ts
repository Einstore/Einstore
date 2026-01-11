export const exportPresets = {
  global: {
    id: "global",
    taxColumn: "tax",
    taxRateColumn: "tax_rate",
    dateLocale: "en-GB",
    csvDelimiter: ",",
  },
  us: {
    id: "us",
    taxColumn: "sales_tax",
    taxRateColumn: "sales_tax_rate",
    dateLocale: "en-US",
    csvDelimiter: ",",
  },
  gb: {
    id: "gb",
    taxColumn: "vat",
    taxRateColumn: "vat_rate",
    dateLocale: "en-GB",
    csvDelimiter: ",",
  },
  ca: {
    id: "ca",
    taxColumn: "gst_hst",
    taxRateColumn: "gst_hst_rate",
    dateLocale: "en-CA",
    csvDelimiter: ",",
  },
  au: {
    id: "au",
    taxColumn: "gst",
    taxRateColumn: "gst_rate",
    dateLocale: "en-AU",
    csvDelimiter: ",",
  },
  de: {
    id: "de",
    taxColumn: "mwst",
    taxRateColumn: "mwst_rate",
    dateLocale: "de-DE",
    csvDelimiter: ";",
  },
  fr: {
    id: "fr",
    taxColumn: "tva",
    taxRateColumn: "tva_rate",
    dateLocale: "fr-FR",
    csvDelimiter: ";",
  },
} as const;

export type ExportPresetId = keyof typeof exportPresets;

export const defaultExportPreset: ExportPresetId = "global";

export const parseExportPresetInput = (value: unknown) => {
  if (value === undefined) {
    return { value: undefined as ExportPresetId | undefined };
  }
  if (value === null) {
    return { error: "invalid_export_preset" } as const;
  }
  const normalized = String(value).trim().toLowerCase() as ExportPresetId;
  if (!normalized || !(normalized in exportPresets)) {
    return { error: "invalid_export_preset" } as const;
  }
  return { value: normalized } as const;
};
