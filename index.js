const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const utils = require('./utils');

const app = express();
const SECRET = 'super_secret_key';

//setup ejs for templates and templates folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

//settings for express
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//endpoints
app.get('/', (req, res) => {
    res.render('index', { title: 'Test Page', message: 'If you are seeing this, ejs works!' });
});

app.get('/quiz-list', async (req, res) => {
    try{
        const files = await utils.scan_quiz();
        res.render('options', { title: 'Select A quiz', buttons: files });
    } catch{
        res.status(500).send('Internal Server Error: Unable to fetch quiz list');
    }
});

app.get('/quiz/:id', async (req, res) => {
    const id = req.params.id;
    const token = req.cookies.auth_token;
    let data;

    //retrieve data from cookie, if no cookie exists it is given
    if(token){
        try {
            data = jwt.verify(token, SECRET);
        } catch (error) {
            res.status(403).send('Invalid or expired token.');
        }
    } 
    else {
        data = { id: id, level: 0};
        let new_token = jwt.sign(data, SECRET, { expiresIn: '1h' });
        res.cookie('auth_token', new_token, {
            httpOnly: true,
            secure: false,          //http
            maxAge: 60 * 60 * 1000, //ms
        });
    }

    //render new level
    try{
        const level = await utils.level.from_file(id, data.level);
        res.render('question', {
            imageUrl: level.image,
            question: level.question,
            answer1: level.texts[0],
            answer2: level.texts[1],
            answer3: level.texts[2],
        });
    } catch (err) {
        res.status(404).send('Quiz or question not found');
        console.log(err);
    }
});

app.post('/quiz/:id', async (req, res) => {
    const id = req.params.id;
    const token = req.cookies.auth_token;
    let data;

    //get data from cookie
    if(token){
        try {
            data = jwt.verify(token, SECRET);
        } catch (error) {
            res.status(403).send('Invalid or expired token.');
        }
    } else {
        res.status(403).send('No token provided');
    }

    //check if answer is correct
    try{
        const level = await utils.level.from_file(id, data.level);
        if(req.body.answer === level.answer){
            data.level++;

            //check if user has won
            const quiz = await utils.quiz.from_file(id);
            if(data.level === quiz.levels.length){
                res.clearCookie('auth_token');
                res.render('index', { title: 'You won!', message: 'You have completed the quiz!' });
                return;
            }

            //update token and redirect to next level
            let new_token = jwt.sign(data, SECRET);
            res.cookie('auth_token', new_token, {
                httpOnly: true,
                secure: false,          //http
                maxAge: 60 * 60 * 1000, //ms
            });

            res.redirect(`/quiz/${id}`);
        } else {
            res.status(403).send('Wrong answer');
        }
    } catch (err) {
        res.status(404).send('Quiz or question not found');
        console.log(err);
    }
})


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
