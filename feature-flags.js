(() => {
  const defaults = Object.freeze({
    multiUserAccounts: false,
    songOwnershipAndCopy: false,
    imageVoiceIngestion: false,
    kirtanBuilder: true,
    startKirtanMode: false
  });

  // Developer override for testing deployed code without enabling it for everyone.
  // Example: ?ff=multiUserAccounts,songOwnershipAndCopy
  const params = new URLSearchParams(location.search);
  const requested = new Set((params.get("ff") || "").split(",").filter(Boolean));

  window.BHAJAN_FEATURES = Object.freeze({
    ...defaults,
    ...Object.fromEntries(Object.keys(defaults).map(k => [k, defaults[k] || requested.has(k)]))
  });

  window.featureEnabled = name => window.BHAJAN_FEATURES[name] === true;
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!window.featureEnabled?.("kirtanBuilder")) return;
  const name = document.getElementById("kirtanName");
  const summary = document.getElementById("kirtanSummary");
  if (!name || !summary || document.getElementById("saveKirtanPlanBtn")) return;

  const row = name.closest(".row");
  const details = document.createElement("div");
  details.className = "row";
  details.innerHTML = '<div class="field"><label>Kirtan date</label><input id="kirtanDate" type="date"></div><div class="field"><label>Host name</label><input id="kirtanHost" placeholder="e.g. Neha"></div>';
  row.parentNode.insertBefore(details,row);

  const actions = document.createElement("div");
  actions.className = "small-actions";
  actions.innerHTML = '<button class="btn secondary" id="saveKirtanPlanBtn">Save plan</button><button class="btn secondary" id="shareKirtanPlanBtn">Share plan</button><select id="savedKirtans" style="max-width:280px"><option value="">Saved kirtans…</option></select>';
  summary.parentNode.insertBefore(actions,summary);
  name.placeholder = "Oct_17-Neha-Kirtan";
});

document.addEventListener("DOMContentLoaded", () => {
  if (!window.featureEnabled?.("kirtanBuilder")) return;
  const byId = id => document.getElementById(id);
  if (!byId("kirtanDate") || !byId("saveKirtanPlanBtn")) return;

  function suggestedKirtanName() {
    const raw = byId("kirtanDate").value;
    const d = raw ? new Date(raw + "T12:00:00") : new Date();
    const month = d.toLocaleString("en-US", {month:"short"});
    const day = String(d.getDate()).padStart(2,"0");
    const host = (byId("kirtanHost").value.trim() || "Host").replace(/\s+/g,"_");
    return month + "_" + day + "-" + host + "-Kirtan";
  }

  function savedKirtans() {
    try { return JSON.parse(localStorage.getItem("bhajanSavedKirtans")) || {}; }
    catch { return {}; }
  }

  function refreshSavedKirtans() {
    const saved = savedKirtans();
    const select = byId("savedKirtans");
    select.innerHTML = '<option value="">Saved kirtans…</option>' +
      Object.keys(saved).sort().map(n => '<option value="' + n.replace(/"/g,"&quot;") + '">' + n.replace(/</g,"&lt;") + '</option>').join("");
  }

  function normalizePlan() {
    if (!kirtanPlan) loadKirtanPlan();
    if (!kirtanPlan.date) kirtanPlan.date = new Date().toISOString().slice(0,10);
    if (kirtanPlan.host == null) kirtanPlan.host = "";
    if (!kirtanPlan.name || kirtanPlan.name === "Mata ki Chowki") kirtanPlan.name = suggestedKirtanName();

    const aarti = kirtanPlan.items?.find(x => x.locked && (x.title === "Mata Aarti" || x.title === "Durga Aarti"));
    if (aarti) {
      aarti.kind = "song";
      aarti.song_id = "ff839125-4b27-4ca9-ba48-f4ff4b2c0e90";
      aarti.title = "अम्बे तू है जगदम्बे काली";
      aarti.role = "durga-aarti";
      aarti.placement = "closing";
      aarti.minutes = Number(aarti.minutes) || 7;
      aarti.locked = true;
    }
    saveKirtanPlan();
  }

  function syncKirtanFields() {
    normalizePlan();
    byId("kirtanDate").value = kirtanPlan.date;
    byId("kirtanHost").value = kirtanPlan.host || "";
    byId("kirtanName").value = kirtanPlan.name || suggestedKirtanName();
    refreshSavedKirtans();
  }

  byId("kirtanDate").onchange = () => {
    normalizePlan();
    kirtanPlan.date = byId("kirtanDate").value;
    kirtanPlan.host = byId("kirtanHost").value.trim();
    kirtanPlan.name = suggestedKirtanName();
    byId("kirtanName").value = kirtanPlan.name;
    saveKirtanPlan();
  };

  byId("kirtanHost").oninput = () => {
    normalizePlan();
    kirtanPlan.host = byId("kirtanHost").value.trim();
    kirtanPlan.date = byId("kirtanDate").value;
    kirtanPlan.name = suggestedKirtanName();
    byId("kirtanName").value = kirtanPlan.name;
    saveKirtanPlan();
  };

  byId("saveKirtanPlanBtn").onclick = () => {
    normalizePlan();
    kirtanPlan.date = byId("kirtanDate").value;
    kirtanPlan.host = byId("kirtanHost").value.trim();
    kirtanPlan.name = byId("kirtanName").value.trim() || suggestedKirtanName();
    const saved = savedKirtans();
    saved[kirtanPlan.name] = JSON.parse(JSON.stringify(kirtanPlan));
    localStorage.setItem("bhajanSavedKirtans", JSON.stringify(saved));
    saveKirtanPlan();
    refreshSavedKirtans();
    byId("saveKirtanPlanBtn").textContent = "Saved";
    setTimeout(() => byId("saveKirtanPlanBtn").textContent = "Save plan", 1200);
  };

  byId("savedKirtans").onchange = () => {
    const p = savedKirtans()[byId("savedKirtans").value];
    if (!p) return;
    kirtanPlan = JSON.parse(JSON.stringify(p));
    saveKirtanPlan();
    syncKirtanFields();
    renderKirtan();
  };

  syncKirtanFields();
});


document.addEventListener("DOMContentLoaded", () => {
  if (!window.featureEnabled?.("kirtanBuilder")) return;
  const byId = id => document.getElementById(id);
  const share = byId("shareKirtanPlanBtn");
  if (!share) return;

  const slugBase = name => String(name || "kirtan")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,80) || "kirtan";

  const suffix = () => {
    const a = new Uint8Array(3);
    crypto.getRandomValues(a);
    return Array.from(a).map(x => x.toString(16).padStart(2,"0")).join("");
  };

  async function createSharedKirtan() {
    byId("saveKirtanPlanBtn").click();
    const name = byId("kirtanName").value.trim() || "Kirtan";
    const slug = slugBase(name) + "-" + suffix();
    const snapshot = JSON.parse(JSON.stringify(kirtanPlan));
    const { error } = await client.from("kirtan_plans").insert({slug,name,plan:snapshot});
    if (error) throw error;
    return location.origin + location.pathname + "#/kirtan/" + slug;
  }

  async function loadSharedKirtan() {
    const prefix = "#/kirtan/";
    if (!location.hash.startsWith(prefix)) return false;
    const slug = decodeURIComponent(location.hash.slice(prefix.length));
    if (!slug) return false;
    const { data, error } = await client.from("kirtan_plans").select("name,plan").eq("slug",slug).maybeSingle();
    if (error || !data?.plan || !Array.isArray(data.plan.items)) return false;
    kirtanPlan = data.plan;
    saveKirtanPlan();
    populateKirtanSongs();
    show("kirtan");
    if (byId("kirtanName")) byId("kirtanName").value = data.name || kirtanPlan.name || "Kirtan";
    renderKirtan();
    return true;
  }

  share.onclick = async () => {
    share.disabled = true;
    share.textContent = "Creating link…";
    try {
      const url = await createSharedKirtan();
      try { await navigator.clipboard.writeText(url); } catch {}
      const summary = byId("kirtanSummary");
      let box = byId("kirtanShareResult");
      if (!box) {
        box = document.createElement("div");
        box.id = "kirtanShareResult";
        box.className = "notice";
        box.style.wordBreak = "break-all";
        summary.parentNode.insertBefore(box, summary.nextSibling);
      }
      box.innerHTML = '<strong>Share this kirtan</strong><br><a href="' + url + '">' + url + '</a>';
      share.textContent = "Link copied";
    } catch (e) {
      share.textContent = "Share failed";
      byId("kirtanSummary").textContent = e.message || String(e);
    } finally {
      share.disabled = false;
      setTimeout(() => share.textContent = "Share plan", 1800);
    }
  };

  window.addEventListener("hashchange", () => { loadSharedKirtan(); });
  loadSharedKirtan();
});
