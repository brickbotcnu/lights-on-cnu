const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');

nav.style.display = 'none';
hamburger.onclick = () => {
    nav.style.display = nav.style.display == 'none' ? 'grid' : 'none';
};
