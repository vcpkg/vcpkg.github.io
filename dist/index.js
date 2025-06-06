function start_email() {
    window.location.href = 'mailto:vcpkg@microsoft.com';
}
function checkEnter(e) {
    if (e.keyCode === 13) {
        // redirect query to packages.html
        const query = encodeURIComponent(document.getElementById('idx-search').value);
        window.location.href = 'packages.html?query=' + query;
    }
    return false;
}

// Adjust CSS of second vector
function adjustCSSLeftLogo (){
    return;
}