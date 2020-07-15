var os = detectOS();
$(document).ready(function () {
    clickGetStartedTab(os); //initialized to user's current platform
    $('.gs-copy-btn').click(function () {
        var step = $(this).attr('id');
        if (step === 'step5') {
            // the code for windows and unix is shared in this case
            copyCodePanel('all-' + step);
        } else if (os === 'windows') copyCodePanel('windows-' + step);
        else copyCodePanel('unix-' + step);
    });
    $('.gs-tab-btn').click(function () {
        var id = $(this).attr('id');
        clickGetStartedTab(id.substring(7));
    });
});
function clickGetStartedTab(platform) {
    os = platform;
    var elems = document.getElementsByClassName(os);
    var e;
    $('.show').removeClass('show');
    $('.selected').removeClass('selected');
    document.getElementById('gs-btn-' + os).classList.add('selected');
    for (var _i = 0, elems_1 = elems; _i < elems_1.length; _i++) {
        e = elems_1[_i];
        e.classList.add('show');
    }
    if (os === 'linux' || os === 'mac') {
        elems = document.getElementsByClassName('unix');
        for (var _a = 0, elems_2 = elems; _a < elems_2.length; _a++) {
            e = elems_2[_a];
            e.classList.add('show');
        }
    }
}
