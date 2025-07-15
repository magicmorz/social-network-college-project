const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => (drawing = true));
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mousemove", (e) => {
  if (drawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});
canvas.addEventListener("mouseout", () => (drawing = false));

// Start with a new path when drawing begins
canvas.addEventListener("mousedown", () => {
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);
});

// Clear canvas button (optional, you can add a button in HTML to trigger this)
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
