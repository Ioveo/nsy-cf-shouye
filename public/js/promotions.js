// 全站统一推广位解析器 (public/js/promotions.js)
// 供软件中心、门户首页、文章、音乐频道统一调用
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NsyPromotions = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  /**
   * 解析并渲染可用的推广位列表
   * @param {Object} options
   * @param {Object} options.promotionsConfig 推广位原始配置 { items: [] }
   * @param {Object} options.catalog 全局 catalog 数据
   * @param {string} options.placement 投放位置: "software" | "portal" | "music" | "articles"
   * @param {number} [options.now] 当前时间戳，默认为 Date.now()
   * @returns {Array<Object>} 已解析的展示项列表，找不到实体已自动过滤
   */
  function resolvePromotions(arg1, arg2, arg3, arg4) {
    let promotionsConfig, catalog, placement, now;
    if (arg1 && typeof arg1 === "object" && (arg1.promotionsConfig !== undefined || (arg1.placement !== undefined && arg2 === undefined))) {
      promotionsConfig = arg1.promotionsConfig;
      catalog = arg1.catalog;
      placement = arg1.placement;
      now = arg1.now ?? Date.now();
    } else {
      promotionsConfig = arg1;
      catalog = arg2;
      placement = arg3;
      now = arg4 ?? Date.now();
    }
    const rawItems = Array.isArray(promotionsConfig?.items) ? promotionsConfig.items : [];
    if (!rawItems.length) return [];

    const softwareList = Array.isArray(catalog?.software) ? catalog.software : [];
    const articlesList = Array.isArray(catalog?.articles) ? catalog.articles : [];

    const resolved = [];

    for (const item of rawItems) {
      if (!item || typeof item !== "object") continue;
      if (item.status !== "active") continue;

      // 1. 投放位置匹配
      const placements = Array.isArray(item.placements) ? item.placements : [];
      if (placement && !placements.includes(placement)) continue;

      // 2. 时间窗口校验 (0 = 不限)
      const startAt = Number(item.startAt) || 0;
      const endAt = Number(item.endAt) || 0;
      if (startAt > 0 && now < startAt) continue;
      if (endAt > 0 && now > endAt) continue;

      const entity = item.entity || { type: "custom" };
      const override = item.override || {};
      const badge = String(item.badge || "").trim();
      const order = Number(item.order ?? 0);

      // 3. 按类型解析实体
      if (entity.type === "software") {
        const sw = softwareList.find(s => (s.id === entity.id || s.slug === entity.id) && (s.status || "active") === "active");
        if (!sw) continue; // 找不到实体（下架/删除/草稿）直接跳过，不报错

        const screenshots = Array.isArray(sw.screenshots) ? sw.screenshots : [];
        const fallbackImg = sw.coverUrl || screenshots[0] || sw.iconUrl || "/preview-desktop-widgets.png";

        resolved.push({
          id: item.id,
          type: "software",
          entityId: sw.id || sw.slug,
          title: override.title || sw.name,
          subtitle: override.subtitle || sw.tagline || sw.description || "",
          image: override.image || fallbackImg,
          ctaText: override.ctaText || "立即下载",
          ctaHref: override.ctaHref || `/download/latest/${encodeURIComponent(sw.slug || sw.id)}`,
          secondaryHref: sw.landingUrl || `/software.html?slug=${encodeURIComponent(sw.slug || sw.id)}`,
          badge: badge || (sw.featured ? "编辑推荐" : ""),
          priceLabel: sw.priceLabel || "免费版",
          order,
          rawEntity: sw
        });
      } else if (entity.type === "article") {
        const art = articlesList.find(a => (a.id === entity.id || a.slug === entity.id) && a.status === "published");
        if (!art) continue;

        resolved.push({
          id: item.id,
          type: "article",
          entityId: art.id || art.slug,
          title: override.title || art.title,
          subtitle: override.subtitle || art.summary || "",
          image: override.image || art.coverUrl || "/logo.png",
          ctaText: override.ctaText || "阅读全文",
          ctaHref: override.ctaHref || `/article.html?slug=${encodeURIComponent(art.slug || art.id)}`,
          badge: badge || "精选教程",
          order,
          rawEntity: art
        });
      } else if (entity.type === "playlist") {
        // 歌单实体（后续阶段使用）
        const title = override.title || "精选歌单";
        if (!override.image && !entity.id) continue;
        resolved.push({
          id: item.id,
          type: "playlist",
          entityId: entity.id,
          title,
          subtitle: override.subtitle || "",
          image: override.image || "/logo.png",
          ctaText: override.ctaText || "播放歌单",
          ctaHref: override.ctaHref || `/music.html?playlist=${encodeURIComponent(entity.id)}`,
          badge: badge || "热门歌单",
          order
        });
      } else {
        // custom 自定义类型：全部取 override，image 与 ctaHref 必须存在
        if (!override.image || !override.ctaHref) continue;

        resolved.push({
          id: item.id,
          type: "custom",
          entityId: "",
          title: override.title || "推广推荐",
          subtitle: override.subtitle || "",
          image: override.image,
          ctaText: override.ctaText || "了解更多",
          ctaHref: override.ctaHref,
          badge: badge || "推广",
          order
        });
      }
    }

    // 4. 按 order 升序
    return resolved.sort((a, b) => a.order - b.order);
  }

  return { resolvePromotions };
});
