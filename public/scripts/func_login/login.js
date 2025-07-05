document.addEventListener("DOMContentLoaded", () => {
  /* ---Elements --- */
  const form      = document.querySelector(".login-form");
  const userInput = /** @type {HTMLInputElement} */(document.querySelectorAll(".form-input")[0]);
  const passInput = /** @type {HTMLInputElement} */(document.querySelectorAll(".form-input")[1]);
  const loginBtn  = /** @type {HTMLButtonElement} */(document.querySelector(".login-button"));
  const errorDiv  = document.getElementById("error");
  const toggleBtn = document.querySelector(".password-toggle");

  /* --- Test Accounts --- */
  const VALID_IDF = ["tester","test@gmail.com","0541234567"] // user valid for demo
  const VALID_PASS = "123456" // password valid for demo

  /* --- Input Valid Category --- */
  const isEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone    = (v) => /^\d{9,15}$/.test(v);
  const isUsername = (v) => v.length >= 6;               // min 6 chars
  const isValidUser = (v) => isUsername(v) || isEmail(v) || isPhone(v);
  const isValidPass = (v) => v.length >= 6 && v.length <= 18;

  function toggleLoginState() {
    loginBtn.disabled = !(isValidUser(userInput.value.trim()) &&
                          isValidPass(passInput.value.trim()));
                          
  }

  /* --- Input Event--- */
  ["input", "blur"].forEach(ev => {
    userInput.addEventListener(ev, () => { errorDiv.textContent = ""; toggleLoginState(); });
    passInput.addEventListener(ev, () => { errorDiv.textContent = ""; toggleLoginState(); });
  });

  /* --- Defualt Hiding Toggle Show/Hide */
    passInput.addEventListener("input",()=>{
    errorDiv.textContent =""
    toggleLoginState()


  if(passInput.value.trim().length>0){
    toggleBtn.style.display = "inline";
    } else{
    toggleBtn.style.display = "none"
    toggleBtn.style.textContent = "Show"
    passInput.type="password"
  }})
  

  /* --- Show / Hide Password --- */
  toggleBtn.addEventListener("click", () => {
    const hidden = passInput.type === "password";
    passInput.type = hidden ? "text" : "password";
    toggleBtn.textContent = hidden ? "Hide" : "Show";
  });

  /* --- Submit --- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    const userOK=VALID_IDF.includes(user);
    const passOK=(pass===VALID_PASS);

    if (!isValidUser(user)) {
      errorDiv.textContent = "Username must be ≥ 6 chars, valid email, or phone.";
      return;
    }
    if (!isValidPass(pass)) {
      errorDiv.textContent = "Password must be 6–18 characters.";
      return;
    }

    /* Checking Validation - Login */
    if (userOK && passOK) {
      errorDiv.textContent = "";
      window.location.href = "../feed_screen/feed.html";
    } else {
      errorDiv.innerHTML = `Sorry, your password was incorrect.<br>Please double-check your password.`;
    }
  });

  /* staring point - toggle disabled */
  toggleLoginState();
});
