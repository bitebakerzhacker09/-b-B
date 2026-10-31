/* Shared responsive navigation enhancement powered by jQuery. */
(function ($) {
  'use strict';
  $(function () {
    $('.bb-mobile-toggle').each(function () {
      var $button = $(this);
      var navId = $button.attr('aria-controls');
      var $nav = $('#' + navId);
      if (!$nav.length) return;
      $button.on('click', function () {
        var isOpen = $nav.hasClass('bb-nav-open');
        $nav.toggleClass('bb-nav-open', !isOpen);
        $button.attr('aria-expanded', String(!isOpen));
        $button.attr('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
        $button.find('span[aria-hidden="true"]').text(isOpen ? '☰' : '✕');
      });
      $nav.on('click', 'a', function () {
        if (window.matchMedia('(max-width: 800px)').matches) {
          $nav.removeClass('bb-nav-open');
          $button.attr('aria-expanded', 'false').attr('aria-label', 'Open navigation');
          $button.find('span[aria-hidden="true"]').text('☰');
        }
      });
      $(window).on('resize', function () {
        if (!window.matchMedia('(max-width: 800px)').matches) {
          $nav.removeClass('bb-nav-open');
          $button.attr('aria-expanded', 'false').attr('aria-label', 'Open navigation');
          $button.find('span[aria-hidden="true"]').text('☰');
        }
      });
    });
  });
})(jQuery);

$(function(){$('.menu-card,.deal-card').hide().fadeIn(600);});