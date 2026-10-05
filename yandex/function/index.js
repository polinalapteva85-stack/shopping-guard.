// Shopping Guard — функция анализа для Яндекс Облака.
// Принимает ссылку (или текст из «Поделиться»), цену и описание,
// сама узнаёт товар Wildberries по ссылке и просит YandexGPT разобрать покупку.

const FOLDER_ID = process.env.FOLDER_ID;
const MODEL = process.env.MODEL || 'yandexgpt/latest';

const SYSTEM_PROMPT = `Ты — Shopping Guard, ироничный и опытный эксперт по покупкам. Твоя задача — открыть пользователю глаза на товар, который он хочет купить на маркетплейсе. Пиши просто, понятно, с легким юмором, без занудства и сложных терминов. Общайся как хороший друг, который уберегает от глупых покупок.

Тебе передают то, что удалось узнать о товаре: название, бренд, характеристики и описание с маркетплейса (если есть), слова покупателя и цену. Опирайся на эти данные и на свои знания о таких товарах и их обычных ценах. Не придумывай товар, которого нет в данных. Никогда не отказывайся и не проси «дать больше информации» — всегда давай разбор. Если цена не указана, оцени, сколько такой товар обычно стоит, и скажи, на какую цену ориентироваться.

Выдай ответ строго по этой структуре (используй именно эти эмодзи и заголовки):

🔍 **ОБЪЕКТ:** (Что это за товар, бренд и модель)

🛑 **ДЕТЕКТОР ЛЖИ:** (Твое живое мнение о карточке товара. Насколько адекватна цена, не завышена ли она искусственно, стоит ли верить красивым словам в описании)

📊 **РЕАЛЬНАЯ ЭКОНОМИКА:** (Примерная честная цена этому товару и сколько покупатель переплачивает за маркетинг)

💡 **ИТОГОВЫЙ СОВЕТ:** (Короткий, хлёсткий и понятный совет: брать, бежать мимо или подождать)

[SCORE: число от 1 до 100]

SCORE — индекс риска импульсивной покупки: 1–30 — смело бери, 31–70 — подумай или подожди, 71–100 — беги мимо. Число должно совпадать с итоговым советом.`;

function reply(statusCode, data) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(data)
    };
}

async function fetchWithTimeout(url, options = {}, ms = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// Номер товара в ссылке WB бывает в разных местах: /catalog/123/, ?card=123, ?nm=123
function wbArticleFromUrl(url) {
    if (!/wildberries|wb\.ru|wbstatic|wb\.click/i.test(url)) return null;
    const m = url.match(/\/catalog\/(\d{5,12})/i) || url.match(/[?&](?:card|nm|nm_id)=(\d{5,12})/i)
        || url.match(/\/(\d{6,12})(?:\/|\?|$)/);
    return m ? m[1] : null;
}

// Номер товара Wildberries из ссылки; короткие ссылки сначала раскрываем
async function findWbArticle(url) {
    const direct = wbArticleFromUrl(url);
    if (direct) return direct;
    try {
        const res = await fetchWithTimeout(url, { redirect: 'follow' }, 4000);
        return wbArticleFromUrl(res.url);
    } catch (_) {
        return null;
    }
}

// Карточка товара WB лежит на одном из серверов basket-NN — опрашиваем их разом
async function fetchWbCard(article) {
    const nm = Number(article);
    const vol = Math.floor(nm / 100000);
    const part = Math.floor(nm / 1000);
    const hosts = Array.from({ length: 60 },(_, i) => String(i + 1).padStart(2, '0'));
    try {
        return await Promise.any(hosts.map(async (h) => {
            const res = await fetchWithTimeout(
                `https://basket-${h}.wbbasket.ru/vol${vol}/part${part}/${nm}/info/ru/card.json`, {}, 5000);
            if (!res.ok) throw new Error('нет');
            return await res.json();
        }));
    } catch (_) {
        return null;
    }
}

function describeWbCard(card) {
    const lines = [];
    lines.push(`Название: ${card.imt_name || ''}`);
    if (card.selling?.brand_name) lines.push(`Бренд: ${card.selling.brand_name}`);
    if (card.subj_name) lines.push(`Категория: ${card.subj_name}`);
    const options = (card.options || []).slice(0, 15).map((o) => `${o.name}: ${o.value}`);
    if (options.length) lines.push(`Характеристики: ${options.join('; ')}`);
    if (card.description) lines.push(`Описание продавца: ${card.description.slice(0, 1200)}`);
    return lines.join('\n');
}

async function askYandexGpt(iamToken, userText) {
    const res = await fetchWithTimeout('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${iamToken}`,
            'x-folder-id': FOLDER_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            modelUri: `gpt://${FOLDER_ID}/${MODEL}`,
            completionOptions: { stream: false, temperature: 0.6, maxTokens: '1500' },
            messages: [
                { role: 'system', text: SYSTEM_PROMPT },
                { role: 'user', text: userText }
            ]
        })
    }, 50000);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || data?.message || `код ${res.status}`);
    return data.result.alternatives[0].message.text;
}

module.exports.handler = async function (event, context) {
    let body = {};
    try {
        const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}');
        body = JSON.parse(raw);
    } catch (_) {
        return reply(400, { success: false, error: 'Непонятный запрос.' });
    }

    const input = String(body.link || '').trim();
    const name = String(body.name || '').trim();
    const price = String(body.price || '').trim();

    const url = (input.match(/https?:\/\/\S+/) || [])[0] || '';
    // Текст из «Поделиться» без самой ссылки — часто это и есть название товара
    const sharedText = input.replace(url, '').trim();

    let product = null;
    let article = null;
    if (url) {
        article = await findWbArticle(url);
        if (article) {
            const card = await fetchWbCard(article);
            if (card?.imt_name) product = { title: card.imt_name, brand: card.selling?.brand_name || '', details: describeWbCard(card) };
        }
    }
    // В журнал — только ссылка и итог распознавания, чтобы разбирать сбои
    console.log(JSON.stringify({ url, article, recognized: Boolean(product) }));

    if (!product && !name && !sharedText) {
        return reply(200, { success: false, needName: true, error: 'Не удалось узнать товар по ссылке. Напишите, что это за товар.' });
    }

    const parts = [];
    if (product) parts.push(`Данные с маркетплейса:\n${product.details}`);
    if (sharedText) parts.push(`Текст, которым поделились: ${sharedText}`);
    if (name) parts.push(`Что это (со слов покупателя): ${name}`);
    parts.push(`Цена: ${price ? price + ' ₽' : 'не указана'}`);
    if (url) parts.push(`Ссылка: ${url}`);

    try {
        const text = await askYandexGpt(context.token.access_token, `Разложи по полочкам этот товар.\n\n${parts.join('\n\n')}`);
        return reply(200, {
            success: true,
            text,
            product: product ? { title: product.title, brand: product.brand } : null
        });
    } catch (error) {
        return reply(502, { success: false, error: 'ИИ не ответил: ' + error.message });
    }
};
