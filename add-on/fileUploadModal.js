const modal = document.getElementById("uploadModal");
const fileInput = document.getElementById("fileUpload");
const dropZone = document.getElementById("dropZone");
const fileList = document.getElementById("fileList");

// Function to show modal
function showModal() {
  modal.classList.add("show");
}

// Function to hide modal
function hideModal() {
  modal.classList.remove("show");
}

// Function to handle file selection
function handleFiles(files) {
  const fileListDiv = document.querySelector(".file-list");
  fileListDiv.innerHTML = "";
  fileList.style.display = "block";

  Array.from(files).forEach((file) => {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";

    const fileIcon = document.createElement("svg");
    fileIcon.className = "file-icon";
    fileIcon.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                `;

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-file";
    removeButton.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                `;
    removeButton.onclick = () => fileItem.remove();

    fileItem.appendChild(fileIcon);
    fileItem.appendChild(fileName);
    fileItem.appendChild(removeButton);
    fileListDiv.appendChild(fileItem);
  });
}

// Event listeners
dropZone.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#3b82f6";
  dropZone.style.backgroundColor = "#f8fafc";
};

dropZone.ondragleave = () => {
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
};

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#e5e7eb";
  dropZone.style.backgroundColor = "transparent";
  handleFiles(e.dataTransfer.files);
};

modal.onclick = (e) => {
  if (e.target === modal) hideModal();
};

// Show modal initially (remove this in production if you want to trigger it differently)
showModal();
