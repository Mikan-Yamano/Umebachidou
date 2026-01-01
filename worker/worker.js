export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const term = url.searchParams.get("page");

    if (!term) {
      return new Response(
        JSON.stringify({ error: "Missing page parameter" }),
        { status: 400 }
      );
    }

    const query = `
      query ($owner: String!, $repo: String!, $term: String!) {
        repository(owner: $owner, name: $repo) {
          discussions(first: 1, orderBy: {field: CREATED_AT, direction: DESC}, filterBy: {title: $term}) {
            nodes {
              comments {
                totalCount
              }
              reactions {
                totalCount
                nodes {
                  content
                }
              }
            }
          }
        }
      }
    `;

    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables: {
          owner: "YOUR_NAME",
          repo: "YOUR_REPO",
          term
        }
      })
    });

    const ghData = await ghRes.json();
    const discussion =
      ghData?.data?.repository?.discussions?.nodes?.[0];

    if (!discussion) {
      return new Response(
        JSON.stringify({ error: "Discussion not found" }),
        { status: 404 }
      );
    }

    // Count reactions by type
    const reactionCounts = {};
    for (const r of discussion.reactions.nodes) {
      reactionCounts[r.content] =
        (reactionCounts[r.content] || 0) + 1;
    }

    return new Response(
      JSON.stringify({
        page: term,
        totalComments: discussion.comments.totalCount,
        reactions: reactionCounts
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30"
        }
      }
    );
  }
};
