document.addEventListener('DOMContentLoaded', function () {
    const dependencyCards = document.querySelectorAll('.dependency-card');
    const loadMoreButton = document.getElementById('expandButton');
    let displayLimit = 10;

    // Initially, hide the button if 10 or fewer cards are present
    if (dependencyCards.length <= displayLimit) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
    }

    // Initially display the first set of dependency cards
    for (let i = 0; i < Math.min(displayLimit, dependencyCards.length); i++) {
        dependencyCards[i].style.display = 'flex';
    }

    // Function to load more dependency cards
    // Function currently displays all cards
    function showAllDependencies() {
        for (let i = 10; i < dependencyCards.length; i++) {
            dependencyCards[i].style.display = 'flex';
        }
        loadMoreButton.style.display = 'none'; // Hide button after showing all cards
    }

    // Event listener for the button
    loadMoreButton.addEventListener('click', showAllDependencies);

     // Handling tabs
     var tabs = document.querySelectorAll('.tab');
     var tabContents = document.querySelectorAll('.tab-content');
 
     tabs.forEach(function(tab) {
         tab.addEventListener('click', function() {
             var target = this.getAttribute('data-target');
 
             // Remove active class from all tabs
             tabs.forEach(function(t) {
                 t.classList.remove('active-tab');
             });
             // Add active class to clicked tab
             this.classList.add('active-tab');
 
             // Hide all tab contents
             tabContents.forEach(function(tc) {
                 tc.style.display = 'none';
             });
             // Show current tab content
             document.getElementById(target).style.display = 'block';
         });
     });
 
     // Optionally activate the first tab by default
     if (tabs.length > 0) {
         tabs[0].click();
     }
});
