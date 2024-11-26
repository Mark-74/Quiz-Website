const path = require('path');
const fs = require('fs').promises;
const { error } = require('console');

const quiz_path = path.join(__dirname, '../quiz')

/** 
* A function that searches the 'quiz' folder and returns the files found.
* @returns {string|string[]} A string or an array of strings.
*/
async function scan_quiz(){
    try{
        const files = await fs.readdir(quiz_path);
        for(let i = 0; i < files.length; i++)
            files[i] = files[i].split('.')[0];

        return files;
        
    } catch (err) {
        console.error('Error reading quiz directory', err);
        throw new Error('Error reading quiz directory');
    }
}

class level {
    /**
     * 
     * @param {number} level_number 
     * @param {string} question 
     * @param {string} image
     * @param {string[]} texts 
     * @param {string} answer 
     */
    constructor(level_number, question, image, texts, answer){
        this.level_number = level_number;
        this.question = question;
        this.image = image;
        this.texts = texts;
        this.answer = answer;
    }

    /**
     * A function that creates a new level from a given id/file.
     * @param {string} id 
     * @param {number} level_number The number of the level to fetch.
     * @returns {Promise<level>}
     */
    static async from_file(id, level_number){
        if(!(await scan_quiz()).includes(id)){
            throw new Error('Quiz not found');
        }

        const file_path = path.join(quiz_path, id + '.json');
        try{
            const data = await fs.readFile(file_path, 'utf-8');
            const json = JSON.parse(data);
            const jsonData = json.levels[level_number];
            return new level(jsonData.level_number, jsonData.question, jsonData.image, jsonData.texts, jsonData.answer);
        } catch (err) {
            console.error('Error reading quiz file', err);
            throw new Error('Error reading quiz file');
        }

    }
}

class quiz {
    /**
     * 
     * @param {string} name 
     * @param {level[]} levels 
     */
    constructor(name, levels){
        this.name = name;
        this.levels = levels;
    }

    /**
     * A function that creates a new quiz from a given id/file.
     * @param {string|number} id 
     * @returns {Promise<quiz>}
     */
    static async from_file(id){
        if(!(await scan_quiz()).includes(id)){
            throw new Error('Quiz not found');
        }

        const file_path = path.join(quiz_path, id + '.json');
        try{
            const data = await fs.readFile(file_path, 'utf-8');
            const json = JSON.parse(data);
            const levels = [];
            json.levels.forEach(element => {
                levels.push(new level(element.level_number, element.question, element.image, element.texts, element.answer));
            });

            return new quiz(json.name, levels);
        } catch (err) {
            console.error('Error reading quiz file', err);
            throw new Error('Error reading quiz file');
        }
    }
}

module.exports = {
    scan_quiz,
    level,
    quiz
}