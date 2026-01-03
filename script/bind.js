document.addEventListener('DOMContentLoaded', function() {
    const metaEl = document.getElementById("page-meta");
    if (!metaEl) return;  
    
    let meta;
    try {
	meta = JSON.parse(metaEl.textContent); 
    } catch {
	return;  
    }
    
    const bind = (id, value) => {
	const el = document.getElementById(id);
	if (el && value != null) {  
	    el.textContent = value;   
	}
    };
    
    // Bind each piece of data
    bind("work-title", meta.title);
    bind("work-author", meta.author);
    bind("work-year", meta.year);
    bind("work-scenario", meta.scenario);
    
})();
