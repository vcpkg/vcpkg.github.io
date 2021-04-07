var os = detectOS();
$(document).ready(function () {
    clickGetStartedTab(os); //initialized to user's current platform
    $('.gs-tab-btn').click(function () {
        var id = $(this).attr('id');
        clickGetStartedTab(id.split('-')[2]);
    });

    var res = getUrlParameter('platform');
    if(res != '') {
        if(res === 'mac' || res === 'linux' || res === 'windows') {
            clickGetStartedTab(res);
        }
    }
});
function clickGetStartedTab(platform) {
    os = platform;
    var elems = document.getElementsByClassName(os);
    var e;
    $('.show').removeClass('show');
    $('.selected').removeClass('selected');
    document.getElementById('gs-btn-' + os).classList.add('selected');
    for (var i = 0; i < elems.length; i++) {
        e = elems[i];
        e.classList.add('show');
    }
    if (os === 'linux' || os === 'mac') {
        elems = document.getElementsByClassName('unix');
        for (var i = 0; i < elems.length; i++) {
            e = elems[i];
            e.classList.add('show');
        }
    }
}
