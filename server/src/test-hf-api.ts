import 'dotenv/config';

async function testHFAPI() {
    const token = process.env.HF_TOKEN;
    console.log('HF_TOKEN exists:', !!token);
    console.log('Token starts with:', token?.substring(0, 10));

    // Try the recommended endpoint from HuggingFace
    const url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

    console.log('\nTesting endpoint:', url);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: ["Hello world"],
                options: {
                    wait_for_model: true,
                },
            }),
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const text = await response.text();
        console.log('Response:', text.substring(0, 200));

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('Success! Got embedding with length:', Array.isArray(data[0]) ? data[0].length : 'N/A');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testHFAPI();
