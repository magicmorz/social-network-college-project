// scripts/func_signature/signature.js
(function () {
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");
  const signatureDataInput = document.getElementById("signatureData");
  let drawing = false;

  // Set default stroke styles
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Update the hidden input with canvas data as base64
  function updateSignatureData() {
    const dataUrl = canvas.toDataURL("image/png");
    signatureDataInput.value = dataUrl;
    // console.log("Signature Data:", dataUrl); // Uncomment for debugging
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
    updateSignatureData();
  });

  // Handle mouseout: Stop drawing and update signature
  canvas.addEventListener("mouseout", () => {
    drawing = false;
    updateSignatureData();
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
    updateSignatureData();
  });
})();
