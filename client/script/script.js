// Active nav link highlight
const links = document.querySelectorAll(".navbar a");
links.forEach((link) => {
    if (link.href === window.location.href) link.classList.add("active");
});

// Hero swiper (only on pages that have it)
if (typeof Swiper !== "undefined" && document.querySelector(".heroSwiper")) {
    new Swiper(".heroSwiper", {
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        speed: 800,
        direction: "horizontal",
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
    });
}
