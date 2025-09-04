document.addEventListener('DOMContentLoaded', function() {
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const status = document.getElementById('status');
    
    // Check if we're on a supported page
    function checkPageSupport() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            const url = currentTab.url;
            
            // Check for special pages that extensions can't access
            if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
                url.startsWith('moz-extension://') || url.startsWith('about:')) {
                status.textContent = 'Extension pages not supported';
                status.style.color = '#f44336';
                activateBtn.disabled = true;
                deactivateBtn.disabled = true;
                return;
            }
            
            // Check if it's YouTube or other video site
            const isVideoSite = url.includes('youtube.com') || url.includes('netflix.com') || 
                               url.includes('hulu.com') || url.includes('twitch.tv');
            
            if (isVideoSite) {
                status.innerHTML = 'Video site detected<br>Tab capture enabled';
                status.style.color = '#2196F3';
            }
            
            // Check current tool status
            chrome.tabs.sendMessage(currentTab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Click to activate (reload if needed)';
                    status.style.color = '#666';
                } else if (response && response.active) {
                    status.textContent = 'Tool is active';
                    status.style.color = '#4CAF50';
                } else {
                    if (!isVideoSite) {
                        status.textContent = 'Tool is inactive';
                        status.style.color = '#666';
                    }
                }
            });
        });
    }
    
    // Initial check
    checkPageSupport();
    
    activateBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'activate'}, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Error: Try refreshing the page';
                    status.style.color = '#f44336';
                } else {
                    status.textContent = 'Tool activated';
                    status.style.color = '#4CAF50';
                    
                    // Close popup after activation on mobile-like environments
                    setTimeout(() => {
                        if (window.innerWidth < 500) {
                            window.close();
                        }
                    }, 1000);
                }
            });
        });
    });
    
    deactivateBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'deactivate'}, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Error: Try refreshing the page';
                    status.style.color = '#f44336';
                } else {
                    status.textContent = 'Tool deactivated';
                    status.style.color = '#666';
                }
            });
        });
    });
    
    // Add keyboard shortcut info
    const instructionsDiv = document.querySelector('div[style*="margin-top: 15px"]');
    if (instructionsDiv) {
        instructionsDiv.innerHTML += '<br><br><strong>Tips:</strong><br>• Works on YouTube videos<br>• Press Esc to close tool<br>• Drag red line to adjust center';
    }
});