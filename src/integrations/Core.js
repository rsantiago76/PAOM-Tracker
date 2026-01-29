// src/integrations/Core.js
// Offline stub so Amplify can build.

export async function InvokeLLM({ prompt, response_json_schema } = {}) {
  // Return a predictable shape that AIAllocation.jsx expects:
  // { allocations: [...] }
  return {
    allocations: [],
    // optional debug fields so you can see it worked
    mode: "offline",
    prompt_preview: typeof prompt === "string" ? prompt.slice(0, 200) : "",
    schema: response_json_schema || null,
  };
}

export default { InvokeLLM };
