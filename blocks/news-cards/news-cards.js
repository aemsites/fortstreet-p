import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  
  // Get the news items data from the block
  const newsItems = block.children[0]?.children[0]?.textContent 
    ? JSON.parse(block.children[0].children[0].textContent) 
    : [];

  // Create card elements
  newsItems.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="${item.path}" class="news-card">
        <div class="cards-card-image">
          <img class="news-card-image" src="${item.image}" alt="${item.title}"/>
        </div>
        <div class="cards-card-body">
          <div class="news-card-category">/ News category</div>
          <h3 class="news-card-title">${item.title}</h3>
          <div class="news-card-date">${item.date}</div>
          <div class="news-card-description">${item.description}</div>
        </div>
      </a>
    `;

    // Handle image optimization
    const img = li.querySelector('img');
    if (img && !img.closest('picture')) {
      img.closest('div').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }

    ul.appendChild(li);
  });

  block.textContent = '';
  block.append(ul);
}