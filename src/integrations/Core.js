// src/integrations/Core.js
// Offline stub for Base44 "Core" integration so Amplify can build.
// Provides the named exports the app expects.

export async function InvokeLLM(input = {}) {
  // Return a predictable shape so UI doesn't crash if it tries to render output.
  // Adjust fields if AIAllocation.jsx expects something different.
  return {
    ok: true,
    mode: "offline",
    input,
    output:
      "InvokeLLM is running in offline mode (no Base44 proxy / backend configured).",
    tokens_used: 0,
    model: "offline-stub",
  };
}

// Some pages may also import a default or Core object
export const Core = {
  init: async () => true,
  config: { mode: "offline" },
  InvokeLLM,
};

export default Core;
