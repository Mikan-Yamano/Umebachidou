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

export default {
    
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

	     // ========== CACHE LOGIC START ==========
            // Generate cache key from page URL
            const cacheKey = `discussion:${pathname}`;
            
            // Try to get from KV cache first
            const cachedData = await env.COMMENTS_CACHE.get(cacheKey, { type: "json" });
            
            if (cachedData) {
                console.log(`Cache HIT for: ${pathname}`);
                return json(cachedData);
            }
            
            console.log(`Cache MISS for: ${pathname}`);
            // ========== CACHE LOGIC END ==========
	    
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
                // Cache empty result for 10 minutes
                const emptyResult = {
                    page,
                    pathname,
                    totalComments: 0,
                    reactions: {}
                };
                await env.COMMENTS_CACHE.put(cacheKey, JSON.stringify(emptyResult), {
                    expirationTtl: 600 // 10 minutes for empty results
                });
                return json(emptyResult);
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

	    const discussion = statsData?.data?.repository?.discussion;

	    if (!discussion) {
                const emptyResult = {
                    page,
                    pathname,
                    totalComments: 0,
                    reactions: {}
                };
                await env.COMMENTS_CACHE.put(cacheKey, JSON.stringify(emptyResult), {
                    expirationTtl: 600 // 10 minutes
                });
                return json(emptyResult);
            }

	    const reactions = {};
	    for (const r of discussion.reactions.nodes) {
		reactions[r.content] = (reactions[r.content] || 0) + 1;
	    }

	    const result = {
                page,
                pathname,
                discussionNumber,
                totalComments: discussion.comments.totalCount,
                reactions
            };

            // ========== CACHE SUCCESS RESULT ==========
            // Cache successful results for 5 minutes (adjust as needed)
            await env.COMMENTS_CACHE.put(cacheKey, JSON.stringify(result), {
                expirationTtl: 300 // 5 minutes = 300 seconds
            });
            // ==========================================

            return json(result);

        } catch (err) {
            return json(
                { error: "Worker exception", message: err.message },
                500
            );
        }
    }
};

// Helper function to cache error responses briefly
async function cacheErrorResponse(env, cacheKey, pathname) {
    const errorResult = {
        pathname,
        totalComments: 0,
        reactions: {},
        cachedError: true
    };
    // Cache errors for only 60 seconds to retry soon
    await env.COMMENTS_CACHE.put(cacheKey, JSON.stringify(errorResult), {
        expirationTtl: 60
    });
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
	status,
	headers: {
	    "Content-Type": "application/json",
	    "Access-Control-Allow-Origin": "*",
	     // Add cache-control headers for browser/CDN caching
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
	}
    });
}

