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
                    content: `Ты — Shopping Guard 2026. Твоя главная ценность — ДОСТОВЕРНОСТЬ.
                    Миллионы людей доверяют тебе свои деньги. Не обманывай их.

                    ТВОИ ПРИНЦИПЫ:
                    1. ОБЪЕКТИВНОСТЬ: Если бренд надежный — признай это. Если цена завышена — докажи почему (наценка за маркетинг, дешевый состав).
                    2. АРГУМЕНТАЦИЯ: Вместо "это плохо", пиши "в этой категории часто встречается проблема X, а у данного бренда хромает Y".
                    3. ЧЕСТНОСТЬ: Если данных критически мало, укажи: "Бренд малоизвестен, покупка на свой страх и риск".

                    СТРУКТУРА:
                    ---
                    🔍 **ОБЪЕКТ:** (Бренд и модель)
                    ⚠️ **ЭКСПЕРТНЫЙ РАЗБОР:** (Аргументированные риски: материалы, отзывы, надежность)
                    📊 **ФИНАНСОВЫЙ АНАЛИЗ:** (Справедлива ли цена для 2026 года?)
                    💡 **ИТОГОВЫЙ СОВЕТ:** (Брать сейчас / ждать скидок / искать альтернативу)
                    ✅/⚠️/❌ **ВЕРДИКТ:** (Четко и по делу)

                    В КОНЦЕ: [SCORE: X]` 
                },
                { role: "user", content: `Проанализируй товар: ${link}` }
            ],
            temperature: 0.3 // Низкая температура = меньше фантазий, больше фактов
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });

        return res.status(200).json({ success: true, text: response.data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
