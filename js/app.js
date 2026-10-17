"use strict";

/* =========================================
   LISTIFY AI — FRONTEND
========================================= */

const API_ENDPOINT = "/api/generate";

const form = document.getElementById("listingForm");
const generateBtn = document.getElementById("generateBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyAllBtn = document.getElementById("copyAllBtn");

const productDetails = document.getElementById("productDetails");
const charCount = document.getElementById("charCount");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const generatedContent = document.getElementById("generatedContent");

const resultStatus = document.getElementById("resultStatus");
const errorMessage = document.getElementById("errorMessage");

const generatedTitle = document.getElementById("generatedTitle");
const generatedDescription = document.getElementById("generatedDescription");
const generatedHashtags = document.getElementById("generatedHashtags");
const generatedCTA = document.getElementById("generatedCTA");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let currentListing = null;
let isGenerating = false;
let toastTimeout = null;

/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeAnimations();
  initializeForm();
  initializeCopyButtons();
  initializeNavigation();

  document.getElementById("currentYear").textContent =
    new Date().getFullYear();

  updateCharacterCount();
});

/* =========================================
   SCROLL ANIMATIONS
========================================= */

function initializeAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    elements.forEach(element => {
      element.classList.add("visible");
    });

    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  elements.forEach(element => observer.observe(element));
}

/* =========================================
   FORM
========================================= */

function initializeForm() {
  productDetails.addEventListener("input", updateCharacterCount);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    await generateListing();
  });

  regenerateBtn.addEventListener("click", async () => {
    await generateListing();
  });
}

function updateCharacterCount() {
  const length = productDetails.value.length;

  charCount.textContent = `${length} / 1200`;
}

function getFormData() {
  return {
    productName: document.getElementById("productName").value.trim(),
    category: document.getElementById("category").value,
    productDetails: productDetails.value.trim(),
    productPrice: document.getElementById("productPrice").value.trim(),
    platform: document.getElementById("platform").value,
    tone: document.getElementById("tone").value,
    language: document.getElementById("language").value
  };
}

function validateForm(data) {
  if (!data.productName) {
    showToast("Please enter a product name.");
    document.getElementById("productName").focus();
    return false;
  }

  if (!data.productDetails) {
    showToast("Please describe your product.");
    productDetails.focus();
    return false;
  }

  return true;
}

/* =========================================
   API REQUEST
========================================= */

async function generateListing() {
  if (isGenerating) return;

  const data = getFormData();

  if (!validateForm(data)) return;

  setLoading(true);

  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000);

    let response;

    try {
      response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error || "Unable to generate your listing."
      );
    }

    if (!result.success || !result.data) {
      throw new Error(
        "The AI response was incomplete."
      );
    }

    currentListing = result.data;

    renderListing(currentListing);
    setStatus("Completed", "ready");

    showToast("Your listing is ready!");

  } catch (error) {
    console.error("Generation failed:", error);

    if (error.name === "AbortError") {
      showError(
        "The request took too long. Please try again."
      );
    } else {
      showError(
        error.message || "Something unexpected happened."
      );
    }
  } finally {
    setLoading(false);
  }
}

/* =========================================
   UI STATES
========================================= */

function setLoading(loading) {
  isGenerating = loading;

  generateBtn.disabled = loading;
  regenerateBtn.disabled = loading;

  if (loading) {
    emptyState.classList.add("hidden");
    generatedContent.classList.add("hidden");
    errorState.classList.add("hidden");

    loadingState.classList.remove("hidden");

    setStatus("Generating", "processing");

    generateBtn.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Generating...</span>
    `;

  } else {
    loadingState.classList.add("hidden");

    generateBtn.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>Generate listing</span>
      <i class="fa-solid fa-arrow-right"></i>
    `;
  }
}

function setStatus(label, type) {
  resultStatus.className = "result-status";

  if (type === "processing") {
    resultStatus.classList.add("processing");
  }

  if (type === "failed") {
    resultStatus.classList.add("failed");
  }

  resultStatus.replaceChildren();

  const dot = document.createElement("span");
  resultStatus.append(dot, document.createTextNode(label));
}

function showError(message) {
  emptyState.classList.add("hidden");
  generatedContent.classList.add("hidden");
  loadingState.classList.add("hidden");

  errorState.classList.remove("hidden");
  errorMessage.textContent = message;

  setStatus("Error", "failed");
}

/* =========================================
   RENDER GENERATED CONTENT
========================================= */

function renderListing(listing) {
  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");

  generatedContent.classList.remove("hidden");

  generatedTitle.textContent = listing.title;
  generatedDescription.textContent = listing.description;
  generatedCTA.textContent = listing.callToAction;

  generatedHashtags.replaceChildren();

  listing.hashtags.forEach(hashtag => {
    const tag = document.createElement("span");
    tag.textContent = hashtag;
    generatedHashtags.appendChild(tag);
  });
}

/* =========================================
   COPY FUNCTIONALITY
========================================= */

function initializeCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const targetId = button.dataset.copy;
      const target = document.getElementById(targetId);

      if (!target) return;

      try {
        await copyText(target.innerText.trim());
        showToast("Copied to clipboard!");
      } catch {
        showToast("Could not copy the text.");
      }
    });
  });

  copyAllBtn.addEventListener("click", async () => {
    if (!currentListing) return;

    const text = [
      currentListing.title,
      "",
      currentListing.description,
      "",
      currentListing.hashtags.join(" "),
      "",
      currentListing.callToAction
    ].join("\n");

    try {
      await copyText(text);
      showToast("Complete listing copied!");
    } catch {
      showToast("Could not copy the listing.");
    }
  });
}

async function copyText(text) {
  if (!navigator.clipboard || !window.isSecureContext) {
    throw new Error("Clipboard access requires HTTPS or localhost.");
  }

  await navigator.clipboard.writeText(text);
}

/* =========================================
   TOAST
========================================= */

function showToast(message) {
  toastMessage.textContent = message;

  toast.classList.add("visible");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}

/* =========================================
   NAVIGATION
========================================= */

function initializeNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth",
        block: "start"
      });
    });
  });
}