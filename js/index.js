function start_email() {
    window.location.href = 'mailto:vcpkg@microsoft.com'
}

function checkEnter(e) {
    if (e.keyCode === 13) {
        // redirect query to packages.html
        window.location.href =
            'packages.html?query=' + document.getElementById('idx-search').value
    }
    return false
}
