import { a, li, ul } from '../../scripts/dom-helpers.js';
import { fetchIndex } from '../../scripts/scripts.js';

function buildHierarchy(paths, currentPath) {
  const tree = {};

  // Get the current path parts and level
  const currentParts = currentPath.split('/').filter(Boolean);
  const currentLevel = currentParts.length;

  // Get the parent path
  const parentPath = currentLevel > 1 ? `/${currentParts.slice(0, -1).join('/')}` : '/';

  // Helper function to check if parent exists
  function hasParentPath(path) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) return true;

    const parentPathTemp = `/${parts.slice(0, -1).join('/')}`;
    return paths.some((p) => p.path === parentPathTemp);
  }

  // Filter paths based on level
  const relevantPaths = paths.filter((item) => {
    if (!hasParentPath(item.path)) return false;
    if (item.path === parentPath) return false;

    const itemParts = item.path.split('/').filter(Boolean);
    const itemLevel = itemParts.length;

    if (currentLevel === 1) {
      // For root level, include all root paths
      return itemLevel === 1;
    }
    const isSibling = itemLevel === currentLevel && item.path.startsWith(parentPath);
    const isChild = itemLevel === currentLevel + 1 && item.path.startsWith(parentPath);
    return isSibling || isChild;
  });

  function insertPath(item) {
    const { path } = item;
    const pathData = paths.find((p) => p.path === path);
    if (pathData) {
      // Only add to root level of tree if it's a sibling
      const parts = path.split('/').filter(Boolean);
      if (parts.length === currentLevel) {
        tree[path] = {
          path,
          title: pathData.title,
          description: pathData.description,
          'breadcrumb-title': pathData['breadcrumb-title'],
          child: {},
        };

        // Add children for this path
        const children = paths.filter((p) => {
          const childParts = p.path.split('/').filter(Boolean);
          const parentParts = path.split('/').filter(Boolean);
          return childParts.length === parentParts.length + 1 && p.path.startsWith(path);
        });

        children.forEach((child) => {
          tree[path].child[child.path] = {
            path: child.path,
            title: child.title,
            description: child.description,
            'breadcrumb-title': child['breadcrumb-title'],
          };
        });
      }
    }
  }

  function transformToArray(node) {
    if (!node) return [];
    return Object.values(node).map((item) => ({
      ...item,
      child: Object.keys(item.child || {}).length
        ? transformToArray(item.child)
        : undefined,
    }));
  }

  relevantPaths.forEach(insertPath);
  const result = transformToArray(tree);

  // Add parent path at the beginning
  if (currentLevel >= 1) {
    const parentPathData = paths.find((p) => p.path === parentPath);
    if (parentPathData) {
      return [{
        ...parentPathData,
        child: undefined,
      }, ...result];
    }
  } else {
    return [{
      path: '/',
      title: 'Home',
      'breadcrumb-title': 'Home',
      child: undefined,
    }, ...result];
  }

  return result;
}

export default async function decorate(block) {
  const index = await fetchIndex('query-index');
  const hierarchy = buildHierarchy(index.data, window.location.pathname);
  const firtLevelUl = ul({ class: 'first-level-ul' });

  hierarchy.forEach((item) => {
    let firstLevelLi;
    if (item.child?.length) {
      firstLevelLi = li(
        {
          class: `first-level-li has-children${item.path === window.location.pathname ? ' selected' : ''}`,
        },
        a({ href: item.path }, item['breadcrumb-title']),
        a({ class: 'expand-collapse', href: '#' }, '+'),
      );

      const innerUl = ul({ class: 'second-level-ul collapsed' });

      if (firstLevelLi.classList.contains('selected')) {
        firstLevelLi.classList.add('expanded');
        innerUl?.classList.toggle('collapsed');
      }

      item.child.forEach((child) => {
        innerUl.appendChild(li(
          { class: 'second-level-li' },
          a({ href: child.path }, child['breadcrumb-title']),
        ));
      });

      firstLevelLi.appendChild(innerUl);

      // Add click event listener for expand/collapse
      firstLevelLi.querySelector('.expand-collapse').addEventListener('click', (e) => {
        e.preventDefault();
        firstLevelLi.classList.toggle('expanded');
        const button = e.target;
        const tempUl = button.parentElement.querySelector('.second-level-ul');
        tempUl.classList.toggle('collapsed');
        button.textContent = tempUl.classList.contains('collapsed') ? '+' : '+';
      });
    } else {
      firstLevelLi = li(
        {
          class: `first-level-li no-child${item.path === window.location.pathname ? ' selected' : ''}`,
        },
        a({ href: item.path }, item.path === '/' ? 'Home' : item['breadcrumb-title']),
      );
    }

    firtLevelUl.appendChild(firstLevelLi);
  });

  block.replaceChildren(firtLevelUl);
}
