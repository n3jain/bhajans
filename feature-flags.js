(() => {
  const defaults = Object.freeze({
    multiUserAccounts: false,
    songOwnershipAndCopy: false,
    imageVoiceIngestion: false,
    kirtanBuilder: false,
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
