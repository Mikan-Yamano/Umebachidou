const statsCache = new Map();

(function() {
    const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";
    let updateTimeout;

    async function fetchStatsForPage(pageUrl) {
	if (statsCache.has(pageUrl)) {
            return statsCache.get(pageUrl);
	}

	try {
            const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
            if (!res.ok) return null;
            return await res.json();
	} catch {
            return null;
	}
    }

    async function updateAllCounters() {
	const rows = document.querySelectorAll(".book-version");

	for (const row of rows) {
            const pageUrl = row.dataset.page || window.location.href;
            const data = await fetchStatsForPage(pageUrl);

            const comments = data?.totalComments || 0;

            // reaction score (reuse your logic)
            const ups = data?.reactions?.THUMBS_UP || 0;
            const downs = data?.reactions?.THUMBS_DOWN || 0;
            const score = ups - downs;

            /* ---- store for sorting ---- */
            row.dataset.comments = comments;
            row.dataset.score = score;

            /* ---- update UI ---- */
	    row.querySelector("[data-comment-count]").textContent = comments;
            row.querySelector("[data-reaction-score]").textContent = score;
	}
    }

    function updateAll() {
        updateComments();
        updateReactions();
    }

    // Debounce function
    function debouncedUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateAll, 100);
    }

    // Initial update
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', debouncedUpdate);
    } else {
        debouncedUpdate();
    }

    // Update on changes
    new MutationObserver(debouncedUpdate).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();

