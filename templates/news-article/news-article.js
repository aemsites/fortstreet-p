import { buildBlock, decorateBlock, getMetadata } from '../../scripts/aem.js';
import { a, div, h2, li, p, ul } from '../../scripts/dom-helpers.js';

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear().toString().slice(-2); // Gets last 2 digits of year

  return `${day} ${month} ${year}`;
}

export default async function decorate(block) {
  const breadcrumb = block.querySelector('.breadcrumb-container');
  const outDiv = div();

  const latestNews = await fetch('/query-index.json');
  let latestNewsData = await latestNews.json();
  latestNewsData = latestNewsData.data.filter((item) => item.template === 'news-article')
    .sort((x, y) => new Date(y['publication-date']) - new Date(x['publication-date']))
    .slice(0, 10);
  const ulTemp = ul();
  latestNewsData.forEach((item) => {
    // create li having a having breadcrumb-title as link and publication-date
    const liTemp = li(a({ href: item.path }, item['breadcrumb-title']), div(formatDate(item['publication-date'])));
    ulTemp.appendChild(liTemp);
  });

  const latestNewsDiv = div(h2('Latest News'), ulTemp);
  const tempDiv = div(buildBlock('text', { elems: [latestNewsDiv] }));
  if (tempDiv?.querySelector('div')) {
    tempDiv.querySelector('div').classList.add('blue-background');
    decorateBlock(tempDiv.querySelector('div'));
  }
  tempDiv.classList.add('text-wrapper');
  const textSection = div({ class: 'section text-container',
    'data-section-status': 'initialized' });
  textSection.style.display = 'none';
  textSection.appendChild(tempDiv);

  // Move all sections to wrapper div except breadcrumb
  const sections = block.querySelectorAll('.section');
  sections.forEach((section) => {
    if (!section.classList.contains('breadcrumb-container')) {
      section.querySelector('.default-content-wrapper')
        ?.prepend(p({ class: 'publication-date' }, formatDate(getMetadata('publication-date'))));
      outDiv.appendChild(section);
    }
  });

  outDiv.appendChild(textSection);

  // Clear the block and add breadcrumb (if exists) and wrapper div
  block.innerHTML = '';
  if (breadcrumb) {
    block.appendChild(breadcrumb);
  }

  outDiv.querySelectorAll('a').forEach((anchor) => {
    anchor.classList.remove('button');
  });

  block.appendChild(outDiv);
}
