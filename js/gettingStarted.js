let os = detectOS()
window.onload = init

function init() {
    clickGetStartedTab(os) //initialized to user's current platform
}

function clickGetStartedTab(platform) {
    os = platform
    let elems = document.getElementsByClassName(os)

    $('.show').removeClass('show')
    $('.selected').removeClass('selected')

    document.getElementById(os + '-gs-btn').classList.add('selected')
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

function copyGSCode(step) {
    if (step === 'step5') {
        // the code for windows and unix is shared in this case
        copyCodePanel(step)
    } else if (os === 'windows') copyCodePanel('windows-' + step)
    else copyCodePanel('unix-' + step)
}
