(function () {
  const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";

  async function updateReactionScore() {
    const el = document.getElementById("reactionScore");
    if (!el) return;

    const pageUrl = window.location.href;

    try {
      const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
      if (!res.ok) {
        el.textContent = "0";
        return;
      }

      const data = await res.json();

      const ups = data?.reactions?.THUMBS_UP || 0;
      const downs = data?.reactions?.THUMBS_DOWN || 0;
      const score = ups - downs;

      el.textContent = score.toString();
    } catch {
      el.textContent = "0";
    }
  }

  document.addEventListener("DOMContentLoaded", updateReactionScore);
})();
