document.addEventListener('DOMContentLoaded', () => {
  initCaptionModule();
});

function initCaptionModule() {
  const generateBtn = document.getElementById('generateBtn');
  const btnText = generateBtn ? generateBtn.querySelector('.btn-text') : null;
  const btnSpinner = document.getElementById('btnSpinner');
  const styleSelect = document.getElementById('styleSelect');
  const additionalContextInput = document.getElementById('additionalContext');
  const resultCard = document.getElementById('resultCard');
  const captionOutput = document.getElementById('captionOutput');
  const btnCopy = document.getElementById('btnCopy');
  const btnGenerateAgain = document.getElementById('btnGenerateAgain');

  // Render backend URL
  const API_BASE_URL = 'https://image-caption-generator-uj0o.onrender.com';

  if (!generateBtn) return;

  async function triggerCaptionGeneration() {
    const file = window.selectedImageFile;

    if (!file) {
      if (window.showAlert) {
        window.showAlert('Please select or upload an image first.');
      }
      return;
    }

    const style = styleSelect ? styleSelect.value : 'Social';
    const additionalContext = additionalContextInput
      ? additionalContextInput.value.trim()
      : '';

    setLoading(true);

    if (window.clearAlert) window.clearAlert();
    if (resultCard) resultCard.classList.add('hidden');

    try {
      const formData = new FormData();

      formData.append('image', file);
      formData.append('style', style);
      formData.append('additionalContext', additionalContext);

      const response = await fetch(`${API_BASE_URL}/api/caption`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          'Unable to generate caption. Please verify your AI model configuration.'
        );
      }

      if (captionOutput) {
        captionOutput.textContent = data.caption;
      }

      if (resultCard) {
        resultCard.classList.remove('hidden');

        resultCard.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }

    } catch (error) {
      console.error('[VisionCaption Error]:', error);

      if (window.showAlert) {
        window.showAlert(
          error.message ||
          'An error occurred during caption generation. Please try again.'
        );
      }

    } finally {
      setLoading(false);
    }
  }

  generateBtn.addEventListener('click', triggerCaptionGeneration);

  if (btnGenerateAgain) {
    btnGenerateAgain.addEventListener(
      'click',
      triggerCaptionGeneration
    );
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      const textToCopy = captionOutput
        ? captionOutput.textContent
        : '';

      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);

        if (window.showToast) {
          window.showToast('Caption copied to clipboard!');
        }

      } catch (err) {
        const temp = document.createElement('textarea');

        temp.value = textToCopy;

        document.body.appendChild(temp);

        temp.select();

        document.execCommand('copy');

        document.body.removeChild(temp);

        if (window.showToast) {
          window.showToast('Caption copied to clipboard!');
        }
      }
    });
  }

  function setLoading(isLoading) {
    if (isLoading) {
      generateBtn.disabled = true;

      if (btnGenerateAgain) {
        btnGenerateAgain.disabled = true;
      }

      if (btnText) {
        btnText.textContent = 'Generating caption...';
      }

      if (btnSpinner) {
        btnSpinner.classList.remove('hidden');
      }

    } else {
      generateBtn.disabled = false;

      if (btnGenerateAgain) {
        btnGenerateAgain.disabled = false;
      }

      if (btnText) {
        btnText.textContent = 'Generate Caption';
      }

      if (btnSpinner) {
        btnSpinner.classList.add('hidden');
      }
    }
  }
}