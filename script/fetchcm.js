(async function() {
    const WORKER_URL = "https://umebachidou.mikan-yamano.workers.dev/";

    // Define the function first
    async function updateCounts() {
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
                    ? data.totalComments.toString()  // Convert to string
                    : "0";
            } catch {
                el.textContent = "0";
            }
        }
    }

    // Initial update
    await updateCounts();

    // Set up observer AFTER function is defined
    const observer = new MutationObserver(function(mutations) {
        // Only reconnect after mutations are processed
        setTimeout(() => {
            observer.disconnect();
            updateCounts();
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }, 100); // Small delay to ensure DOM is stable
    });

    // Start observing
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})(); // Correctly closed IIFE
