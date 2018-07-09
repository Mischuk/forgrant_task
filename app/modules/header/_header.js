function headerState() {
    var header = document.querySelector('.header');

    window.onscroll = function() {
        if (window.pageYOffset > 80) {
            header.classList.add('is-small');
        } else {
            header.classList.remove('is-small');
        }
    }
}

headerState();
