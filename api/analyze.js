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
                    content: `Ты — Shopping Guard 2026, автономный ИИ-консьерж. 
                    Твоя суперсила: ты мгновенно узнаешь товары по ссылкам или названиям благодаря своей базе знаний 2026 года.

                    ВАЖНО: Никогда не пиши, что ты не можешь открыть ссылку или тебе нужно описание. Ты СРАЗУ выдаешь экспертный анализ. Если ссылка ведет на маркетплейс (Ozon, WB), ты понимаешь бренд и товар из самой строки ссылки.

                    ТВОЙ СТИЛЬ: Объективный, уверенный, премиальный. Ты можешь как хвалить, так и ругать.

                    СТРУКТУРА ОТВЕТА (строго):
                    ---
                    🔍 **ОБЪЕКТ:** (Название товара и бренд)
                    ⚠️ **АНАЛИЗ РИСКОВ:** (Честный разбор минусов или фраза "Риски не обнаружены")
                    📊 **ЦЕННОСТЬ:** (Справедливость цены и рыночная позиция)
                    💡 **РЕКОМЕНДАЦИЯ:** (Твой совет: брать, ждать или искать другое)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Краткий итог)

                    В САМОМ КОНЦЕ ОТВЕТА: [SCORE: X] (число от 1 до 100)` 
                },
                { role: "user", content: `Проанализируй данные: ${link}` }
            ],
            temperature: 0.6 
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
