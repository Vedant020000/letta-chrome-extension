/* Onboarding Flow for Letta Chrome Extension */

import { LettaAPIService } from "./services/letta-api";
import { saveSettings, getSettings } from "./utils/storage";
import {
  AGENT_PREFIX,
  DEFAULT_MEMORY_BLOCKS,
  DEFAULT_ENABLED_BLOCKS,
  AGENT_SYSTEM_PROMPT,
  DEFAULT_MODEL,
  DEFAULT_EMBEDDING_MODEL,
} from "./constants";

// State
let _currentStep = 1;
let apiKey = "";

// Elements - with runtime validation
function getRequiredElement<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id) as T | null;
  if (!el) {
    console.error(`[Letta Onboarding] Required element not found: #${id}`);
  }
  return el;
}

const steps = {
  step1: getRequiredElement<HTMLElement>("step1"),
  step2: getRequiredElement<HTMLElement>("step2"),
  step3: getRequiredElement<HTMLElement>("step3"),
  step4: getRequiredElement<HTMLElement>("step4"),
};

const buttons = {
  start: getRequiredElement<HTMLButtonElement>("startBtn"),
  back1: getRequiredElement<HTMLButtonElement>("back1Btn"),
  validate: getRequiredElement<HTMLButtonElement>("validateBtn"),
  back2: getRequiredElement<HTMLButtonElement>("back2Btn"),
  create: getRequiredElement<HTMLButtonElement>("createBtn"),
  settings: getRequiredElement<HTMLButtonElement>("settingsBtn"),
};

const inputs = {
  apiKey: getRequiredElement<HTMLInputElement>("apiKey"),
};

const errors = {
  apiKey: getRequiredElement<HTMLElement>("apiKeyError"),
  create: getRequiredElement<HTMLElement>("createError"),
};

const dots = document.querySelectorAll(".dot");

// Validate all critical elements exist
function validateElements(): boolean {
  const criticalElements = [
    steps.step1, steps.step2, steps.step3, steps.step4,
    buttons.start, buttons.validate, buttons.create,
    inputs.apiKey, errors.apiKey, errors.create
  ];
  
  const missing = criticalElements.filter(el => !el);
  if (missing.length > 0 || dots.length === 0) {
    console.error("[Letta Onboarding] Critical elements missing, cannot initialize");
    return false;
  }
  return true;
}

// Check if already set up
async function checkExistingSetup() {
  const settings = await getSettings();
  if (settings.apiKey && settings.agentId) {
    // Already set up, redirect to popup
    window.location.href = "popup.html";
  }
}

// Navigate to step
function goToStep(step: number) {
  // Hide all steps
  Object.values(steps).forEach(s => s?.classList.add("hidden"));
  
  // Show target step
  const targetStep = steps[`step${step}` as keyof typeof steps];
  if (targetStep) {
    targetStep.classList.remove("hidden");
  }
  
  // Update dots
  dots.forEach((dot, index) => {
    dot.classList.remove("active", "completed");
    if (index + 1 < step) {
      dot.classList.add("completed");
    } else if (index + 1 === step) {
      dot.classList.add("active");
    }
  });
  
  _currentStep = step;
}

// Show error
function showError(element: HTMLElement, message: string) {
  element.textContent = message;
  element.classList.remove("hidden");
}

// Hide error
function hideError(element: HTMLElement) {
  element.classList.add("hidden");
}

// Set button loading state
function setButtonLoading(btn: HTMLButtonElement, loading: boolean) {
  const text = btn.querySelector(".btn-text") as HTMLElement;
  const spinner = btn.querySelector(".btn-spinner") as HTMLElement;
  
  if (loading) {
    btn.disabled = true;
    if (text) text.style.display = "none";
    if (spinner) spinner.classList.remove("hidden");
  } else {
    btn.disabled = false;
    if (text) text.style.display = "";
    if (spinner) spinner.classList.add("hidden");
  }
}

// Validate API key
async function validateApiKey() {
  if (!inputs.apiKey || !errors.apiKey || !buttons.validate) return;
  
  const key = inputs.apiKey.value.trim();
  
  if (!key) {
    showError(errors.apiKey, "Please enter your API key");
    return;
  }
  
  hideError(errors.apiKey);
  setButtonLoading(buttons.validate, true);
  
  try {
    const api = new LettaAPIService(key);
    const valid = await api.validateConnection();
    
    if (valid) {
      apiKey = key;
      // Persist API key immediately so it survives page reloads
      await saveSettings({ apiKey: key });
      goToStep(3);
    } else {
      showError(errors.apiKey, "Invalid API key. Please check and try again.");
    }
  } catch (error) {
    console.error("[Letta Onboarding] API validation error:", error);
    
    // Provide more specific error messages
    const errMsg = (error as Error).message || "";
    if (errMsg.includes("401") || errMsg.includes("403")) {
      showError(errors.apiKey, "Invalid API key. Please check and try again.");
    } else if (errMsg.includes("network") || errMsg.includes("fetch")) {
      showError(errors.apiKey, "Network error. Please check your internet connection.");
    } else {
      showError(errors.apiKey, "Connection failed. Please try again.");
    }
  }
  
  setButtonLoading(buttons.validate, false);
}

// Create agent
async function createAgent() {
  if (!errors.create || !buttons.create) return;
  
  hideError(errors.create);
  setButtonLoading(buttons.create, true);
  
  try {
    const api = new LettaAPIService(apiKey);
    
    const agent = await api.createAgent({
      name: `${AGENT_PREFIX}${Date.now()}`,
      model: DEFAULT_MODEL,
      embedding: DEFAULT_EMBEDDING_MODEL,
      memoryBlocks: DEFAULT_MEMORY_BLOCKS,
      systemPrompt: AGENT_SYSTEM_PROMPT,
    });
    
    if (agent.id) {
      // Save settings - wrap in try/catch to handle save failures
      try {
        await saveSettings({
          apiKey,
          agentId: agent.id,
          agentName: agent.name,
          captureTargets: ["chatgpt"],
          autoInject: true,
          enabledBlocks: DEFAULT_ENABLED_BLOCKS,
        });
        
        // Mark onboarding as complete
        await chrome.storage.local.set({ onboardingComplete: true });
      } catch (saveError) {
        console.error("[Letta Onboarding] Failed to save settings after agent creation:", saveError);
        // Agent was created but settings failed - inform user
        showError(errors.create, "Agent created but failed to save settings. Please try again or contact support.");
        setButtonLoading(buttons.create, false);
        return;
      }
      
      goToStep(4);
    } else {
      showError(errors.create, "Failed to create agent. Please try again.");
    }
  } catch (error) {
    console.error("[Letta Onboarding] Agent creation error:", error);
    showError(errors.create, "Failed to create agent. Please try again.");
  }
  
  setButtonLoading(buttons.create, false);
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Validate all required elements exist
  if (!validateElements()) {
    console.error("[Letta Onboarding] Initialization failed - required elements missing");
    return;
  }
  
  // Check existing setup
  await checkExistingSetup();
  
  // Step 1: Get Started
  buttons.start?.addEventListener("click", () => goToStep(2));
  
  // Step 2: API Key
  buttons.back1?.addEventListener("click", () => goToStep(1));
  buttons.validate?.addEventListener("click", validateApiKey);
  inputs.apiKey?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validateApiKey();
  });
  
  // Step 3: Create Agent
  buttons.back2?.addEventListener("click", () => goToStep(2));
  buttons.create?.addEventListener("click", createAgent);
  
  // Step 4: Success
  buttons.settings?.addEventListener("click", () => {
    window.location.href = "popup.html";
  });
});
