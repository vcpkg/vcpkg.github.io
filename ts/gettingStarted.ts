let os: Platform = detectOS();

$(document).ready(function () {
    clickGetStartedTab(os); //initialized to user's current platform

    $('.gs-copy-btn').click(function () {
        var step = $(this).attr('id');
        if (os === 'windows') copyCodePanel('windows-' + step);
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

$(document).ready(function () {
    $('#step1').mouseover(function () {
        $('#tip-text1').css('display', 'inline');
        $('#tip-text1').css('margin-right', '10px');
    });
});

$(document).ready(function () {
    $('#step1').mouseout(function () {
        $('#tip-text1').css('display', 'none');
    });
});

$(document).ready(function () {
    $('#step2').mouseover(function () {
        $('#tip-text2').css('display', 'inline');
        $('#tip-text2').css('margin-right', '10px');
    });
});

$(document).ready(function () {
    $('#step2').mouseout(function () {
        $('#tip-text2').css('display', 'none');
    });
});

$(document).ready(function () {
    $('#step3').mouseover(function () {
        $('#tip-text3').css('display', 'inline');
        $('#tip-text3').css('margin-right', '10px');
    });
});

$(document).ready(function () {
    $('#step3').mouseout(function () {
        $('#tip-text3').css('display', 'none');
    });
});

$(document).ready(function () {
    $('#step4').mouseover(function () {
        $('#tip-text4').css('display', 'inline');
        $('#tip-text4').css('margin-right', '10px');
    });
});

$(document).ready(function () {
    $('#step4').mouseout(function () {
        $('#tip-text4').css('display', 'none');
    });
});

$(document).ready(function () {
    $('#step5').mouseover(function () {
        $('#tip-text5').css('display', 'inline');
        $('#tip-text5').css('margin-right', '10px');
    });
});

$(document).ready(function () {
    $('#step5').mouseout(function () {
        $('#tip-text5').css('display', 'none');
    });
});
