document.addEventListener('DOMContentLoaded', function () {
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
