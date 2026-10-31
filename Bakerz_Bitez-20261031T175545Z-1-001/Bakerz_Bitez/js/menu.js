$(function () {
  const $items = $('.menu-item, .cafe-item');
  const $foodSection = $('#food-menu');
  const $cafeSection = $('#cafe-menu');
  let activeFilter = 'all';

  function filterMenu() {
    const query = String($('#menuSearch').val() || '').toLowerCase().trim();
    let visibleFood = 0;
    let visibleCafe = 0;

    $items.each(function () {
      const $item = $(this);
      const categories = String($item.attr('data-category') || '').toLowerCase().split(/\s+/);
      const searchable = (String($item.attr('data-name') || '') + ' ' + $item.text()).toLowerCase();
      const isDrink = categories.includes('drinks');
      const categoryMatch = activeFilter === 'all' ||
        (activeFilter === 'drinks' ? isDrink : categories.includes(activeFilter));
      const searchMatch = !query || searchable.includes(query);
      const show = categoryMatch && searchMatch;

      $item.toggle(show);
      if (show && $item.hasClass('menu-item')) visibleFood++;
      if (show && $item.hasClass('cafe-item')) visibleCafe++;
    });

    // Keep each section tidy when the user filters to only one menu.
    $foodSection.toggle(visibleFood > 0 || (activeFilter === 'all' && !query));
    $cafeSection.toggle(visibleCafe > 0 || (activeFilter === 'all' && !query));

    const total = visibleFood + visibleCafe;
    $('#resultsCount').text('Showing ' + total + ' menu ' + (total === 1 ? 'item' : 'items'));
    $('#noResults').toggleClass('d-none', total > 0);
  }

  $('.filter-btn').on('click', function () {
    $('.filter-btn').removeClass('active').attr('aria-pressed', 'false');
    $(this).addClass('active').attr('aria-pressed', 'true');
    activeFilter = String($(this).data('filter') || 'all');
    filterMenu();

    if (activeFilter === 'cafe' || activeFilter === 'drinks') {
      $cafeSection[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeFilter !== 'all') {
      $foodSection[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  $('#menuSearch').on('input', filterMenu);

  // Lazy-load menu photos to reduce mobile data use.
  $('img').each(function () { if (!this.hasAttribute('loading')) this.setAttribute('loading', 'lazy'); });

  // A failed remote image should not leave a broken-image icon in the menu.
  $('img').on('error', function () {
    if (this.dataset.fallbackApplied) return;
    this.dataset.fallbackApplied = 'true';
    this.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#cfe3d3"/><text x="400" y="235" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="#2c4838">Bakerz &amp; Bitez</text><text x="400" y="290" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" fill="#2c4838">Freshly made with love</text></svg>'
    );
  });

  $('.filter-btn').attr('aria-pressed', 'false');
  $('.filter-btn.active').attr('aria-pressed', 'true');
  filterMenu();
});
