class SiteHeader extends HTMLElement {
    connectedCallback() {
	this.innerHTML = `
      <base href="/Umebachidou">
      <header class="site-header">
      <nav class="nav-buttons">
	<button><a href="/index.html"/>玄関</a></button>
<button><a href="/bookshelf/Yumeno-Dogura.html"/>本棚</a></button>
<button>御礼</button>
<button>便り</button>
</nav>
</header>
    `;
    }
}
customElements.define('site-header', SiteHeader);
