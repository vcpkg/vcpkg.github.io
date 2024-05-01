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
        dependencyCards[i].style.display = 'block';
    }

    // Function to load more dependency cards
    // Function currently displays all cards
    function showAllDependencies() {
        for (let i = 10; i < dependencyCards.length; i++) {
            dependencyCards[i].style.display = 'block';
        }
        loadMoreButton.style.display = 'none'; // Hide button after showing all cards
    }

    // Event listener for the button
    loadMoreButton.addEventListener('click', showAllDependencies);
});
