// Function to check if canvas is empty
function isCanvasEmpty(canvas) {
  const context = canvas.getContext("2d");
  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );
  return !pixelBuffer.some(color => color !== 0);
}

document.getElementById("registerForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form submission until validated

  // Reset previous errors
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });
  document.querySelectorAll(".register_form_input, #signatureCanvas").forEach((el) => {
    el.classList.remove("input-error");
  });
  document.querySelectorAll(".error-alert").forEach((el) => el.remove());

  let isValid = true;

  // Validate email
  const emailInput = document.querySelector('input[name="email"]');
  const email = emailInput.value.trim();
  if (!email) {
    document.getElementById("email-error").textContent = "Email is required";
    document.getElementById("email-error").style.display = "block";
    emailInput.classList.add("input-error");
    isValid = false;
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    document.getElementById("email-error").textContent = "Please enter a valid email";
    document.getElementById("email-error").style.display = "block";
    emailInput.classList.add("input-error");
    isValid = false;
  }

  // Validate password
  const passwordInput = document.querySelector('input[name="password"]');
  const password = passwordInput.value;
  if (!password) {
    document.getElementById("password-error").textContent = "Password is required";
    document.getElementById("password-error").style.display = "block";
    passwordInput.classList.add("input-error");
    isValid = false;
  } else if (password.length < 6) {
    document.getElementById("password-error").textContent = "Password must be at least 6 characters long";
    document.getElementById("password-error").style.display = "block";
    passwordInput.classList.add("input-error");
    isValid = false;
  }

  // Validate username
  const usernameInput = document.querySelector('input[name="username"]');
  const username = usernameInput.value.trim();
  if (!username) {
    document.getElementById("username-error").textContent = "Username is required";
    document.getElementById("username-error").style.display = "block";
    usernameInput.classList.add("input-error");
    isValid = false;
  } else if (username.length < 3 || username.length > 30) {
    document.getElementById("username-error").textContent = "Username must be 3-30 characters long";
    document.getElementById("username-error").style.display = "block";
    usernameInput.classList.add("input-error");
    isValid = false;
  }

  // Validate country
  const countryInput = document.querySelector('select[name="country"]');
  const country = countryInput.value;
  if (!country) {
    document.getElementById("country-error").textContent = "Please select a country";
    document.getElementById("country-error").style.display = "block";
    countryInput.classList.add("input-error");
    isValid = false;
  }

  // Validate signature
  const signatureInput = document.querySelector("#signatureData");
  const signature = signatureInput.value;
  const signatureCanvas = document.getElementById("signatureCanvas");
  if (!signature || !/^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/.test(signature) || isCanvasEmpty(signatureCanvas)) {
    document.getElementById("signature-error").textContent = "Please provide a valid signature";
    document.getElementById("signature-error").style.display = "block";
    signatureCanvas.classList.add("input-error");
    isValid = false;
  }

  // If valid, submit the form
  if (isValid) {
    this.submit();
  } else {
    // Show a general error alert
    const alert = document.createElement("div");
    alert.className = "error-alert";
    alert.innerHTML = `
      <p>Please fix the errors in the form.</p>
      <button type="button" class="error-alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    this.prepend(alert);
    setTimeout(() => {
      alert.classList.add("fade-out");
      setTimeout(() => alert.remove(), 500);
    }, 3000); // Auto-dismiss after 3 seconds
  }
});

function clearCanvas(event) {
  event.preventDefault();
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("signatureData").value = "";
  canvas.classList.remove("input-error");
  document.getElementById("signature-error").textContent = "";
  document.getElementById("signature-error").style.display = "none";
}
