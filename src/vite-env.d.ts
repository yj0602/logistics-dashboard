/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string
  readonly VITE_AMAZON_LOCATION_API_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK_ROUTE_INPUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
