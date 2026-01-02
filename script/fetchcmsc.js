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

	    // Store in cache
            statsCache.set(pageUrl, data);
            return data;
	} catch {
	    console.error('Error fetching stats:', error);
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
            const commentElement = row.querySelector("[data-comment-count]");
            const scoreElement = row.querySelector("[data-reaction-score]");
            
            if (commentElement) {
                commentElement.textContent = comments;
            }
            if (scoreElement) {
                scoreElement.textContent = score;
            }
	}
    }

    function updateAll() {
        updateComments();
        updateReactions();
    }

  // Debounce function
    function debouncedUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateAllCounters();
        }, 100);
    }

    // Set up polling for updates (optional)
    function startPolling(interval = 30000) { // 30 seconds
        setInterval(() => {
            // Clear cache to force fresh data
            statsCache.clear();
            updateAllCounters();
        }, interval);
    }

    // Initial update
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            debouncedUpdate();
            // Optional: start polling for updates
            // startPolling();
        });
    } else {
        debouncedUpdate();
    }

