export default {
    async fetch(request, env) {
	try {
	    const url = new URL(request.url);
	    const page = url.searchParams.get("page");

	    if (!page) {
		return json({ error: "Missing page parameter" }, 400);
	    }

	    const query = `
query ($page: String!) {
  repository(owner: "Mikan-Yamano", name: "Umebachidou") {
    discussion(url: $page) {
      comments {
        totalCount
      }
      reactions(first: 100) {
        nodes {
          content
        }
      }
    }
  }
}
`;

	    const ghRes = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
		    "Authorization": `Bearer ${env.discus}`,
		    "Content-Type": "application/json",
		    "User-Agent": "Umebachidou"
		},
		body: JSON.stringify({
		    query,
		    variables: { page }
		})
	    });

	    if (!ghRes.ok) {
		const text = await ghRes.text();
		return json({ error: "GitHub API error", detail: text }, 500);
	    }

	    const data = await ghRes.json();
	    const discussion = data?.data?.repository?.discussion;

	    // if (!discussion) {
	    // 	return json({
	    // 	    page,
	    // 	    totalComments: 0,
	    // 	    reactions: {}
	    // 	});
	    // }

	    const reactions = {};
	    for (const r of discussion.reactions.nodes) {
		reactions[r.content] = (reactions[r.content] || 0) + 1;
	    }
	    
	    return json({
		page,
		totalComments: discussion.comments.totalCount,
		reactions
	    });

	} catch (err) {
	    return json({
		error: "Worker exception",
		message: err.message
	    }, 500);
	}
    }
};

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
	status,
	headers: {
	    "Content-Type": "application/json",
	    "Access-Control-Allow-Origin": "*"
	}
    });
}

// async function getCommentCountFromIssue() {
//     const CONFIG = {
//         owner: 'Mikan-Yamano',
//         repo: 'Umebachidou',
//         issueNumber: 1
//     };

//     try {
//         // Get issue details which includes comment count
//         const response = await fetch(
//             `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/issues/${CONFIG.issueNumber}`,
//             {
//                 headers: {
//                     'Accept': 'application/vnd.github.v3+json'
//                 }
//             }
//         );

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }

//         const issue = await response.json();

//         // The issue object contains the comment count directly
//         console.log('Total comments:', issue.comments);
//         return issue.comments;

//     } catch (error) {
//         console.error('Error:', error);
//         throw error;
//     }
// }
