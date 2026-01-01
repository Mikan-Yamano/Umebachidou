export default {
    async fetch(request, env) {
	try {
	    const url = new URL(request.url);
	    const page = url.searchParams.get("page");

	    if (!page) {
		return json({ error: "Missing page parameter" }, 400);
	    }

	    // Parse discussion number from GitHub URL
	    let discussionNumber;
	    try {
		const pathname = new URL(page).pathname;
		discussionNumber = Number(pathname.split("/").pop());
	    } catch {
		return json({ error: "Invalid discussion URL" }, 400);
	    }

	    if (!Number.isInteger(discussionNumber)) {
		return json({ error: "Invalid discussion number" }, 400);
	    }

const query = `
  query ($number: Int!) {
    repository(owner: "Mikan-Yamano", name: "Umebachidou") {
      discussion(number: $number) {
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
		    variables: { number: discussionNumber }
		})
	    });

	    if (!ghRes.ok) {
		const text = await ghRes.text();
		return json({ error: "GitHub API error", detail: text }, 500);
	    }

	    const data = await ghRes.json();

	    if (data.errors) {
		return json({
		    error: "GraphQL error",
		    details: data.errors
		}, 500);
	    }

	    const discussion = data?.data?.repository?.discussion;

	    if (!discussion) {
		return json({
		    error: "Discussion not found",
		    page
		}, 404);
	    }

	    const reactions = {};
	    for (const r of discussion.reactions.nodes) {
		reactions[r.content] = (reactions[r.content] || 0) + 1;
	    }

	    return json({
		page,
		discussionNumber,
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

