// Send text item to background
function sendTextToBackground(text) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action: "classifyText", text: text },
            (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            }
        );
    });
}

// Send text to background with delay to prevent rate limits
async function sendTextsWithDelay(texts) {
    for (let i = 0; i < texts.length; i++) {
        try {
            console.log(`Sending text ${i + 1}/${texts.length}:`, texts[i].slice(0,50), '...');
            const response = await sendTextToBackground(texts[i]);
            console.log('Classified Text:', response.result);
        } catch (error) {
            console.error('Error sending text:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Function to get visible text and send it with delay
function getVisibleTextAsJson() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                return (node.nodeValue.trim().length > 0 && window.getComputedStyle(node.parentNode).visibility !== 'hidden') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        },
        false
    );

    let textEntries = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue.trim();
        if (text.length > 150) {
            textEntries.push(text);
        }
    }
    
    //console.log('Collected Text Entries:', textEntries);
    sendTextsWithDelay(textEntries);
}

getVisibleTextAsJson();
