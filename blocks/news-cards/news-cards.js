import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'news-cards-list';

  // Get the news items data from the block
  const newsItems = block.children[0]?.children[0]?.textContent
    ? JSON.parse(block.children[0].children[0].textContent)
    : [];

  // Create card elements
  newsItems.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${item.path}" class="news-card">
        <img class="news-card-image" src="${item.image}" alt="${item.title}"/>
        <div class="news-card-content">
          <div class="news-card-category">${item.category}</div>
          <h3 class="news-card-title">${item.title}</h3>
          <div class="news-card-date">${item.date}</div>
          <div class="news-card-description">${item.description}</div>
        </div>
      </a>
    `;

    ul.appendChild(li);
  });

  block.textContent = '';
  block.append(ul);
}