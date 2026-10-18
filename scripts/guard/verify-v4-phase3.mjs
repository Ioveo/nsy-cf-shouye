import assert from "node:assert";

const BASE = "http://127.0.0.1:8788";

async function runPhase3Tests() {
  console.log("=== Phase 3 Article Taxonomy Acceptance Verification ===");

  // 1. Admin login
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" })
  });
  const { token } = await loginRes.json();
  assert(token, "Admin login failed");
  console.log("PASS 1: Admin login successful");

  const postAdmin = async (endpoint, body) => {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return res.json();
  };

  // 2. Save 3 categories into article-taxonomy with 3 different layouts (grid, list, docs)
  const categoriesData = [
    {
      slug: "p3-grid",
      name: "网格动态",
      description: "版本发布与产品重大更新资讯",
      icon: "sparkles",
      color: "#3B82F6",
      layout: "grid",
      order: 10,
      showInNav: true
    },
    {
      slug: "p3-list",
      name: "列表教程",
      description: "手把手实战图文操作教学",
      icon: "book-open",
      color: "#06B6D4",
      layout: "list",
      order: 20,
      showInNav: true
    },
    {
      slug: "p3-docs",
      name: "手册指南",
      description: "深度技术与完整参考手册",
      icon: "file-text",
      color: "#8B5CF6",
      layout: "docs",
      order: 30,
      showInNav: true
    }
  ];

  const saveTaxRes = await postAdmin("/api/admin/config", {
    action: "save",
    name: "article-taxonomy",
    data: { categories: categoriesData }
  });
  assert(saveTaxRes.success, "Failed to save article-taxonomy config");
  console.log("PASS 2: Saved 3 categories with grid, list, and docs layouts");

  // Verify public GET /api/config/article-taxonomy
  const getTaxRes = await fetch(`${BASE}/api/config/article-taxonomy`);
  const getTaxData = await getTaxRes.json();
  assert.strictEqual(getTaxData.categories.length, 3, "Expected 3 categories");
  assert.strictEqual(getTaxData.categories[0].layout, "grid");
  assert.strictEqual(getTaxData.categories[1].layout, "list");
  assert.strictEqual(getTaxData.categories[2].layout, "docs");
  console.log("PASS 3: Public GET /api/config/article-taxonomy returned 3 configured categories");

  // 3. Create 3 test articles linking to 'desktop' software:
  // Article 1 uses category slug 'p3-grid'
  const art1 = await postAdmin("/api/admin/articles", {
    title: "天才猫桌面 2.0 震撼发布：灵动架构与新特性概览",
    slug: "desktop-v2-release",
    summary: "全面升级的灵动抽屉收纳与全局快捷检索系统。",
    content: "## 全新架构\n\n天才猫桌面 2.0 带来多项突破性功能，包括灵动抽屉、无损搬家与离线 OCR。",
    category: "p3-grid",
    tags: ["版本动态", "桌面", "新品"],
    status: "published",
    softwareIds: ["desktop"]
  });
  assert(art1.success, "Failed to save article 1: " + JSON.stringify(art1));

  // Article 2 uses legacy Chinese category name '列表教程' (to test fallback matching by name!)
  const art2 = await postAdmin("/api/admin/articles", {
    title: "5分钟上手指南：如何利用抽屉提高工作效率",
    slug: "desktop-quickstart",
    summary: "整理凌乱桌面，极速归档常用工具。",
    content: "## 开始使用\n\n按 Alt+Space 呼出抽屉收纳盒，拖拽文件即可归类收纳。",
    category: "列表教程", // Legacy Chinese name!
    tags: ["教程", "效率", "抽屉"],
    status: "published",
    softwareIds: ["desktop"]
  });
  assert(art2.success, "Failed to save article 2: " + JSON.stringify(art2));

  // Article 3 uses category slug 'p3-docs'
  const art3 = await postAdmin("/api/admin/articles", {
    title: "桌面 2.0 核心快捷键与高级操作手册",
    slug: "desktop-shortcuts-manual",
    summary: "全面梳理天才猫桌面的所有快捷键与手势操作。",
    content: "## 基础快捷键\n\n- 打开主界面：Alt + D\n- 快速搜索：Alt + Space\n- 临时置顶：Ctrl + Pin",
    category: "p3-docs",
    tags: ["手册", "快捷键"],
    status: "published",
    sortOrder: 1,
    softwareIds: ["desktop"]
  });
  assert(art3.success, "Failed to save article 3: " + JSON.stringify(art3));
  console.log("PASS 4: Created 3 published test articles linking to desktop software");

  // 4. Verify catalog now contains articles and matches correctly
  const catRes = await fetch(`${BASE}/api/catalog`);
  const catalog = await catRes.json();
  const arts = catalog.articles || [];
  assert(arts.length >= 3, `Expected at least 3 articles in catalog, got ${arts.length}`);

  const a1 = arts.find(a => a.slug === "desktop-v2-release");
  const a2 = arts.find(a => a.slug === "desktop-quickstart");
  const a3 = arts.find(a => a.slug === "desktop-shortcuts-manual");
  assert(a1 && a2 && a3, "All 3 articles must exist in catalog");
  assert(a2.category === "列表教程", "Article 2 preserved legacy Chinese category name");
  console.log("PASS 5: Catalog verified with legacy Chinese category name intact");

  // 5. Test rollback functionality of article-taxonomy
  // Update taxonomy a second time
  await postAdmin("/api/admin/config", {
    action: "save",
    name: "article-taxonomy",
    data: {
      categories: [
        { slug: "temp", name: "临时", icon: "zap", color: "#EF4444", layout: "grid", order: 1, showInNav: true }
      ]
    }
  });
  const rbRes = await postAdmin("/api/admin/config", {
    action: "rollback",
    name: "article-taxonomy"
  });
  assert(rbRes.success, "Rollback article-taxonomy should succeed");
  assert.strictEqual(rbRes.config.categories.length, 3, "Rollback should restore 3 categories");
  console.log("PASS 6: Rollback article-taxonomy verified");

  console.log("\nALL PHASE 3 API & TAXONOMY TESTS PASSED!");
}

runPhase3Tests().catch(err => {
  console.error("Phase 3 verification failed:", err);
  process.exit(1);
});
