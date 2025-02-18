import { buildBlock, loadBlock, decorateBlock } from '../../scripts/aem.js';


export default async function decorate(block) {
  try {
    const newsLanding = document.createElement('div');
    newsLanding.className = 'news-landing';

    // Create heading section
    const headingSection = document.createElement('div');
    headingSection.className = 'news-heading-section';
    headingSection.innerHTML = '<h3 class="news-main-heading">Latest news</h3>';
    
    // Add heading to block first
    newsLanding.append(headingSection);

    // Create news section block which will handle both filter and content
    const newsSection = buildBlock('news-section', []);
    
    // Add section to block
    newsLanding.append(newsSection);
    decorateBlock(newsSection);

    block.append(newsLanding);
    
    // Load block
    await loadBlock(newsSection);
  } catch (error) {
    console.error('Error in news landing decoration:', error);
  }
}
