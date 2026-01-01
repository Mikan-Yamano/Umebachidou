// fetch("https://mikan-yamano.workers.dev?page=https://mikan-yamano.github.io/Umebachidou/comment/Yumeno-Dogura/01.html")
//   .then(r => r.json())
//   .then(d => {
//     document.getElementById("comment-count").textContent =
//       d.totalComments;
//   });

<script>
  const el = document.querySelector(".comment-count");
  console.log("element =", el);
  if (el) el.textContent = "FOUND";
</script>
