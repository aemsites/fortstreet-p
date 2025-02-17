import { buildBlock, loadBlock, decorateBlock } from '../../scripts/aem.js';


export default async function decorate(block) {
  try {
    // Create heading section
    const headingSection = document.createElement('div');
    headingSection.className = 'news-heading-section';
    headingSection.innerHTML = '<h3 class="news-main-heading">Latest news</h3>';
    
    // Add heading to block first
    block.append(headingSection);

    // Create news section block which will handle both filter and content
    const newsSection = buildBlock('news-section', []);
    
    // Add section to block
    block.append(newsSection);
    decorateBlock(newsSection);
    
    // Load block
    await loadBlock(newsSection);
  } catch (error) {
    console.error('Error in news landing decoration:', error);
  }
}
