"use client";

import {
  applyOpenWidgetRightOffset,
  scheduleOpenWidgetRightOffsetSync,
} from "@/lib/openwidgetOffset";
import { useEffect } from "react";
import Script from "next/script";

const ORG_ID = process.env.NEXT_PUBLIC_OPENWIDGET_ORG_ID?.trim();

function bindContainerGuard(container: HTMLElement): () => void {
  const syncOffset = () => applyOpenWidgetRightOffset();

  const styleObserver = new MutationObserver(syncOffset);
  styleObserver.observe(container, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  const resizeObserver = new ResizeObserver(syncOffset);
  resizeObserver.observe(container);

  const main = document.querySelector("[data-app-main-scroll]");
  if (main instanceof HTMLElement) {
    resizeObserver.observe(main);
  }

  syncOffset();

  return () => {
    styleObserver.disconnect();
    resizeObserver.disconnect();
  };
}

export function OpenWidgetLoader() {
  useEffect(() => {
    if (!ORG_ID) return;

    const syncOffset = () => applyOpenWidgetRightOffset();
    let unbindContainer: (() => void) | undefined;

    const attachContainerGuard = () => {
      const container = document.getElementById("chat-widget-container");
      if (!container || unbindContainer) return;
      unbindContainer = bindContainerGuard(container);
    };

    window.OpenWidget?.on("ready", () => {
      attachContainerGuard();
      scheduleOpenWidgetRightOffsetSync();
    });

    window.OpenWidget?.on("visibility_changed", scheduleOpenWidgetRightOffsetSync);

    attachContainerGuard();
    syncOffset();

    const bodyObserver = new MutationObserver(() => {
      attachContainerGuard();
      syncOffset();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", syncOffset);

    const main = document.querySelector("[data-app-main-scroll]");
    main?.addEventListener("scroll", syncOffset, { passive: true });

    return () => {
      bodyObserver.disconnect();
      unbindContainer?.();
      window.removeEventListener("resize", syncOffset);
      main?.removeEventListener("scroll", syncOffset);
    };
  }, []);

  if (!ORG_ID) return null;

  const initScript = `
window.__ow = window.__ow || {};
window.__ow.organizationId = ${JSON.stringify(ORG_ID)};
window.__ow.integration_name = "manual_settings";
window.__ow.product_name = "openwidget";
;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[OpenWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.openwidget.com/openwidget.js",t.head.appendChild(n)}};!n.__ow.asyncInit&&e.init(),n.OpenWidget=n.OpenWidget||e}(window,document,[].slice))
`.trim();

  return (
    <>
      <Script id="openwidget-init" strategy="afterInteractive">
        {initScript}
      </Script>
      <noscript>
        You need to{" "}
        <a
          href="https://www.openwidget.com/enable-javascript"
          rel="noopener nofollow"
        >
          enable JavaScript
        </a>{" "}
        to use the communication tool powered by{" "}
        <a
          href="https://www.openwidget.com/"
          rel="noopener nofollow"
          target="_blank"
        >
          OpenWidget
        </a>
      </noscript>
    </>
  );
}
