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
				  
				  const author = meta['work-author'];
				  
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Author Index - Bookshelf</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .stats {
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .author-section {
            background: white;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .author-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .author-name {
            color: #3498db;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .book-list {
            list-style: none;
        }
        
        .book-item {
            padding: 12px 0;
            border-bottom: 1px solid #f8f9fa;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .book-item:last-child {
            border-bottom: none;
        }
        
        .book-title {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .book-meta {
            color: #6c757d;
            font-size: 0.9em;
            display: flex;
            gap: 15px;
        }
        
        .book-link {
            color: #3498db;
            text-decoration: none;
            transition: color 0.2s;
        }
        
        .book-link:hover {
            color: #2980b9;
            text-decoration: underline;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        
        footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 0.9em;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .book-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .book-meta {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>📚 Bookshelf Author Index</h1>
        <div class="stats">
            ${sortedAuthors.length} authors • 
            ${sortedAuthors.reduce((total, author) => total + authorIndex[author].length, 0)} books •
            Generated on ${new Date().toLocaleDateString()}
        </div>
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
                        ${book.date ? `<span>📅 ${escapeHtml(book.date)}</span>` : ''}
                        ${book.version ? `<span>v${escapeHtml(book.version)}</span>` : ''}
                        ${book.file ? `<span>📄 ${escapeHtml(book.file)}</span>` : ''}
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
	const div = document ? document.createElement('div') : { textContent: '' };
	div.textContent = text;
	return div.innerHTML || text.replace(/[&<>"']/g, char => ({
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;'
	}[char]));
    }

    // Run the script
    generateAuthorIndex();
