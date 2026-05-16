import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { link } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Ты — Shopping Guard, ироничный и опытный эксперт по покупкам. Твоя задача — открыть пользователю глаза на товар, который он хочет купить на маркетплейсе. Пиши просто, понятно, с легким юмором, без занудства и сложных терминов. Общайся как хороший друг, который уберегает от глупых покупок.

                    Выдай ответ строго по этой структуре (используй именно эти эмодзи и заголовки):
                    
                    🔍 **ОБЪЕКТ:** (Напиши, что это за товар, бренд и модель)
                    
                    🛑 **ДЕТЕКТОР ЛЖИ:** (Твое живое мнение о карточке товара. Насколько адекватна цена, не завышена ли она искусственно, стоит ли верить красивым картинкам)
                    
                    📊 **РЕАЛЬНАЯ ЭКОНОМИКА:** (Назови примерную честную цену этому товару в базарный день и сколько пользователь переплачивает за маркетинг)
                    
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Короткий, хлёсткий и понятный совет: брать, бежать мимо или подождать)
                    
                    [SCORE: число от 1 до 100]`
                },
                {
                    role: "user",
                    content: `Разложи по полочкам этот товар: ${link}`
                }
            ],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
