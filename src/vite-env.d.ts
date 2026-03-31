/// <reference types="vite/client" />/// reference types=\" "vite/client\  

  

interface ImportMetaEnv {interface ImportMetaEnv {  

  readonly GEMINI_API_KEY?: string;  readonly VITE_WALLET_BYPASS: string;  

  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;  readonly VITE_OPENCLAW_TOKEN?: string;  

  readonly VITE_SUPABASE_URL?: string;}  

  readonly VITE_SUPABASE_KEY?: string;  

  readonly VITE_OPENCLAW_TOKEN?: string;interface ImportMeta {  

  readonly VITE_OPENCLAW_MODEL?: string;  readonly env: ImportMetaEnv;  

  readonly VITE_OPENCLAW_URL?: string;} 

  readonly VITE_EXTRACTOR_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_ENDPOINT?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_APP_ENVIRONMENT?: string;
  readonly VITE_ENABLE_WEB3?: string;
  readonly VITE_ENABLE_LINKEDIN_SCRAPER?: string;
  readonly VITE_ENABLE_PDF_ANALYSIS?: string;
  readonly VITE_WALLET_BYPASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
