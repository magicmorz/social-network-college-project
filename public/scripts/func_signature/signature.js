// Get the canvas element and context
const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");
const signatureDataInput = document.getElementById("signatureData");
let drawing = false;

// Set default stroke styles for consistent line appearance
ctx.strokeStyle = "black";
ctx.lineWidth = 2;
ctx.lineCap = "round"; // Smooth line ends

// Update the hidden input with the canvas data as base64
function updateSignatureData() {
  const dataUrl = canvas.toDataURL("image/png"); // Convert canvas to base64 (PNG format)
  signatureDataInput.value = dataUrl; // Set the hidden input value
}

// Handle mousedown: Start drawing
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

// Handle mousemove: Draw lines
canvas.addEventListener("mousemove", (e) => {
  if (drawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

// Handle mouseup: Stop drawing and update signature
canvas.addEventListener("mouseup", () => {
  drawing = false;
  updateSignatureData(); // Update hidden input when drawing stops
});

// Handle mouseout: Stop drawing and update signature
canvas.addEventListener("mouseout", () => {
  drawing = false;
  updateSignatureData(); // Update hidden input when mouse leaves
});

// Touch events for mobile support
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  drawing = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (drawing) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  }
});

canvas.addEventListener("touchend", () => {
  drawing = false;
  updateSignatureData(); // Update hidden input when touch ends
});

// Clear canvas function
function clearCanvas(e) {
  e.preventDefault();
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  signatureDataInput.value = ""; // Clear the hidden input
}

// Validate signature on form submission
document.querySelector(".register_form").addEventListener("submit", (e) => {
  updateSignatureData(); // Ensure latest canvas data is captured
  if (!signatureDataInput.value || signatureDataInput.value === "") {
    e.preventDefault();
    alert("Please provide a signature.");
  }
});
