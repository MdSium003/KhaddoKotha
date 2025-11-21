
function parseReceiptText(text: string): {
    items: Array<{ name: string; quantity?: number; expiration?: string; confidence: number }>;
} {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const items: Array<{ name: string; quantity?: number; expiration?: string; confidence: number }> = [];

    for (const line of lines) {
        console.log("Processing line:", line);
        // Check for specific "Item Name ... Quantity ... Expiration ..." format
        // Adjusted regex to be more flexible with whitespace and potential OCR quirks
        const customMatch = line.match(/Item\s*Name\s+(.+?)\s+Quantity\s+(\d+(?:\.\d+)?)\s+Expiration\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);

        if (customMatch) {
            console.log("Match found:", customMatch);
            items.push({
                name: customMatch[1].trim(),
                quantity: parseFloat(customMatch[2]),
                expiration: customMatch[3],
                confidence: 0.95
            });
            continue;
        } else {
            console.log("No match for regex");
        }
    }

    return {
        items: items.slice(0, 20),
    };
}

const testText = `Item Name Apples Quantity 3 Expiration 05/24/2024 Notes Keep in refrigerator Checked..`;

console.log("Testing OCR Parsing for Custom Format...");
const result = parseReceiptText(testText);
console.log("Items found:", JSON.stringify(result.items, null, 2));
