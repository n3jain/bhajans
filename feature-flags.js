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
  actions.innerHTML = '<button class="btn secondary" id="saveKirtanPlanBtn">Save plan</button><button class="btn secondary" id="shareKirtanPlanBtn">Share plan</button>';
  summary.parentNode.insertBefore(actions,summary);
  name.placeholder = "Oct_17-Neha-Kirtan";
});
