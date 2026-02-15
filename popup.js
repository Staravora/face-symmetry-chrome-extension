document.addEventListener('DOMContentLoaded', function() {
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const status = document.getElementById('status');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsArrow = document.getElementById('settingsArrow');
    const settingsBody = document.getElementById('settingsBody');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const keyStatus = document.getElementById('keyStatus');

    // Settings toggle
    settingsToggle.addEventListener('click', function() {
        const isOpen = settingsBody.classList.toggle('open');
        settingsArrow.classList.toggle('open', isOpen);
    });

    // Load existing API key status
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
        if (result.geminiApiKey) {
            const last4 = result.geminiApiKey.slice(-4);
            keyStatus.textContent = `API key saved (\u2022\u2022\u2022\u2022${last4})`;
            keyStatus.classList.add('saved');
        }
    });

    // Save API key
    saveKeyBtn.addEventListener('click', function() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            keyStatus.textContent = 'Please enter an API key';
            keyStatus.classList.remove('saved');
            return;
        }
        chrome.storage.sync.set({geminiApiKey: key}, function() {
            const last4 = key.slice(-4);
            keyStatus.textContent = `API key saved (\u2022\u2022\u2022\u2022${last4})`;
            keyStatus.classList.add('saved');
            apiKeyInput.value = '';
        });
    });

    // Check if we're on a supported page
    function checkPageSupport() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            const url = currentTab.url;

            // Check for special pages that extensions can't access
            if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
                url.startsWith('moz-extension://') || url.startsWith('about:')) {
                status.textContent = 'Extension pages not supported';
                status.style.color = '#ef4444';
                activateBtn.disabled = true;
                deactivateBtn.disabled = true;
                return;
            }

            // Check if it's YouTube or other video site
            const isVideoSite = url.includes('youtube.com') || url.includes('netflix.com') ||
                               url.includes('hulu.com') || url.includes('twitch.tv');

            if (isVideoSite) {
                status.innerHTML = 'Video site detected<br>Tab capture enabled';
                status.style.color = '#3b82f6';
            }

            // Check current tool status
            chrome.tabs.sendMessage(currentTab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Click to activate (reload if needed)';
                    status.style.color = '#9ca3af';
                } else if (response && response.active) {
                    status.textContent = 'Tool is active';
                    status.style.color = '#22c55e';
                } else {
                    if (!isVideoSite) {
                        status.textContent = 'Tool is inactive';
                        status.style.color = '#9ca3af';
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
                    status.style.color = '#ef4444';
                } else {
                    status.textContent = 'Tool activated';
                    status.style.color = '#22c55e';

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
                    status.style.color = '#ef4444';
                } else {
                    status.textContent = 'Tool deactivated';
                    status.style.color = '#9ca3af';
                }
            });
        });
    });
});
