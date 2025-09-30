const swiper = new Swiper(".swiper", {
  loop : true,
  pagination: {
    el: ".swiper-pagonation",
    clickable: true,
  },
  autoplay: {
    delay: 1000,
    disableOnInteraction: false,
  },
})