export type Lang = "en" | "ms";

type NavDict = {
  dashboard: string;
  listings: string;
  addListing: string;
  deals: string;
  leads: string;
  myProfile: string;
  analytics: string;
  adminPanel: string;
  settings: string;
};

type SettingsDict = {
  title: string;
  subtitle: string;
  account: string;
  email: string;
  myProfile: string;
  publicProfile: string;
  adminPanel: string;
  demoMode: string;
  demoActive: string;
  demoInactive: string;
  legal: string;
  privacy: string;
  terms: string;
  signOut: string;
  language: string;
  languageSubtitle: string;
  english: string;
  malay: string;
};

export type Translations = {
  nav: NavDict;
  settings: SettingsDict;
};

export type NavKey = keyof NavDict;

export const translations: Record<Lang, Translations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      listings: "Listings",
      addListing: "Add Listing",
      deals: "Deals",
      leads: "Leads",
      myProfile: "My Profile",
      analytics: "Analytics",
      adminPanel: "Admin Panel",
      settings: "Settings",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account settings.",
      account: "Account",
      email: "Email",
      myProfile: "My Profile",
      publicProfile: "Public Profile",
      adminPanel: "Admin Panel",
      demoMode: "Demo Mode",
      demoActive:
        "App is running in demo mode. Some data may be sample only.",
      demoInactive: "Demo Mode is inactive. All data is your real data.",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms",
      signOut: "Sign Out",
      language: "Language",
      languageSubtitle: "Choose your preferred display language.",
      english: "English",
      malay: "Bahasa Malaysia",
    },
  },
  ms: {
    nav: {
      dashboard: "Papan Pemuka",
      listings: "Senarai Hartanah",
      addListing: "Tambah Hartanah",
      deals: "Tawaran",
      leads: "Petunjuk Jualan",
      myProfile: "Profil Saya",
      analytics: "Analitik",
      adminPanel: "Panel Admin",
      settings: "Tetapan",
    },
    settings: {
      title: "Tetapan",
      subtitle: "Tetapan akaun anda.",
      account: "Akaun",
      email: "Emel",
      myProfile: "Profil Saya",
      publicProfile: "Profil Awam",
      adminPanel: "Panel Admin",
      demoMode: "Mod Demo",
      demoActive:
        "Aplikasi sedang berjalan dalam mod demo. Sebahagian data mungkin contoh sahaja.",
      demoInactive:
        "Mod Demo tidak aktif. Semua data adalah data sebenar anda.",
      legal: "Perundangan",
      privacy: "Privasi",
      terms: "Terma",
      signOut: "Log Keluar",
      language: "Bahasa",
      languageSubtitle: "Pilih bahasa paparan pilihan anda.",
      english: "English",
      malay: "Bahasa Malaysia",
    },
  },
};
