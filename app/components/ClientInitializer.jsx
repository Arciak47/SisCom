"use client";

import { useEffect } from "react";

export default function ClientInitializer() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => console.log("Service Worker registered:", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err));
      });
    }

    if (typeof window !== "undefined" && !window.__alertOverridden) {
      window.__alertOverridden = true;

      window.alert = (message) => {
        // Find or create toast container
        let container = document.getElementById("custom-toast-container");
        if (!container) {
          container = document.createElement("div");
          container.id = "custom-toast-container";
          container.style.position = "fixed";
          container.style.top = "24px";
          container.style.right = "24px";
          container.style.zIndex = "999999";
          container.style.display = "flex";
          container.style.flexDirection = "column";
          container.style.gap = "12px";
          container.style.pointerEvents = "none";
          document.body.appendChild(container);
        }

        // Create toast item
        const toast = document.createElement("div");
        toast.style.pointerEvents = "auto";
        toast.style.minWidth = "320px";
        toast.style.maxWidth = "420px";
        toast.style.background = "rgba(255, 255, 255, 0.95)";
        toast.style.backdropFilter = "blur(12px)";
        toast.style.border = "1px solid rgba(0, 0, 0, 0.08)";
        toast.style.borderRadius = "16px";
        toast.style.padding = "16px 20px";
        toast.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.12)";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.gap = "14px";
        toast.style.transform = "translateX(130%)";
        toast.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
        toast.style.fontFamily = "var(--font-geist-sans), system-ui, sans-serif";
        toast.style.fontSize = "14px";
        toast.style.fontWeight = "600";
        toast.style.color = "#1f2937";

        // Determine icon and color indicators based on message patterns
        let icon = "🔔";
        let colorBorder = "5px solid #3b82f6";
        let cleanMessage = message;

        if (message.includes("✅") || message.includes("correctamente") || message.includes("éxito") || message.includes("agregado") || message.includes("guardada")) {
          icon = "🟢";
          colorBorder = "5px solid #10b981";
          cleanMessage = message.replace("✅", "").trim();
        } else if (message.includes("❌") || message.includes("Error") || message.includes("incorrecto") || message.includes("incorrectas") || message.includes("no coinciden") || message.includes("incompleto") || message.includes("fuera de")) {
          icon = "🔴";
          colorBorder = "5px solid #ef4444";
          cleanMessage = message.replace("❌", "").trim();
        } else if (message.includes("⚠️") || message.includes("Completa") || message.includes("seguro") || message.includes("Advertencia")) {
          icon = "🟡";
          colorBorder = "5px solid #f59e0b";
          cleanMessage = message.replace("⚠️", "").trim();
        }

        toast.style.borderLeft = colorBorder;

        // Icon element
        const iconContainer = document.createElement("span");
        iconContainer.innerText = icon;
        iconContainer.style.fontSize = "18px";
        iconContainer.style.flexShrink = "0";

        // Message text
        const textContainer = document.createElement("span");
        textContainer.innerText = cleanMessage;
        textContainer.style.flex = "1";
        textContainer.style.lineHeight = "1.4";

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.innerText = "×";
        closeBtn.style.border = "none";
        closeBtn.style.background = "none";
        closeBtn.style.color = "#9ca3af";
        closeBtn.style.fontSize = "22px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.padding = "0 4px";
        closeBtn.style.lineHeight = "1";
        closeBtn.style.transition = "color 0.2s, transform 0.2s";
        closeBtn.onmouseover = () => {
          closeBtn.style.color = "#4b5563";
          closeBtn.style.transform = "scale(1.15)";
        };
        closeBtn.onmouseout = () => {
          closeBtn.style.color = "#9ca3af";
          closeBtn.style.transform = "scale(1)";
        };
        closeBtn.onclick = () => {
          toast.style.transform = "translateX(130%)";
          setTimeout(() => toast.remove(), 400);
        };

        toast.appendChild(iconContainer);
        toast.appendChild(textContainer);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Slide in
        setTimeout(() => {
          toast.style.transform = "translateX(0)";
        }, 30);

        // Slide out and remove after 4.5 seconds
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.transform = "translateX(130%)";
            setTimeout(() => {
              if (toast.parentNode) toast.remove();
            }, 400);
          }
        }, 4500);
      };
    }
  }, []);

  return null;
}
