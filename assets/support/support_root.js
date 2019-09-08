support.showMain = function() {
    var e = document.getElementById('main_area');
    e.innerHTML = "";
    support.getCategories(function(d) {
        e.appendChild(support.renderCategories(d));
    });
}