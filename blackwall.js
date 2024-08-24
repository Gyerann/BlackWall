const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

// Function to extract visible text from the page and return it as a JSON array
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
        if (text.length > 50) {
            textEntries.push({ text: text });
        }
    }
    
    return textEntries;
}

// Function to classify text as AI or human
async function classifyText(inputJson) {
    try {
        console.log('Classifying data...');
        const texts = inputJson.map(entry => entry.text);

        const response = await fetch('https://api-inference.huggingface.co/models/yuchuantian/AIGC_detector_env1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer YOUR_API_KEY_HERE`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: texts }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        console.log('Results:', results);

        const outputJson = inputJson.map((entry, index) => {
            const scores = results[index];
            let label_1_score = 0;
            let label_0_score = 0;

            scores.forEach(scoreObj => {
                if (scoreObj.label === 'LABEL_1') {
                    label_1_score = scoreObj.score * 100;
                } else if (scoreObj.label === 'LABEL_0') {
                    label_0_score = scoreObj.score * 100;
                }
            });

            return {
                text: entry.text,
                isHuman: label_1_score > 80 ? 0 : (label_0_score > 80 ? 1 : -1)
            };
        });

        return outputJson;
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const textsJson = getVisibleTextAsJson();

if (textsJson.length > 0) {
    classifyText(textsJson)
        .then(outputJson => {
            console.log('Classified Texts:', outputJson);
        })
        .catch(error => {
            console.error('Error classifying texts:', error);
        });
} else {
    console.log('No text entries to classify.');
}
