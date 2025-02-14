import { buildBlock, decorateBlock } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  // Find breadcrumb section if it exists
  const breadcrumb = block.querySelector('.breadcrumb-container');
  const outDiv = div();

  const tempDiv = div(buildBlock('side-nav', { elems: [] }));
  if (tempDiv?.querySelector('div')) {
    decorateBlock(tempDiv.querySelector('div'));
  }
  tempDiv.classList.add('side-nav-wrapper');
  const newSideNavSection = div({ class: 'section side-nav-container',
    'data-section-status': 'initialized' });
  newSideNavSection.style.display = 'none';
  newSideNavSection.appendChild(tempDiv);

  // Move all sections to wrapper div except breadcrumb
  const sections = block.querySelectorAll('.section');
  sections.forEach((section) => {
    if (!section.classList.contains('breadcrumb-container')) {
      outDiv.appendChild(section);
    }
  });

  outDiv.prepend(newSideNavSection);

  // Clear the block and add breadcrumb (if exists) and wrapper div
  block.innerHTML = '';
  if (breadcrumb) {
    block.appendChild(breadcrumb);
  }

  block.appendChild(outDiv);
}
