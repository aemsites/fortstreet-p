export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`aicolumns-bbpzwi-1102402209-${cols.length}-cols`);

  // setup image aicolumns-bbpzwi-1102402209
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('aicolumns-bbpzwi-1102402209-img-col');
        }
      }
    });
  });
}
