type Platform = 'windows' | 'mac' | 'linux';

//get the prefix for language
let lang = 'en'; //Since there is only one language, set all visitors to english
// let lang = navigator.language.substring(0, 2); // TODO: use this later to gets the user's actual current language

function copyCodePanel(id) {
  let temp: HTMLInputElement = document.getElementById(id) as HTMLInputElement;
  temp.select();
  document.execCommand('copy');
  clearSelection();
}

// remove the highlight from selected text
function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

// determine what OS the user is on, used to render corresponding package installation code
// default to Unix unless the user is on a Windows device
function detectOS(): Platform {
  if (/Win/.test(navigator.platform)) {
    return 'windows';
  }
  if (/Mac/.test(navigator.platform)) {
    return 'mac';
  }
  return 'linux';
}
