(function() {
    const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";
    let updateTimeout;

    async function updateComments() {
        const counters = document.querySelectorAll("[data-comment-count]");
        
        for (const el of counters) {
            const pageUrl = el.dataset.page || window.location.href;
            
            try {
                const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
                if (!res.ok) continue;
                
                const data = await res.json();
                el.textContent = data.totalComments?.toString() || "0";
            } catch {
                el.textContent = "0";
            }
        }
    }

    async function updateReactions() {
        const counters = document.querySelectorAll("[data-reaction-score]");
        
        for (const el of counters) {
            const pageUrl = el.dataset.page || window.location.href;
            const data = await fetchPageData(pageUrl);
            
            let score = 0;
            
            // Handle the reaction format: {"THUMBS_UP":1,"THUMBS_DOWN":1}
            if (data?.reactions) {
                const ups = data.reactions.THUMBS_UP || 0;
                const downs = data.reactions.THUMBS_DOWN || 0;
                score = ups - downs;
            }
            
            // Plain score display
            el.textContent = score > 0 ? `+${score}` : score.toString();
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
		
