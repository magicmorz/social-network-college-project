/*  feed_create_popup.js  ⟨full file⟩
    ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── constants ───────────────────────────────────────────── */
  const USERNAME = 'the_miichael';
  const USER_PIC = './user/user_profile_picture.jpg';

  /* SVG path for the “empty” heart */
  const HEART_PATH =
    'M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z';

  /* ── element cache ───────────────────────────────────────── */
  const btnCreate  = document.getElementById('createBtn');
  const modal      = document.getElementById('uploadModal');
  const backdrop   = modal.querySelector('.ig-modal__backdrop');
  const btnClose   = document.getElementById('uploadClose');

  const stepPick   = modal.querySelector('[data-step="0"]');
  const stepCrop   = modal.querySelector('[data-step="1"]');
  const inputFile  = document.getElementById('fileInput');

  const cropZone   = document.getElementById('cropCanvas');
  const btnNext    = document.getElementById('cropNext');   // becomes “Share”
  const btnBack    = document.getElementById('cropBack');

  const feed       = document.querySelector('.posts-container');  // feed wrapper
  const LS_KEY = 'mockgram.posts'; // New persistence

  /* ── runtime handles ─────────────────────────────────────── */
  let previewURL   = null;
  let pickedFile   = null;
  let captionField = null;

  function savePostToLS(obj){
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  arr.unshift(obj);                          // newest first
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function loadPostsFromLS(){
  const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  arr.forEach(o => injectPost(o, /*fromLS*/ true));
}

  /* ── helpers ─────────────────────────────────────────────── */
  const openModal  = () => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    resetToStep0();                       // always start clean
  };

  const showStep = pickFirst => {
    stepPick.style.display = pickFirst ? ''  : 'none';
    stepCrop.style.display = pickFirst ? 'none' : '';
  };

  /* creat­e (lazy) caption textarea */
  const ensureCaption = () => {
    if (captionField) return;
    captionField = document.createElement('textarea');
    captionField.className   = 'ig-caption';
    captionField.placeholder = 'Write a caption…';
    captionField.rows        = 2;
    captionField.style.cssText = `
        width:100%;padding:.75rem;border-radius:12px;
        border:0;outline:none;background:var(--bg);color:var(--text);resize:none;
    `;
    stepCrop.appendChild(captionField);
  };

  /* revert modal to picker state */
  function resetToStep0 () {
    if (previewURL) { URL.revokeObjectURL(previewURL); previewURL = null; }
    cropZone.innerHTML = '';
    inputFile.value    = '';
    pickedFile         = null;
    if (captionField)  captionField.value = '';
    btnNext.textContent = 'Next';
    showStep(true);
  }

  /* build & prepend post card -------------------------------- */
  function injectPost(dataObj={}, fromLS=false){

  /* when called after share-btn, build dataObj */
  if(!fromLS){
    dataObj = {
      img   : previewURL,
      text  : captionField.value.trim(),
      time  : 'Now',
      likes : 0
    };
    /* NEW PERSISTENCE START */
    savePostToLS(dataObj);
    /* NEW PERSISTENCE END */
  }

    /* card markup (matches existing feed) */
    const html = `
<div class="instagram-post card mx-auto my-0 rounded-0 pb-2 pt-2">

  <!-- header -->
  <header class="post-header d-flex align-items-center justify-content-between px-2 pb-1">
  <!-- left: avatar + name + time -->
  <div class="d-flex align-items-center">
    <img src="${USER_PIC}" alt="${USERNAME}"
         class="rounded-circle me-2" style="width:32px;height:32px;object-fit:cover;">
    <span class="fw-semibold username-top-header">${USERNAME}</span>
    <span class="separation-dot mx-1">•</span>
    <span class="time-since-posted" title="now">Now</span>
  </div>

   <!-- Right column: More options button -->
                  <div class="col-auto header-more-options">
                    <!-- col-auto: column width adjusts to fit its content -->
                    <button class="btn btn-sm p-0 border-0 bg-transparent more-options-btn" title="More options"
                      aria-label="Post options" data-post-id="post-1">
                      •••
                    </button>
                    <!-- btn: basic button styling -->
                    <!-- btn-sm: small-sized button -->
                    <!-- p-0: no padding -->
                    <!-- border-0: no border -->
                    <!-- bg-transparent: transparent background -->
                  </div>
</header>

  <!-- picture -->
  <div class="post-image">
  <img src="${dataObj.img || previewURL}"
       class="w-100" style="object-fit:cover;">
</div>

  <!-- action bar -->
  <div
                  class="post-actions d-flex justify-content-between align-items-center p-0"
                >
                  <!-- post-actions: custom class for styling post action elements -->
                  <!-- d-flex: applies flexbox layout -->
                  <!-- justify-content-between: spaces children to edges with space between -->
                  <!-- align-items-center: vertically centers children within the flex container -->
                  <!-- p-0: removes all padding -->

                  <!-- Left side: Like, Comment, Share -->
                  <div class="actions-left d-flex gap-3">
                    <!-- actions-left: custom class for styling left action group -->
                    <!-- d-flex: applies flexbox layout -->
                    <!-- gap-3: adds consistent spacing (1rem) between flex children -->

                    <!-- Like button -->
                    <button
                      class="btn btn-link p-0 mt-2 me-1"
                      aria-label="Like post"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                        class="action-icon"
                        role="img"
                        aria-label="Like"
                      >
                        <title>Like</title>
                        <path
                          d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"
                        ></path>
                      </svg>
                    </button>

                    <!-- Comment button -->
                    <button
                      class="btn btn-link p-0 mt-2 me-1"
                      aria-label="Comment on post"
                    >
                      <!-- btn: basic button styling -->
                      <!-- btn-link: styles button to look like a link -->
                      <!-- p-0: removes all padding -->
                      <!-- mt-2: adds margin-top (0.5rem) -->
                      <!-- me-1: adds margin-end/right (0.25rem) -->

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                        class="action-icon"
                        role="img"
                        aria-label="Comment"
                      >
                        <title>Comment</title>
                        <path
                          d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linejoin="round"
                        ></path>
                      </svg>
                    </button>

                    <!-- Share button -->
                    <button
                      class="btn btn-link p-0 mt-2 me-1"
                      aria-label="Share"
                    >
                      <!-- btn: basic button styling -->
                      <!-- btn-link: makes button look like a link -->
                      <!-- p-0: removes all padding -->
                      <!-- mt-2: adds top margin (0.5rem) -->
                      <!-- me-1: adds right margin (0.25rem) -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                        class="action-icon"
                        role="img"
                        aria-label="Share Post"
                      >
                        <title>Share</title>
                        <line
                          x1="22"
                          y1="3"
                          x2="9.218"
                          y2="10.083"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linejoin="round"
                          fill="none"
                        />
                        <polygon
                          points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linejoin="round"
                          fill="none"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Right side: Save -->
                  <div class="actions-right">
                    <button
                      class="btn btn-link p-0 mt-2"
                      aria-label="Save post"
                    >
                      <!-- btn: basic button styling -->
                      <!-- btn-link: makes button look like a link -->
                      <!-- p-0: removes all padding -->
                      <!-- mt-2: adds top margin (0.5rem) -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                        class="action-icon"
                        role="img"
                        aria-label="Save"
                      >
                        <title>Save</title>
                        <polygon
                          points="20 21 12 13.44 4 21 4 3 20 3 20 21"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

  <!-- like counter (starts at 0) -->
  <span class="likes-simple fw-semibold">
  <span class="likes-count">0</span> likes
</span>


  <!-- caption -->
 ${
   dataObj.text
     ? `<div class="caption-container px-2 pt-1">
           <strong class="caption-username fw-semibold">${USERNAME}</strong>
         ${dataObj.text}
         </div>`
     : ""
 }

  <!-- add-comment line -->
  <div class="add-comment d-flex align-items-center py-1 gap-2">
    <input class="form-control border-0 flex-grow-1 p-0"
           placeholder="Add a comment…" aria-label="Add a comment">
    <button
                    class="btn btn-link p-0 text-muted fade-on-hover"
                    aria-label="comment emoji"
                  >
                    <!-- btn: basic Bootstrap button styling -->
                    <!-- btn-link: styles button like a link -->
                    <!-- p-0: removes all padding -->
                    <!-- text-muted: applies muted (gray) text color -->
                    <!-- fade-on-hover: custom class for fade effect when hovered -->
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Emoji"
                      role="img"
                      viewBox="0 0 24 24"
                      width="13"
                      height="13"
                      fill="currentColor"
                    >
                      <title>Emoji</title>
                      <path
                        d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"
                      ></path>
                    </svg>
                  </button>
  </div>
</div>`;

    feed.insertAdjacentHTML('afterbegin', html);

    /* tell like-toggle.js to scan again */
    document.dispatchEvent(new Event('re-init-likes'));
  }

  /* ── event wiring ───────────────────────────────────────── */

  /* choose file */
  inputFile.addEventListener('change', () => {
    if (!inputFile.files.length) return;
  pickedFile = inputFile.files[0];


    const reader = new FileReader();
  reader.onload = ev => {
    previewURL = ev.target.result;          // base64 string
    cropZone.innerHTML = `<img src="${previewURL}" style="max-width:100%;height:auto;display:block;">`;
    ensureCaption();
    btnNext.textContent='Share';
    showStep(false);
  };
  reader.readAsDataURL(pickedFile);
  });

  /* back ← */
  btnBack.addEventListener('click', resetToStep0);

  /* share → */
  btnNext.addEventListener('click', () => {
  if (btnNext.textContent !== 'Share') return;   // still “Next”

  try {
    injectPost();              // prepend card
  } finally {
    closeModal();              // always hide the modal
  }
});

  /* open / close modal */
  btnCreate.addEventListener('click', e => { e.preventDefault(); openModal(); });
  btnClose .addEventListener('click', closeModal);
  backdrop .addEventListener('click', closeModal);

  /* ESC */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  loadPostsFromLS(); 
});
