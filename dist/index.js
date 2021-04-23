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
    if(window.innerWidth < 1500 && window.innerWidth > 670) {
        var diff = (window.innerWidth - 670)/( 1500 - 670);
        var cssPercent = diff * (59 - 20) + 20
        var cssString = "" + cssPercent + "%";
        $(".logo-design-second-upper").css("left", cssString)
    }
    else if(window.innerWidth >= 1500){
        $(".logo-design-second-upper").css("left", "59%")
    } else {
        $(".logo-design-second-upper").css("left")
    }
}



$(document).ready(function () {
    $(window).on("resize", adjustCSSLeftLogo);
    adjustCSSLeftLogo();
})