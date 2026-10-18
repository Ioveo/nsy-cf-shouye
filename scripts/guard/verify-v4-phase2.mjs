import assert from "node:assert";
import "../../public/js/promotions.js";

const NsyPromotions = globalThis.NsyPromotions;
assert(NsyPromotions, "NsyPromotions should be defined on globalThis");

// 1. Unit Test for NsyPromotions logic
const mockCatalog = {
  software: [
    {
      id: "soft_1",
      slug: "fe-tools",
      name: "前端开发工具箱",
      tagline: "高效实用的开发者助手",
      status: "active",
      featured: true,
      iconUrl: "/icon.png",
      coverUrl: "/cover.png"
    },
    {
      id: "soft_2",
      slug: "draft-app",
      name: "草稿软件",
      status: "draft",
      featured: false
    }
  ],
  articles: [],
  music: []
};

const testPromos = [
  {
    id: "p1",
    placements: ["software"],
    entity: { type: "software", id: "soft_1" },
    status: "active",
    badge: "推荐",
    order: 10
  },
  {
    id: "p2",
    placements: ["software"],
    entity: { type: "software", id: "soft_2" }, // Draft software! Must be skipped!
    status: "active",
    badge: "草稿推荐",
    order: 5
  },
  {
    id: "p3",
    placements: ["portal"], // Not software! Must be filtered out!
    entity: { type: "software", id: "soft_1" },
    status: "active",
    order: 1
  },
  {
    id: "p4",
    placements: ["software"],
    entity: { type: "custom" },
    override: { title: "自定义活动", image: "/promo.jpg", ctaHref: "https://example.com" },
    status: "active",
    order: 20
  }
];

const resolved = NsyPromotions.resolvePromotions({
  promotionsConfig: { items: testPromos },
  catalog: mockCatalog,
  placement: "software"
});

assert.strictEqual(resolved.length, 2, "Only soft_1 (active) and custom promo should resolve");
assert.strictEqual(resolved[0].title, "前端开发工具箱", "First promo should be soft_1 (order 10 < 20)");
assert.strictEqual(resolved[1].title, "自定义活动", "Second promo should be custom");
console.log("PASS 1: Unit tests for promotions.js passed");

// 2. Integration Test with running local server
const BASE = "http://127.0.0.1:8788";

async function runApiTests() {
  console.log("Testing API on " + BASE);

  // Admin login
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" })
  });
  const { token } = await loginRes.json();
  assert(token, "Admin login should return a token");
  console.log("PASS 2: Admin login successful");

  const postAdmin = async (body) => {
    const res = await fetch(`${BASE}/api/admin/config`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return res.json();
  };

  // Save software-center config: gold accent, compact density, hidden stats
  const saveScRes = await postAdmin({
    action: "save",
    name: "software-center",
    data: {
      accent: "gold",
      hero: { mode: "promotions", showSearch: true, autoplaySeconds: 5 },
      stats: { show: false, items: [], hideBelow: 0 },
      newArrivals: { show: true, days: 30, max: 8 },
      ranking: { show: true, tabs: ["downloads"], size: 10 },
      density: "compact",
      pageSize: 12,
      announcement: { show: true, text: "V4升级测试公告", href: "https://nsyoo.com", tone: "info" }
    }
  });
  assert(saveScRes.success, "Failed to save software-center config");
  console.log("PASS 3: Saved software-center config with gold accent and compact density");

  // Verify public GET /api/config/software-center
  const getScRes = await fetch(`${BASE}/api/config/software-center`);
  const getScData = await getScRes.json();
  assert.strictEqual(getScData.accent, "gold", "accent should be gold");
  assert.strictEqual(getScData.density, "compact", "density should be compact");
  assert.strictEqual(getScData.stats.show, false, "stats.show should be false");
  assert.strictEqual(getScData.announcement.text, "V4升级测试公告", "announcement should match");
  console.log("PASS 4: Public GET /api/config/software-center returned expected values");

  // Get catalog software ID
  const catalogRes = await fetch(`${BASE}/api/catalog`);
  const catalog = await catalogRes.json();
  const targetSoft = catalog.software?.[0];
  assert(targetSoft, "Catalog should have at least one software item");

  // Save promotions config with targetSoft
  const savePromoRes = await postAdmin({
    action: "save",
    name: "promotions",
    data: {
      items: [
        {
          id: "promo_test_p2",
          placements: ["software"],
          entity: { type: "software", id: targetSoft.id },
          badge: "官方推荐",
          status: "active",
          order: 1
        }
      ]
    }
  });
  assert(savePromoRes.success, "Failed to save promotions config");
  console.log("PASS 5: Saved promotions config pointing to software " + targetSoft.name);

  // Verify public GET /api/config/promotions
  const getPromoRes = await fetch(`${BASE}/api/config/promotions`);
  const getPromoData = await getPromoRes.json();
  assert.strictEqual(getPromoData.items.length, 1);
  assert.strictEqual(getPromoData.items[0].id, "promo_test_p2");
  console.log("PASS 6: Public GET /api/config/promotions returned expected values");

  // Update software-center config a second time to ensure .prev.json exists
  const updateScRes = await postAdmin({
    action: "save",
    name: "software-center",
    data: {
      accent: "violet",
      hero: { mode: "promotions", showSearch: false, autoplaySeconds: 8 },
      stats: { show: false, items: [], hideBelow: 0 },
      newArrivals: { show: true, days: 30, max: 8 },
      ranking: { show: true, tabs: ["downloads"], size: 10 },
      density: "list",
      pageSize: 12,
      announcement: { show: true, text: "V4升级测试公告2", href: "https://nsyoo.com", tone: "warning" }
    }
  });
  assert(updateScRes.success, "Failed to update software-center config a second time");

  // Test rollback software-center config (should revert to gold accent from first save)
  const rollbackSc = await postAdmin({
    action: "rollback",
    name: "software-center"
  });
  assert(rollbackSc.success, "Rollback software-center should succeed: " + rollbackSc.msg);
  assert.strictEqual(rollbackSc.config.accent, "gold", "Rollback should restore gold accent from previous save");
  console.log("PASS 7: Successfully rolled back software-center config to previous version (gold)");

  // Reset to clean default config
  await postAdmin({
    action: "save",
    name: "software-center",
    data: {
      accent: "cyan",
      hero: { mode: "featured", showSearch: true, autoplaySeconds: 6 },
      stats: { show: true, items: ["software", "downloads", "monthlyUpdates", "platforms"], hideBelow: 0 },
      newArrivals: { show: true, days: 30, max: 8 },
      ranking: { show: true, tabs: ["downloads", "updated"], size: 10 },
      density: "comfortable",
      pageSize: 12,
      announcement: { show: false, text: "", href: "", tone: "info" }
    }
  });
  await postAdmin({
    action: "save",
    name: "promotions",
    data: { items: [] }
  });
  console.log("PASS 8: Restored default clean configs");
  console.log("\nALL PHASE 2 API & PROMOTION UNIT VERIFICATIONS PASSED!");
}

runApiTests().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
