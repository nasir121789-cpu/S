export default async function handler(req, res) {
    // CORS Headers সেট করা
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-bot-token');

    // Preflight OPTIONS Request Handle
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Query Parameter অথবা Header থেকে Token এবং Method গ্রহণ
        const token = req.headers['x-bot-token'] || req.query.token;
        const method = req.query.method;

        if (!token || !method) {
            return res.status(400).json({ ok: false, error: 'Missing token or method query parameter' });
        }

        // Request Body Buffer-এ রূপান্তর
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';

        // Telegram API Request Headers (Real Browser User-Agent ব্লক হওয়া রোধ করে)
        const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        };

        if (contentType) {
            fetchHeaders['Content-Type'] = contentType;
        }

        // Telegram Server-এ Request পাঠানো
        const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: req.method,
            headers: fetchHeaders,
            body: body.length > 0 ? body : undefined,
        });

        const data = await response.text();
        res.setHeader('Content-Type', 'application/json');
        res.status(response.status).send(data);

    } catch (error) {
        res.status(500).json({ ok: false, error: 'Telegram proxy failed: ' + error.message });
    }
}

// Multipart / File upload সঠিকভাবে কাজ করার জন্য Vercel BodyParser নিষ্ক্রিয়করণ
export const config = {
    api: {
        bodyParser: false,
    },
};
