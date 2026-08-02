import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-RRVLDRNXZ6";

export default function GoogleAnalytics() {
  useEffect(() => {
    if (document.getElementById("google-analytics")) return;

    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gtagScript);

    const inlineScript = document.createElement("script");
    inlineScript.id = "google-analytics";
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(inlineScript);
  }, []);

  return null;
}
