export default {

    function giscusPathname(pageUrl) {
	const u = new URL(pageUrl);

	let path = u.pathname;

	// Remove leading slash
	if (path.startsWith("/")) {
	    path = path.slice(1);
	}

	// Remove trailing .html
	if (path.endsWith(".html")) {
	    path = path.slice(0, -5);
	}

	return path;
    }
    
    async fetch(request, env) {
	try {
	    const reqUrl = new URL(request.url);
	    const page = reqUrl.searchParams.get("page");

	    if (!page) {
		return json({ error: "Missing page parameter" }, 400);
	    }

	    //Extract pathname from the local page URL
	    let pathname;
	    try {
		pathname = giscusPathname(page);
	    } catch {
		return json({ error: "Invalid page URL" }, 400);
	    }
	    

	    //Search GitHub Discussions by pathname token
	    const searchQuery = `
        query ($q: String!) {
          search(query: $q, type: DISCUSSION, first: 1) {
            nodes {
              ... on Discussion {
                number
              }
            }
          }
        }
      `;

	    const searchRes = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
		    "Authorization": `Bearer ${env.discus}`,
		    "Content-Type": "application/json",
		    "User-Agent": "Umebachidou"
		},
		body: JSON.stringify({
		    query: searchQuery,
		    variables: {
			q: `repo:Mikan-Yamano/Umebachidou "${pathname}"`
		    }
		})
	    });

	    if (!searchRes.ok) {
		return json(
		    { error: "GitHub search failed", detail: await searchRes.text() },
		    500
		);
	    }

	    const searchData = await searchRes.json();

	    if (searchData.errors) {
		return json(
		    { error: "GraphQL search error", details: searchData.errors },
		    500
		);
	    }

	    const discussionNode = searchData?.data?.search?.nodes?.[0];

	    if (!discussionNode) {
		return json({
		    page,
		    pathname,
		    totalComments: 0,
		    reactions: {}
		});
	    }

	    const discussionNumber = discussionNode.number;

	    const statsQuery = `
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

	    const statsRes = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
		    "Authorization": `Bearer ${env.discus}`,
		    "Content-Type": "application/json",
		    "User-Agent": "Umebachidou"
		},
		body: JSON.stringify({
		    query: statsQuery,
		    variables: {
			number: discussionNumber
		    }
		})
	    });

	    if (!statsRes.ok) {
		return json(
		    { error: "GitHub discussion query failed", detail: await statsRes.text() },
		    500
		);
	    }

	    const statsData = await statsRes.json();

	    if (statsData.errors) {
		return json(
		    { error: "GraphQL discussion error", details: statsData.errors },
		    500
		);
	    }

	    const discussion =
		  statsData?.data?.repository?.discussion;

	    if (!discussion) {
		return json({
		    page,
		    pathname,
		    totalComments: 0,
		    reactions: {}
		});
	    }

	    const reactions = {};
	    for (const r of discussion.reactions.nodes) {
		reactions[r.content] = (reactions[r.content] || 0) + 1;
	    }

	    return json({
		page,
		pathname,
		discussionNumber,
		totalComments: discussion.comments.totalCount,
		reactions
	    });

	} catch (err) {
	    return json(
		{ error: "Worker exception", message: err.message },
		500
	    );
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

