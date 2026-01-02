(function() {
    const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";
    let updateTimeout;

    async function fetchStatsForPage(pageUrl) {
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

    // async function updateComments() {
    //     const counters = document.querySelectorAll("[data-comment-count]");
    
    //     for (const el of counters) {
    //         const pageUrl = el.dataset.page || window.location.href;
    
    //         try {
    //             const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
    //             if (!res.ok) continue;
    
    //             const data = await res.json();
    //             el.textContent = data.totalComments?.toString() || "0";
    //         } catch {
    //             el.textContent = "0";
    //         }
    //     }
    // }

    // async function updateReactions() {
    //     const counters = document.querySelectorAll("[data-reaction-score]");
    
    //     for (const el of counters) {
    //         const pageUrl = el.dataset.page || window.location.href;
    
    //         let score = 0;
    
    //         try {
    // 		const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
    // 		if (!res.ok) continue;

    // 		const data = await res.json();

    // 		let score = 0;

    // 		if (data?.reactions) {
    //                 const ups = data.reactions.THUMBS_UP || 0;
    //                 const downs = data.reactions.THUMBS_DOWN || 0;
    //                 score = ups - downs;
    // 		}

    // 		el.textContent = score.toString();
    //         } catch {
    // 		el.textContent = "0";
    //         }
    // 	}
    // }

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

