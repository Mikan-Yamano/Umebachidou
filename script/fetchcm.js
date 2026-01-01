fetch("https://mikan-yamano.workers.dev?https://mikan-yamano.github.io/Umebachidou/comment/Yumeno-Dogura/01.html")
  .then(r => r.json())
  .then(d => {
    document.getElementById("comment-count").textContent =
      d.totalComments;
  });
