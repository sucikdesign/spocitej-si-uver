import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/app.css";

// třída „motion“ hned při startu, aby úvodní animace neproblikla
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("motion");
  // úvodní video: obsah hero a navigace skryté, dokud intro nedoběhne (jen na úvodní stránce)
  if (!window.location.hash.startsWith("#/")) document.documentElement.classList.add("intro-playing");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
