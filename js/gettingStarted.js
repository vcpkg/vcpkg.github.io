function clickGetStartedTab(platform){
    // let installCode = document.getElementById('install-code')
    // installCode.setAttribute('readonly', false)
    // let windowsTab = document.getElementById('windows-tab')
    // let unixTab = document.getElementById('unix-tab')
    
    let elems = document.getElementsByClassName(platform)

    $(".show").removeClass("show")
    $(".selected").removeClass("selected")
    
    console.log(platform+"-gs-btn")
    document.getElementById(platform+"-gs-btn").classList.add('selected')
    for (e of elems){
        e.classList.add('show')
    }

    if (platform === "linux" || platform === "mac"){
        elems = document.getElementsByClassName('unix')
        for (e of elems){
            e.classList.add('show')
        }
    }
}