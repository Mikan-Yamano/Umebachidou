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
            
            try {
                const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageUrl)}`);
                if (!res.ok) continue;
                
                const data = await res.json();
                
                // Calculate plain score
                let score = 0;
                if (data.reactions) {
                    data.reactions.forEach(r => {
                        if (r.content === '+1' || r.content === 'THUMBS_UP') {
                            score += 1;
                        } else if (r.content === '-1' || r.content === 'THUMBS_DOWN') {
                            score -= 1;
                        }
                    });
                }
                
                // Plain score display (e.g., "+3" or "-2")
                el.textContent = score > 0 ? `+${score}` : score.toString();
            } catch {
                el.textContent = "0";
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
		
