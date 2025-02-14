export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`aicolumns-su539l-box-id-1018029406-${cols.length}-cols`);

  // setup image aicolumns-su539l-box-id-1018029406
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('aicolumns-su539l-box-id-1018029406-img-col');
        }
      }
    });
  });
}
