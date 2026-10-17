import assert from "node:assert";

async function waitServer(url, maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error("Server not responding at " + url);
}

async function run() {
  const BASE = "http://127.0.0.1:8788";
  console.log("Waiting for server...");
  await waitServer(BASE + "/api/catalog");
  console.log("Server ready.");

  // 1. Login to admin
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" })
  });
  const { token } = await loginRes.json();
  assert(token, "Admin login failed");
  console.log("PASS 1: Admin login successful");

  const postAdmin = async (body) => {
    const res = await fetch(`${BASE}/api/admin/landing`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return res.json();
  };

  // 2. Get landing config
  const initial = await postAdmin({ action: "get" });
  assert(initial.success, "Failed to get landing config");
  console.log("PASS 2: Initial homeLanding is:", initial.homeLanding);

  // 3. Switch home to desktop
  const setDesktop = await postAdmin({ action: "setHome", homeLanding: "desktop" });
  assert(setDesktop.success && setDesktop.homeLanding === "desktop", "Failed to set homeLanding to desktop");
  console.log("PASS 3: Switched homeLanding to desktop");

  // Verify visiting "/" serves desktop page
  const homeRes = await fetch(BASE + "/");
  const homeText = await homeRes.text();
  assert(homeText.includes('data-landing-page="desktop"'), "Visiting / did not return desktop landing page");
  console.log("PASS 4: Visiting / correctly returns desktop landing page");

  // 4. Update title content for desktop landing
  const saveContent = await postAdmin({
    action: "saveContent",
    pageId: "desktop",
    content: { heroTitle: "智能桌面新体验" }
  });
  assert(saveContent.success, "Failed to save content for desktop");
  console.log("PASS 5: Saved heroTitle content for desktop");

  // Verify public GET /api/landing
  const pubLandingRes = await fetch(BASE + "/api/landing");
  const pubLanding = await pubLandingRes.json();
  assert(pubLanding.content?.desktop?.heroTitle === "智能桌面新体验", "Public landing API does not reflect updated content");
  console.log("PASS 6: Public /api/landing returned updated heroTitle");

  // 5. Test preview parameter /?landing=software
  const previewRes = await fetch(BASE + "/?landing=software");
  const previewText = await previewRes.text();
  assert(previewText.includes('data-landing-page="software"'), "Preview /?landing=software failed");
  console.log("PASS 7: Preview /?landing=software correctly served software center");

  // 6. Switch home back to portal
  const setPortal = await postAdmin({ action: "setHome", homeLanding: "portal" });
  assert(setPortal.success && setPortal.homeLanding === "portal", "Failed to restore homeLanding to portal");
  console.log("PASS 8: Restored homeLanding to portal");

  const portalRes = await fetch(BASE + "/");
  const portalText = await portalRes.text();
  assert(portalText.includes('data-landing-page="portal"'), "Visiting / did not return portal page");
  console.log("PASS 9: Visiting / correctly returns portal page");

  // Clean up content
  await postAdmin({
    action: "saveContent",
    pageId: "desktop",
    content: {}
  });
  console.log("PASS 10: Cleaned up test content");

  console.log("\nALL PHASE 2 VERIFICATIONS PASSED!");
}

run().catch(err => {
  console.error("FAILED:", err);
  process.exit(1);
});
