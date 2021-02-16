const PORT = process.env.PORT || 5000;
const {includes, sample} = require('lodash');
const express = require('express');

class AliceAnswerTemplate {
    greetings() {
        return {
            text: 'Привет! Это навык для игры в твистер, я буду говорить какую руку или ногу на какой круг ставить. Поиграем? Скажите "Дальше"',
            buttons: ["Дальше", "Выход"]
        };
    }

    isExit(userUtterance) {
        const exitWords = ['нет', 'выйти', 'закрыть', 'завершить', 'хватит', 'достаточно'];
        for (let item of exitWords) {
            if (includes(userUtterance, item)) {
                return true;
            }
        }
    }

    Exit(userUtterance) {
        return {
            text: 'Привет! Это навык для игры в твистер, я буду говорить какую руку или ногу на какой круг ставить. Поиграем? Скажите "Дальше"'
            buttons: ["Дальше", "Выход"]
        };
    }


    pong() {
        return {text: 'ОК', end_session: true};
    }
}


express()
    .use(express.json())
    .get('/', (req, res) => {
        res.send("OK").status(200);
    })
    .post('/alice', (request, response) => {
        console.log("Request: ", request.body);
        const {meta, request, version, session} = request.body;
        console.log("Data from request: ", {meta, request, version, session});
        const userUtterance = (request.original_utterance || "").toLowerCase();
        console.log("userUtterance", userUtterance);

        if (userUtterance === 'ping') {
            response.send({version, session, response: {text: 'ОК', end_session: true}}).status(200);
            return;
        }

        const hasScreen = typeof meta.interfaces.screen !== "undefined" ? true : false;

        const aliceAnswerTemplate = new AliceAnswerTemplate();


        // Слот для кнопок (саджестов):
        let buttonSlot = [];
        const playButton = {"title": "Дальше", "hide": true};


        // Создадим также (на этот раз для простоты без вариативности) фразы приветствия, справки, прощания,
        // а также фразу для ответа на непонятые (т.е. те, которые наш код ещё не обрабатывает) вопросыи юзера:
        const hello = 'Привет! Это навык для игры в твистер, я буду говорить какую руку или ногу на какой круг ставить. Поиграем? Скажите "Дальше"';
        const help = 'Я умею играть в твистер! Чтобы закрыть - скажите: "Выйти"';
        const bye = 'Спасибо за внимание! До скорой встречи!';
        const unknown = 'Я не поняла повторите';

        // Намерения юзера:
        let intent;

        // 1. Юзер хочет слушать цитаты (играть -- в нашей терминологии):
        const playWords = ['дальше', 'продолжить', 'продолжать', 'продолжай'];

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
        response.send({
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


