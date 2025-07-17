// Get the canvas element by its ID
const canvas = document.getElementById("signatureCanvas");
// Get the 2D rendering context for drawing operations
const ctx = canvas.getContext("2d");
// Boolean to track whether the user is actively drawing (mouse button held down)
let drawing = false;

// Set default stroke styles for consistent line appearance
ctx.strokeStyle = "black"; // Line color set to black
ctx.lineWidth = 2; // Line thickness set to 2 pixels for visibility

// Handle mousedown: Start drawing and begin a new path
canvas.addEventListener("mousedown", (e) => {
  drawing = true; // Indicate that drawing has started
  ctx.beginPath(); // Start a new path to avoid connecting to previous lines
  ctx.moveTo(e.offsetX, e.offsetY); // Move the drawing cursor to the mouse position
});

// Handle mouseup: Stop drawing
canvas.addEventListener("mouseup", () => {
  drawing = false; // Stop drawing when the mouse button is released
});

// Handle mousemove: Draw lines when the mouse moves and drawing is active
canvas.addEventListener("mousemove", (e) => {
  if (drawing) {
    // Only draw if the mouse button is held down
    ctx.lineTo(e.offsetX, e.offsetY); // Add a line to the current mouse position
    ctx.stroke(); // Render the line on the canvas
  }
});

// Handle mouseout: Stop drawing if the mouse leaves the canvas
canvas.addEventListener("mouseout", () => {
  drawing = false; // Stop drawing to prevent unintended lines when re-entering
});

// Function to clear the entire canvas
function clearCanvas(e) {
  e.preventDefault(); // Prevent default behavior (e.g., form submission)
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
}
