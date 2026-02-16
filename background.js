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
    
    if (message.action === 'geminiAnalyze') {
        const { apiKey, base64, prompt } = message;

        fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inline_data: { mime_type: 'image/png', data: base64 } },
                            { text: prompt }
                        ]
                    }],
                    safetySettings: [
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
                    ]
                })
            }
        ).then(async (response) => {
            if (!response.ok) {
                if (response.status === 429) {
                    sendResponse({ success: false, error: 'RATE_LIMIT' });
                    return;
                }
                const errorBody = await response.text();
                console.error('Gemini API error:', response.status, errorBody);
                sendResponse({ success: false, error: 'API_ERROR', details: `${response.status}: ${errorBody}` });
                return;
            }

            const data = await response.json();

            // Check for empty candidates or safety blocks
            if (!data.candidates || data.candidates.length === 0) {
                const reason = data.promptFeedback?.blockReason || 'unknown';
                console.warn('Gemini returned no candidates. Block reason:', reason);
                sendResponse({ success: false, error: 'SAFETY_BLOCKED', details: reason });
                return;
            }

            const candidate = data.candidates[0];
            if (candidate.finishReason === 'SAFETY' || !candidate.content) {
                const ratings = candidate.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'none';
                console.warn('Gemini response blocked by safety filter. Ratings:', ratings);
                sendResponse({ success: false, error: 'SAFETY_BLOCKED', details: ratings });
                return;
            }

            const text = candidate.content?.parts?.[0]?.text;
            if (!text) {
                console.warn('Gemini response missing text content:', JSON.stringify(data));
                sendResponse({ success: false, error: 'API_ERROR', details: 'Response contained no text' });
                return;
            }

            sendResponse({ success: true, text });
        }).catch(error => {
            console.error('Gemini fetch failed:', error);
            sendResponse({ success: false, error: 'API_ERROR', details: error.message });
        });

        return true;
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
    console.log('Phisognomous installed');
});