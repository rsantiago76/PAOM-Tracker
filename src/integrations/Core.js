// src/integrations/Core.js
// Minimal stub so Base44-generated pages can build without the Base44 runtime.
// Replace/expand later if you restore full Base44 backend wiring.

export const Core = {
  // Some Base44 templates expect an init() call
  init: async () => true,

  // Some templates reference a base client / config
  config: {
    mode: "offline",
  },
};

export default Core;
