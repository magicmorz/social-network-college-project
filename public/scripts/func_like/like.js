/* like.js  – toggle heart + update like count */
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".post-actions button[aria-label='Like post']")
    .forEach(btn => {
      // find like-counter once per post
      const post     = btn.closest(".instagram-post");
      const counter  = post?.querySelector(".post-likes .likes-text");
      const hasCount = counter && !isNaN(parse(counter.textContent));

      let liked = false;

      btn.addEventListener("click", () => {
        liked = !liked;
        btn.classList.toggle("liked", liked);  // red fill
        btn.classList.add("pop");              // bump
        setTimeout(() => btn.classList.remove("pop"), 400);

        if (hasCount) {
          const n = parse(counter.textContent);
          counter.textContent = format(liked ? n+1 : n-1);
        }
      });
    });

  /* helpers */
  function parse(txt){ return +txt.replace(/[,\s]/g,""); }
  function format(n){  return n.toLocaleString("en-US"); }


});
