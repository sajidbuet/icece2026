const hamburger = document.getElementById('hamburger');
const navbar = document.querySelector('.navbar');
const dropdowns = document.querySelectorAll('.dropdown');

hamburger.addEventListener('click', () => {
    navbar.classList.toggle('active');
});

dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });
});
