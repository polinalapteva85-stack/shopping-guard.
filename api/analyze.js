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
                    content: `Ты — Shopping Guard 2026. Твоя оценка должна быть ЕДИНОЙ.
                    
                    ПРАВИЛО СИНХРОНИЗАЦИИ:
                    Если ты ставишь высокий балл риска (SCORE > 70), твой текст ДОЛЖЕН быть критическим. Не хвали товар, если считаешь покупку ошибкой.
                    
                    КРИТЕРИИ:
                    - [SCORE 1-30]: Хвали, подтверждай качество и цену. (Итог: ✅ ОДОБРЕНО)
                    - [SCORE 31-70]: Будь осторожен, укажи на конкретные минусы. (Итог: ⚠️ СОМНИТЕЛЬНО)
                    - [SCORE 71-100]: Отговаривай! Найди причины, почему это плохая трата денег (переплата, плохие отзывы, непрактичность). (Итог: ❌ ОТКАЗАТЬСЯ)

                    СТРУКТУРА:
                    🔍 **ОБЪЕКТ:** (Бренд и товар)
                    ⚠️ **АНАЛИЗ РИСКОВ:** (Будь конкретным!)
                    📊 **ЦЕННОСТЬ:** (Реальная польза vs Цена)
                    💡 **РЕКОМЕНДАЦИЯ:** (Четкий совет без "воды")
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Соответствующий баллу)

                    В КОНЦЕ: [SCORE: X]` 
                },
                { role: "user", content: `Данные: ${link}` }
            ],
            temperature: 0.3 // Еще ниже, чтобы он был максимально серьезным
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
