const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');

async function generateAuthorIndex() {
    const bookshelfDir = 'bookshelf';  // Your bookshelf directory
    const outputFile = 'authors.html';  // Where to save the index
    const authorIndex = {};  
    
    try {
	// Read all HTML files in bookshelf directory
	const files = fs.readdirSync(bookshelfDir)
	      .filter(file => file.endsWith('.html')) ;
	
	for (const file of files) {
	    const filePath = path.join(bookshelfDir, file);
	    const html = fs.readFileSync(filePath, 'utf8');
	    
	    // Extract metadata from JSON block
	    const metaMatch = html.match(/<script[^>]*id=["']?page-meta["']?[^>]*>([\s\S]*?)<\/script>/i);
	    
	    if (metaMatch) {
		try {
		    const metaJson = metaMatch[1].trim();
		    const meta = JSON.parse(metaJson);
		    
		    const author = meta['author'];
		    
		    if (author) {
			if (!authorIndex[author]) {
			    authorIndex[author] = [];
			}
			
			authorIndex[author].push({
			    title: meta.title || 'Untitled',
			    url: 'bookshelf/${file}',  // Adjust path as needed
			    date: meta.date || meta.year || 'Unknown',
			    file: file
			});
			
			console.log(`✓ ${file} → ${author}`);
		    } else {
			console.log(`⚠️ ${file}: No author found in metadata`);
		    }
		} catch (parseError) {
		    console.error(`❌ ${file}: Failed to parse metadata`, parseError.message);
		}
	    } else {
		console.log(`⚠️ ${file}: No page-meta script found`);
	    }
	}
	
	// Generate HTML for the author index
	const html = generateIndexHTML(authorIndex);
	
	// Save to file
	fs.writeFileSync(outputFile, html);
	
    } catch (error) {
	console.error('Error generating author index:', error);
	process.exit(1);
    }
}

function generateIndexHTML(authorIndex) {
    // Sort authors alphabetically
    const sortedAuthors = Object.keys(authorIndex).sort();
    
    let html = `<!DOCTYPE html>
<html lang="ja">
  
  <head>
    <meta charset="UTF-8" />
    <base href="/Umebachidou/">
    <meta name="viewport" content="width=device-width" />
    <link rel="stylesheet" href="css/style.css" />
    <title>INDEX</title>
  </head>

     <style>
    body {
	background-image: url('image/background.jpg');
    }
  </style>

<body>
    <header>
        <h1>Author Index</h1>
    </header>
    
    <main>`;
    
    if (sortedAuthors.length === 0) {
	html += `
        <div class="empty-state">
            <h3>No authors found</h3>
            <p>No books with author metadata were found in the bookshelf directory.</p>
        </div>`;
    } else {
	sortedAuthors.forEach(author => {
	    const books = authorIndex[author];
	    // Sort books by date (newest first)
	    books.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
	    
	    html += `
        <section class="author-section">
            <h2 class="author-name">${escapeHtml(author)}</h2>
            <ul class="book-list">`;
	    
	    books.forEach(book => {
		html += `
                <li class="book-item">
                    <div>
                        <a href="${escapeHtml(book.url)}" class="book-link">
                            <span class="book-title">${escapeHtml(book.title)}</span>
                        </a>
                    </div>
                    <div class="book-meta">
                        ${book.year ? `<span> ${escapeHtml(book.year)}</span>` : ''}
                        ${book.scenario ? `<span>v${escapeHtml(book.scenario)}</span>` : ''}
                        ${book.file ? `<span> ${https://mikan-yamano.github.io/Umebachidou/book.file}</span>` : ''}
                    </div>
                </li>`;
	    });
	    
	    html += `
            </ul>
        </section>`;
	});
    }
    
    html += `
    </main>
    
    <footer>
        <p>Index automatically generated from metadata in HTML files.</p>
        <p>Last updated: ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>`;
    
    return html;
}

function escapeHtml(text) {
    return text
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;")
	.replace(/'/g, "&#039;");
}

// Run the script
generateAuthorIndex();
