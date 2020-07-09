function copyCodePanel(id) {
    let temp = document.getElementById(id)
    temp.value = temp.textContent
    temp.select()
    document.execCommand('copy')
    clearSelection()
}

// remove the highlight from selected text
function clearSelection() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges()
    } else if (document.selection) {
        document.selection.empty()
    }
}

// determine what OS the user is on, used to render corresponding package installation code
// default to Unix unless the user is on a Windows device
function detectOS() {
    if (/Win/.test(navigator.platform)) {
        return 'windows'
    }
    return 'unix'
}
