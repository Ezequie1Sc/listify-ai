"use strict";

/* =========================================
   LISTIFY AI — FRONTEND
========================================= */

(() => {
  const API_ENDPOINT = "/api/generate";
  const REQUEST_TIMEOUT = 45000;

  let currentListing = null;
  let isGenerating = false;
  let toastTimeout = null;

  let form;
  let generateBtn;
  let regenerateBtn;
  let copyAllBtn;

  let productName;
  let productDetails;
  let charCount;

  let emptyState;
  let loadingState;
  let errorState;
  let generatedContent;

  let resultStatus;
  let errorMessage;

  let generatedTitle;
  let generatedDescription;
  let generatedHashtags;
  let generatedCTA;

  let toast;
  let toastMessage;

  /* =========================================
     INITIALIZATION
  ========================================= */

  function initializeApp() {
    form = document.getElementById("listingForm");
    generateBtn = document.getElementById("generateBtn");
    regenerateBtn = document.getElementById("regenerateBtn");
    copyAllBtn = document.getElementById("copyAllBtn");

    productName = document.getElementById("productName");
    productDetails = document.getElementById("productDetails");
    charCount = document.getElementById("charCount");

    emptyState = document.getElementById("emptyState");
    loadingState = document.getElementById("loadingState");
    errorState = document.getElementById("errorState");
    generatedContent = document.getElementById("generatedContent");

    resultStatus = document.getElementById("resultStatus");
    errorMessage = document.getElementById("errorMessage");

    generatedTitle = document.getElementById("generatedTitle");
    generatedDescription = document.getElementById(
      "generatedDescription"
    );
    generatedHashtags = document.getElementById(
      "generatedHashtags"
    );
    generatedCTA = document.getElementById("generatedCTA");

    toast = document.getElementById("toast");
    toastMessage = document.getElementById("toastMessage");

    const requiredIds = [
      "listingForm",
      "generateBtn",
      "regenerateBtn",
      "copyAllBtn",
      "productName",
      "productDetails",
      "productPrice",
      "category",
      "platform",
      "tone",
      "language",
      "charCount",
      "emptyState",
      "loadingState",
      "errorState",
      "generatedContent",
      "resultStatus",
      "errorMessage",
      "generatedTitle",
      "generatedDescription",
      "generatedHashtags",
      "generatedCTA",
      "toast",
      "toastMessage"
    ];

    const missingIds = requiredIds.filter(id => {
      return !document.getElementById(id);
    });

    if (missingIds.length > 0) {
      console.error(
        "Listify could not initialize. Missing HTML elements:",
        missingIds
      );
      return;
    }

    initializeAnimations();
    initializeForm();
    initializeCopyButtons();
    initializeNavigation();

    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
      currentYear.textContent = new Date().getFullYear();
    }

    resultStatus.setAttribute("role", "status");
    resultStatus.setAttribute("aria-live", "polite");

    updateCharacterCount();
    setLoading(false);
  }

  /* =========================================
     SCROLL ANIMATIONS
     Applies to elements with class "reveal".
  ========================================= */

  function initializeAnimations() {
    const elements = document.querySelectorAll(".reveal");

    if (!elements.length) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      elements.forEach(element => {
        element.classList.add("visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    elements.forEach(element => {
      observer.observe(element);
    });
  }

  /* =========================================
     FORM
  ========================================= */

  function initializeForm() {
    productDetails.addEventListener(
      "input",
      updateCharacterCount
    );

    form.addEventListener("submit", event => {
      event.preventDefault();
      void generateListing();
    });

    regenerateBtn.addEventListener("click", () => {
      void generateListing();
    });
  }

  function updateCharacterCount() {
    const length = productDetails.value.length;
    const maxLength = productDetails.maxLength;

    charCount.textContent =
      maxLength > 0
        ? `${length} / ${maxLength}`
        : String(length);
  }

  function getFormData() {
    return {
      productName: productName.value.trim(),
      category: document.getElementById("category").value,
      productDetails: productDetails.value.trim(),
      productPrice: document
        .getElementById("productPrice")
        .value.trim(),
      platform: document.getElementById("platform").value,
      tone: document.getElementById("tone").value,
      language: document.getElementById("language").value
    };
  }

  function validateForm(data) {
    if (!data.productName) {
      showToast("Please enter a product name.");
      productName.focus();
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

    if (!form.reportValidity()) return;

    const data = getFormData();

    if (!validateForm(data)) return;

    const controller = new AbortController();
    let timeoutId = null;

    setLoading(true);

    try {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      let result;

      try {
        result = await response.json();
      } catch (error) {
        if (controller.signal.aborted) {
          throw error;
        }

        throw new Error(
          response.ok
            ? "The server returned an invalid JSON response."
            : `The server could not complete the request (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          getServerErrorMessage(result, response.status)
        );
      }

      if (!result?.success || !result?.data) {
        throw new Error("The AI response was incomplete.");
      }

      const listing = normalizeListing(result.data);

      renderListing(listing);
      currentListing = listing;

      setStatus("Completed", "ready");
      showToast("Your listing is ready!");
    } catch (error) {
      console.error("Generation failed:", error);

      if (controller.signal.aborted) {
        showError(
          "The request took too long. Please try again."
        );
      } else {
        showError(
          error instanceof Error
            ? error.message
            : "Something unexpected happened."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  function getServerErrorMessage(result, status) {
    if (
      typeof result?.error === "string" &&
      result.error.trim()
    ) {
      return result.error;
    }

    if (
      typeof result?.error?.message === "string" &&
      result.error.message.trim()
    ) {
      return result.error.message;
    }

    return `Unable to generate your listing (HTTP ${status}).`;
  }

  function normalizeListing(listing) {
    const requiredTextFields = [
      "title",
      "description",
      "callToAction"
    ];

    const hasValidText = requiredTextFields.every(field => {
      return (
        typeof listing[field] === "string" &&
        listing[field].trim().length > 0
      );
    });

    const hasValidHashtags =
      Array.isArray(listing.hashtags) &&
      listing.hashtags.every(tag => {
        return typeof tag === "string";
      });

    if (!hasValidText || !hasValidHashtags) {
      throw new Error(
        "The AI returned an unexpected format. Please generate the listing again."
      );
    }

    return {
      title: listing.title.trim(),
      description: listing.description.trim(),
      callToAction: listing.callToAction.trim(),
      hashtags: listing.hashtags
        .map(tag => tag.trim())
        .filter(Boolean)
    };
  }

  /* =========================================
     UI STATES
  ========================================= */

  function setLoading(loading) {
    isGenerating = loading;

    generateBtn.disabled = loading;
    regenerateBtn.disabled = loading;
    copyAllBtn.disabled = loading;

    generateBtn.setAttribute("aria-busy", String(loading));

    if (loading) {
      emptyState.classList.add("hidden");
      generatedContent.classList.add("hidden");
      errorState.classList.add("hidden");
      loadingState.classList.remove("hidden");

      setStatus("Generating", "processing");

      generateBtn.innerHTML = `
        <svg
          class="icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style="animation: spin 0.9s linear infinite"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            opacity="0.25"
          ></circle>
          <path d="M12 3a9 9 0 0 1 9 9"></path>
        </svg>
        <span>Generating...</span>
      `;
    } else {
      loadingState.classList.add("hidden");

      generateBtn.innerHTML = `
        <svg class="icon" aria-hidden="true">
          <use href="#icon-spark"></use>
        </svg>
        <span>Generate listing</span>
        <svg class="icon" aria-hidden="true">
          <use href="#icon-arrow"></use>
        </svg>
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

    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");

    resultStatus.replaceChildren(
      dot,
      document.createTextNode(label)
    );
  }

  function showError(message) {
    emptyState.classList.add("hidden");
    generatedContent.classList.add("hidden");
    loadingState.classList.add("hidden");

    errorMessage.textContent = message;
    errorState.classList.remove("hidden");

    setStatus("Error", "failed");
  }

  /* =========================================
     RENDER GENERATED CONTENT
  ========================================= */

  function renderListing(listing) {
    generatedTitle.textContent = listing.title;
    generatedDescription.textContent = listing.description;
    generatedCTA.textContent = listing.callToAction;

    const fragment = document.createDocumentFragment();

    listing.hashtags.forEach(hashtag => {
      const tag = document.createElement("span");
      tag.textContent = hashtag;
      fragment.appendChild(tag);
    });

    generatedHashtags.replaceChildren(fragment);

    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");

    generatedContent.classList.remove("hidden");
  }

  /* =========================================
     COPY FUNCTIONALITY
  ========================================= */

  function initializeCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach(button => {
      button.addEventListener("click", async () => {
        if (isGenerating) return;

        const targetId = button.dataset.copy;
        const target = document.getElementById(targetId);

        if (!target) return;

        const text =
          targetId === "generatedHashtags"
            ? Array.from(target.querySelectorAll("span"))
                .map(tag => tag.textContent.trim())
                .filter(Boolean)
                .join(" ")
            : target.textContent.trim();

        if (!text) {
          showToast("There is no content to copy yet.");
          return;
        }

        try {
          await copyText(text);
          showToast("Copied to clipboard!");
        } catch {
          showToast(
            "Could not copy. Check clipboard permissions or select the text manually."
          );
        }
      });
    });

    copyAllBtn.addEventListener("click", async () => {
      if (!currentListing || isGenerating) return;

      const text = [
        currentListing.title,
        currentListing.description,
        currentListing.hashtags.join(" "),
        currentListing.callToAction
      ]
        .filter(Boolean)
        .join("\n\n");

      try {
        await copyText(text);
        showToast("Complete listing copied!");
      } catch {
        showToast(
          "Could not copy. Check clipboard permissions or select the text manually."
        );
      }
    });
  }

  async function copyText(text) {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error(
        "Clipboard access requires HTTPS or localhost."
      );
    }

    await navigator.clipboard.writeText(text);
  }

  /* =========================================
     TOAST
  ========================================= */

  function showToast(message) {
    clearTimeout(toastTimeout);

    toastMessage.textContent = message;
    toast.classList.add("visible");

    toastTimeout = setTimeout(() => {
      toast.classList.remove("visible");
    }, 4000);
  }

  /* =========================================
     NAVIGATION
  ========================================= */

  function initializeNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener("click", event => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        const target = document.getElementById(href.slice(1));

        if (!target) return;

        event.preventDefault();

        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  /* =========================================
     START
  ========================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeApp,
      { once: true }
    );
  } else {
    initializeApp();
  }
})();