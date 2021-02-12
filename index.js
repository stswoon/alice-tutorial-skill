const PORT = process.env.PORT || 5000;
const {includes, sample} = require('lodash');
const express = require('express');

express()
    .use(express.json())
    .get('/', (req, res) => {
        res.send("OK").status(200);
    })
    .post('/alice', (req, res) => {
        console.log("req", req.body);
        const {meta, request, version, session} = req.body;
        console.log(meta);
        console.log(request);
        console.log(version);
        console.log(session);
        const userUtterance = (request.original_utterance || "").toLowerCase();
        console.log("userUtterance", userUtterance);

        // Быстрый ответ (чтобы не делать лишние запросы к стороннему API) на проверочный пинг от Яндекса:
        if (userUtterance === 'ping') {
            res.send({
                version, session,
                response: {
                    text: 'ОК',
                    end_session: true
                }
            }).status(200);
            return;
        }


        // Получаем массив всех слов из последней фразы юзера:
        let userWords = [];

        if (request.nlu.tokens.length > 0) {
            const tokensArr = request.nlu.tokens;
            for (let i = 0; i < tokensArr.length; i++) {
                userWords.push(tokensArr[i]);
            }
        }

        // Слот для кнопок (саджестов):
        let buttonSlot = [];
        const playButton = {"title": "Продолжай", "hide": true};


        // Перманентный вопрос к юзеру из серии: "Хотите продолжить?"
        const wish = [
            'Хотите',
            'Желаете',
            'Не против'
        ];
        const know = [
            'узнать',
            'услышать',
        ];
        const thought = [
            'следующее задание',
            'что будет дальше',
        ];
        // Формируем перманентный вопрос к юзеру:
        const prompt = `${sample(wish)} ${sample(know)} ${sample(thought)}?`;

        // Создадим также (на этот раз для простоты без вариативности) фразы приветствия, справки, прощания,
        // а также фразу для ответа на непонятые (т.е. те, которые наш код ещё не обрабатывает) вопросыи юзера:
        const hello = 'Привет! Поиграем? Скажите "Дальше"';
        const help = 'Я умею играть в твистер! Чтобы закрыть - скажите: "Выйти"';
        const bye = 'Спасибо за внимание! До скорой встречи!';
        const unknown = 'Я не поняла повторите';

        // Теперь стараемся понять юзера. Эту логику также лучше писать в отдельном файле,
        // поскольку может быть много кода, но в данном весьма упрощённом примере -- пишем здесь.
        // Будем использовать функции includes() из библиотеки Lodash, которая ищет подстроку.

        // Намерения юзера:
        let intent;

        // 1. Юзер хочет слушать цитаты (играть -- в нашей терминологии):
        const playWords = ['дальше', 'продолжить', 'продолжать'];

        for (let item of playWords) {
            if (includes(userUtterance, item)) {
                intent = 'play';
                break;
            }
        }

        // 2. Юзер хочет получить справку (на фразы "помощь" и "что ты умеешь" тестируют при модерации навыка):
        const helpWords = ['справка', 'помощь', 'что ты умеешь'];

        for (let item of helpWords) {
            if (includes(userUtterance, item)) {
                intent = 'help';
                break;
            }
        }

        // 3. Юзер хочет закрыть навык:
        const exitWords = ['нет', 'выйти', 'закрыть', 'завершить', 'хватит', 'достаточно'];

        for (let item of exitWords) {
            if (includes(userUtterance, item)) {
                intent = 'exit';
                break;
            }
        }

        let isEndSession = false;
        let message;

        // И вот он -- диалог с юзером!:
        if (!userUtterance) {
            // Приветствие при запуске:
            message = hello;
            // Если у юзера есть экран:
            //if (hasScreen) {
            // Кнопка "Продолжай":
            buttonSlot.push(playButton);
            //}
        } else if (intent === 'play') {
            // Определение функции setData() -- в конце кода:
            message = setData();
        } else if (intent === 'help') {
            message = `${help} ${prompt}`;
        } else if (intent === 'exit') {
            message = bye;
            buttonSlot = [];
            isEndSession = true;
        } else {
            message = unknown;
            buttonSlot.push(playButton);
        }

        console.log("Message", message);


        // Ответ Алисе:
        res.send({
            version,
            session,
            response: {
                text: message,
                buttons: buttonSlot,
                end_session: isEndSession
            }
        }).status(200);
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));


function setData() {
    const a = ['Левая', 'Правая'];
    const b = ['рука', 'нога'];
    const c = ['на'];
    const d = ['желтый', 'красный', 'синий', 'зеленый'];
    const e = ['круг'];
    const answer = `${sample(a)} ${sample(b)} ${sample(c)} ${sample(d)} ${sample(e)}`;
    return answer;
}


