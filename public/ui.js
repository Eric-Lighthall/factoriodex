document.querySelectorAll('.dropdown-toggle').forEach(function(dropdownToggle) {
    dropdownToggle.addEventListener('click', function(event) {
        event.preventDefault();
        var dropdown = this.parentNode;
        dropdown.classList.toggle('active');
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    const offsetTop = sidebar.offsetTop;

    function handleScroll() {
        if (window.pageYOffset > offsetTop) {
            sidebar.style.position = 'fixed';
            sidebar.style.top = '0';
        } else {
            sidebar.style.position = 'static';
        }
    }

    window.addEventListener('scroll', handleScroll);
});