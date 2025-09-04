// Background service worker for handling tab captures
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureTab') {
        // Capture the visible tab area
        chrome.tabs.captureVisibleTab(sender.tab.windowId, {
            format: 'png',
            quality: 100
        }).then(dataUrl => {
            sendResponse({success: true, dataUrl: dataUrl});
        }).catch(error => {
            console.error('Tab capture failed:', error);
            sendResponse({success: false, error: error.message});
        });
        
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'requestScreenCapture') {
        // For more advanced screen capture scenarios
        chrome.desktopCapture.chooseDesktopMedia(
            ['screen', 'window', 'tab'],
            sender.tab,
            (streamId) => {
                if (streamId) {
                    sendResponse({success: true, streamId: streamId});
                } else {
                    sendResponse({success: false, error: 'User cancelled screen capture'});
                }
            }
        );
        
        return true;
    }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Face Symmetry Tool installed');
});