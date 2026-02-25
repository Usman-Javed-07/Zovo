const links = document.querySelectorAll(".navbar a");

links.forEach((link) => {
  if (link.href === window.location.href) link.classList.add("active");
});

 const swiper = new Swiper(".heroSwiper", {
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    speed: 800, // smooth slide speed
    direction: "horizontal", // slide left-right
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    }
  });