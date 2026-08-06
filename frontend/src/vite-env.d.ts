/// <reference types="vite/client" />

declare module "*.scss";
declare module "*.css";

interface Window {
  gtag?: (...args: unknown[]) => void;
}
