import dev from "./dev.json";
import en from "./en.json";
import fr from "./fr.json";

export const LOCALES = {
  dev: {
    translation: dev,
    label: "Dev language",
  },
  en: {
    translation: en,
    label: "English",
  },
  fr: {
    translation: fr,
    label: "Français",
  },
};

export const DEFAULT_LOCALE = process.env.NODE_ENV !== "production" ? "dev" : "en";
