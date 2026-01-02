document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sortSelect');
    const tbody = document.getElementById('versionTableBody');

    if (!sortSelect || !tbody) return;

    sortSelect.addEventListener('change', () => {
	const [key, order] = sortSelect.value.split('-');
	const rows = Array.from(tbody.querySelectorAll('tr'));

	rows.sort((a, b) => {
	    let aVal, bVal;

	    if (key === 'year') {
		aVal = parseInt(a.cells[1].textContent, 10);
		bVal = parseInt(b.cells[1].textContent, 10);
	    }
	    else if (key === 'comments') {
		aVal = Number(a.dataset.comments || 0);
		bVal = Number(b.dataset.comments || 0);
	    }
	    else if (key === 'score') {
		aVal = Number(a.dataset.score || 0);
		bVal = Number(b.dataset.score || 0);
	    }

	    if (aVal < bVal) return order === 'asc' ? -1 : 1;
	    if (aVal > bVal) return order === 'asc' ? 1 : -1;
	    return 0;
	});

	rows.forEach(row => tbody.appendChild(row));
    });
});

