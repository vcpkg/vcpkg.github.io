let os: Platform = detectOS();

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
        clickGetStartedTab(id.split('-')[2] as Platform);
    });
});

function clickGetStartedTab(platform: Platform) {
    os = platform;
    let elems: HTMLCollectionOf<Element> = document.getElementsByClassName(os);
    let e: Element;

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
