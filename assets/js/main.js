// DataArkus custom JS
document.addEventListener('DOMContentLoaded', () => {
  // Navbar color on scroll
  const nav = document.querySelector('.navbar');
  const onScroll = () => {
    if(window.scrollY > 20) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  };
  onScroll(); window.addEventListener('scroll', onScroll);

  // AOS init
  AOS.init({ once: true });

  // Year
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
});
