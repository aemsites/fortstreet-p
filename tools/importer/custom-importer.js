/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */
function setMetadata(meta, document, url) {
  const date = document.querySelector('.news-article-date');
  if (date) {
    const parsedDate = new Date(date.textContent);
    const utcDate = new Date(Date.UTC(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      0,
      0,
      0,
      0,
    ));
    meta['publication-date'] = utcDate.toISOString();
    date.remove();
  }

  delete meta['og:title'];
  delete meta['og:description'];

  const breadcrumbTitle = document.querySelector('.sws-content-header h1');
  if (breadcrumbTitle) {
    meta['breadcrumb-title'] = breadcrumbTitle.textContent;
  }

  const fromTheDepartment = document.querySelector('.from-the-department');
  if (fromTheDepartment) {
    meta['from-the-department'] = true;
  }

  const urlObj = new URL(url);
  const pathname = urlObj?.pathname;

  if (pathname) {
    if (pathname.startsWith('/news') && !pathname.startsWith('/newsletter')) {
      const isNewsLanding = document.querySelector('.news-list');
      if (isNewsLanding) {
        meta.template = 'news-landing';
      } else {
        meta.template = 'news-article';
      }
      isNewsLanding?.remove();
    } else if (pathname.startsWith('/about-our-school')
      || pathname.startsWith('/supporting-our-student')
      || pathname.startsWith('/learning-at-our-school')
      || pathname.startsWith('/for-parents')) {
      meta.template = 'side-nav';
    } else if (pathname.startsWith('/contact-us')) {
      meta.template = 'contact-us';
    }
  }

  document.querySelector('.sws-content-header')?.remove();

  const img = document.querySelector('[property="og:image:url"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content.replaceAll('https://fortstreet-p.schools.nsw.gov.au', '');
    meta.Image = el;
  }
}

const addCarouselItems = (main) => {
  const cells = [['Carousel']];
  const imgs = main.querySelectorAll('.carousel-with-thumbnail-parent img');
  if (imgs?.length) {
    imgs.forEach((img) => {
      const cell = [img.outerHTML];
      cells.push(cell);
    });

    const table = WebImporter.DOMUtils.createTable(cells, document);
    const carouselSlider = main.querySelector('.carousel');

    if (carouselSlider) {
      carouselSlider.replaceWith(table);
    }
  }
};

const addVideo = (main) => {
  const videos = main.querySelectorAll('.video');
  if (videos?.length) {
    videos.forEach((video) => {
      const cells = [['Video']];
      const iframeSrc = video?.querySelector('iframe')?.src;
      if (iframeSrc) {
        cells.push([iframeSrc]);
        const table = WebImporter.DOMUtils.createTable(cells, document);
        video.replaceWith(table);
      }
    });
  }
};

export default {
  /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @returns {HTMLElement} The root element to be transformed
     */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    WebImporter.DOMUtils.remove(document, [
      'script[src*="https://solutions.invocacdn.com/js/invoca-latest.min.js"]',
    ]);

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
      'noscript',
      'script',
      '#globalheader',
      '.sws-global-quicklinks',
      '.sws-news-article-wrapper-sidebar',
      '.local-footer',
      '.local-footer-message',
      '.gef-global-footer',
      '.gef-copyright-print',
      '#goog-gt-tt',
      '.sws-content__side-nav',
      '#backtotop',
    ]);

    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document, url);

    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    addCarouselItems(main);
    addVideo(main);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    return main;
  },

  /**
     * Return a path that describes the document being transformed (file name, nesting...).
     * The path is then used to create the corresponding Word document.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @return {string} The path
     */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    let p = new URL(url).pathname;
    if (p.endsWith('/')) {
      p = `${p}index`;
    }

    return decodeURIComponent(p)
      .toLowerCase()
      .replace(/\.html$/, '')
      .replace(/[^a-z0-9/]/gm, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  },
};
