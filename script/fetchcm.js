(async () => {
  const WORKER_URL = "https://YOUR-WORKER-URL.example.com";

  const counters = document.querySelectorAll("[data-comment-count]");

  for (const el of counters) {
    const pageUrl = el.dataset.page || window.location.href;

    try {
      const res = await fetch(
        `${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`
      );

      if (!res.ok) continue;

      const data = await res.json();

      if (typeof data.totalComments === "number") {
        el.textContent = data.totalComments;
      } else {
        el.textContent = "0";
      }

    } catch (err) {
      console.error("Comment count failed:", pageUrl, err);
      el.textContent = "0";
    }
  }
})();
