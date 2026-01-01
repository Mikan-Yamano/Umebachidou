(async () => {
    const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";

    const counters = document.querySelectorAll("[data-comment-count]");

    for (const el of counters) {
	const pageUrl = el.dataset.page || window.location.href;

	try {
	    const res = await fetch(
		`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`
	    );

	    if (!res.ok) continue;

	    const data = await res.json();

	    el.textContent =
		typeof data.totalComments === "number"
		? data.totalComments
		: "0";
	} catch {
	    el.textContent = "0";
	}
    }
}

var observer = new MutationObserver(function () {
    observer.disconnect();
    updateCounts();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

