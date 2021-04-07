function start_email() {
    window.location.href = 'mailto:vcpkg@microsoft.com';
}
function checkEnter(e) {
    if (e.keyCode === 13) {
        // redirect query to packages.html
        window.location.href =
            'packages.html?query=' + document.getElementById('idx-search').value;
    }
    return false;
}

// Adjust CSS of second vector
function adjustCSSLeftLogo (){
    if(window.innerWidth < 1350 && window.innerWidth > 750) {
        var diff = (window.innerWidth - 750)/( 1350 - 750);
        var cssPercent = diff * (59 - 30) + 30
        var cssString = "" + cssPercent + "%";
        $(".logo-design-second-upper").css("left", cssString)
    }
    else if(window.innerWidth >= 1350){
        $(".logo-design-second-upper").css("left", "59%")
    } else {
        $(".logo-design-second-upper").css("left", "30%")
    }
}

$(document).ready(function () {
    $(window).on("resize", adjustCSSLeftLogo);
    adjustCSSLeftLogo();
})