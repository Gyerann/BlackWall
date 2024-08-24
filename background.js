// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "classifyText") {
        classifyText(request.texts)
            .then(outputJson => {
                sendResponse({ result: outputJson });
            })
            .catch(error => {
                console.error('Error classifying texts:', error);
                sendResponse({ result: [] });
            });
        console.log('Page text fetched succesfully.');
        return true;
    }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function classifyText(texts) {
    const classifySingleText = async (text) => {
        try {
            console.log(`Classifying text: ${text}`);
            const response = await fetch('https://api-inference.huggingface.co/models/yuchuantian/AIGC_detector_env1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer YOUR_API_KEY_HERE`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: [text] }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();
            console.log('Results:', results);

            const scores = results[0];
            let label_1_score = 0;
            let label_0_score = 0;

            scores.forEach(scoreObj => {
                if (scoreObj.label === 'LABEL_1') {
                    label_1_score = scoreObj.score * 100;
                } else if (scoreObj.label === 'LABEL_0') {
                    label_0_score = scoreObj.score * 100;
                }
            });

            const isHuman = label_1_score > 80 ? 0 : (label_0_score > 80 ? 1 : -1);
            const likelihood = isHuman >= 0 ? (label_1_score > 80 ? label_1_score : label_0_score) : -1;

            // Log the result for the single text
            console.log({
                text: text,
                isHuman: isHuman,
                likelihood: likelihood
            });

            return {
                text: text,
                isHuman: isHuman,
                likelihood: likelihood
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                text: text,
                error: error.message
            };
        }
    };

    const results = [];
    for (const text of texts) {
        const result = await classifySingleText(text);
        results.push(result);
        await delay(200); // Wait for 200ms between requests
    }

    return results;
}