// 落地页前端动态文案绑定器
// 页面在 body 上声明 data-landing-page="<pageId>"
// 并在对应元素上添加 data-landing / data-landing-href / data-landing-src 属性
(function () {
  async function bindLandingContent() {
    const pageId = document.body?.dataset?.landingPage;
    if (!pageId) return;

    try {
      const res = await fetch("/api/landing", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const content = data?.content?.[pageId];
      if (!content || typeof content !== "object") return;

      // 1. [data-landing="key"] -> textContent（严禁 innerHTML）
      document.querySelectorAll("[data-landing]").forEach(el => {
        const key = el.getAttribute("data-landing");
        if (key && content[key] !== undefined && typeof content[key] === "string") {
          el.textContent = content[key];
        }
      });

      // 2. [data-landing-href="key"] -> href
      document.querySelectorAll("[data-landing-href]").forEach(el => {
        const key = el.getAttribute("data-landing-href");
        if (key && content[key] !== undefined && typeof content[key] === "string") {
          el.setAttribute("href", content[key]);
        }
      });

      // 3. [data-landing-src="key"] -> src
      document.querySelectorAll("[data-landing-src]").forEach(el => {
        const key = el.getAttribute("data-landing-src");
        if (key && content[key] !== undefined && typeof content[key] === "string") {
          el.setAttribute("src", content[key]);
        }
      });
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindLandingContent);
  } else {
    bindLandingContent();
  }
})();
