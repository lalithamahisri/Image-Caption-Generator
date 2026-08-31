window.selectedImageFile = null;

document.addEventListener('DOMContentLoaded', () => {
  initImageUpload();
});

function initImageUpload() {
  const uploadBox = document.getElementById('uploadBox');
  const imageInput = document.getElementById('imageInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const btnRemove = document.getElementById('btnRemove');
  const generateBtn = document.getElementById('generateBtn');
  const resultCard = document.getElementById('resultCard');
  const alertBox = document.getElementById('alertBox');

  if (!uploadBox || !imageInput) return;

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadBox.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadBox.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.remove('dragover');
    });
  });

  uploadBox.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleSelectedFile(files[0]);
    }
  });

  uploadBox.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      resetUploadState();
    });
  }

  function handleSelectedFile(file) {
    clearAlert();

    if (!ALLOWED_TYPES.includes(file.type)) {
      showAlert('Unsupported format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showAlert('Image too large. Maximum supported size is 10MB.');
      return;
    }

    window.selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;
      if (fileSizeDisplay) fileSizeDisplay.textContent = formatBytes(file.size);

      uploadBox.classList.add('hidden');
      previewContainer.classList.remove('hidden');

      if (generateBtn) generateBtn.disabled = false;
      if (resultCard) resultCard.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  function resetUploadState() {
    window.selectedImageFile = null;
    imageInput.value = '';
    previewImage.src = '';

    uploadBox.classList.remove('hidden');
    previewContainer.classList.add('hidden');

    if (generateBtn) generateBtn.disabled = true;
    if (resultCard) resultCard.classList.add('hidden');
    clearAlert();
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function showAlert(message) {
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.classList.remove('hidden');
    }
  }

  function clearAlert() {
    if (alertBox) {
      alertBox.textContent = '';
      alertBox.classList.add('hidden');
    }
  }

  window.resetUploadState = resetUploadState;
  window.showAlert = showAlert;
  window.clearAlert = clearAlert;
}
