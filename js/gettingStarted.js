let os = detectOS()

$( document ).ready(function() {
    clickGetStartedTab(os) //initialized to user's current platform

    $('.gs-copy-btn').click(function() { 
        var step = $(this).attr('id');
        if (step === 'step5') {
            // the code for windows and unix is shared in this case
            copyCodePanel('all-'+step)
        } else if (os === 'windows') copyCodePanel('windows-' + step)
        else copyCodePanel('unix-' + step)
    });

    $('.gs-tab-btn').click(function(){
        var id = $(this).attr('id');
        clickGetStartedTab(id.substring(7))
    })
 });

function clickGetStartedTab(platform) {
    os = platform
    let elems = document.getElementsByClassName(os)

    $('.show').removeClass('show')
    $('.selected').removeClass('selected')

    document.getElementById('gs-btn-' + os).classList.add('selected')
    for (e of elems) {
        e.classList.add('show')
    }

    if (os === 'linux' || os === 'mac') {
        elems = document.getElementsByClassName('unix')
        for (e of elems) {
            e.classList.add('show')
        }
    }
}