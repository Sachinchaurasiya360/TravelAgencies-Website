export type Locale = "en" | "hi" | "mr";

export const LOCALES: { value: Locale; label: string; nativeLabel: string }[] = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { value: "mr", label: "Marathi", nativeLabel: "मराठी" },
];

export const DEFAULT_LOCALE: Locale = "en";
