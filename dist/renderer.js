/*import { clipboard } from 'electron';
const {execSync} = require('child_process');*/

String.prototype.insertAt = function(index, string)
{   
  return this.substr(0, index) + string + this.substr(index);
}

let editor = document.getElementsByClassName("editor")[0];
let readClipText = window.__TAURI__.clipboard.readText;

let cur_but = document.getElementsByClassName("current_but")[0];
let choice_but = document.getElementsByClassName("choice_but")[0];
let status_bar = document.getElementsByClassName("status")[0];

// Invoke the command
invoke("load_data").then(() => {status_bar.firstChild.data ="Loaded data"});

cur_but.onclick = function (e){
    if (choice_but.style.visibility == "hidden"){
        choice_but.style.visibility = "inherit"
    }
    else{
        choice_but.style.visibility = "hidden"
    }
}


// TODO: Сохранение прокрутки
class colorEditor{
    

    constructor (editor){

        this.editor = editor;
        this.text = [''];
        this.cursorLine = 0;
        this.cursorSymbol = 0;
        this.history = [];
        this.colorify_func = Colorifier.colorify_assonanses;

        this.widgets = null;

        this.editorUPD();

        let self = this;

        this.editor.onkeydown = function(e){
            if (e.keyCode == 90 && e.ctrlKey){
                if (self.history.length){
                    self.text = self.history.pop();
                    self.editorUPD();
                }
            }
        }

        this.editor.addEventListener('beforeinput', function(e){

            let sel = window.getSelection();
            if (sel){
                let r = sel.getRangeAt(0);
                self.getCoord(r.startContainer, true);
                if (r.startOffset == 0){
                    self.cursorSymbol = 0;
                } 
                //self.cursorSymbol += r.startOffset - 1;
            }
            

            let text = [""];
            self.history.push(self.text.slice(0));

            if (self.history.length > 50){
                self.history.shift();
            }

            switch(e.inputType){
                case "insertText":
                    self.insertPlainText(e.data);
                    e.preventDefault();
                break

                case "insertFromPaste":
                    text = readClipText().then((text) => {
                        self.insertOrReplaceText(text);
                        self.editorUPD();
                    });
                    e.preventDefault();
                break

                case "insertParagraph": //TODO: FIX BREAK AT START OF THE LINE
                    self.insertBreak();
                    e.preventDefault();
                break

                case "formatItalic":
                case "formatBold":
                    e.preventDefault();
                    return
                break
                
                // TODO: "deleteContentForward"
                case "deleteContentForward":
                    self.deleteLetterForward();
                    e.preventDefault();
                break

                case "deleteByCut":
                case "deleteContentBackward":
                    self.deleteBackward();
                    e.preventDefault();
                break

                default:
                    console.log("Unknown event:", e);
            }
            console.log(self.cursorSymbol);
            self.editorUPD();
            });
    }

    insertOrReplaceText(newText){

        let sel = window.getSelection();
        console.assert(sel.rangeCount > 0);
        let r = sel.getRangeAt(0);

        if (sel.getRangeAt(0).collapsed){
            this.insertPlainText(newText);
        }
        else{
            this.replaceSelection(newText);
        }
    }

    insertPlainText(addedText){
        addedText.replace(' ', ' ');
        let splitted = addedText.split('\n');

        for (let i = 0; i < splitted.length; i++){
            this.insertLetters(splitted[i]);

            if (i !== splitted.length - 1){
                this.insertBreak();
            }
            
        }

    }

    insertLetters(plainText){
        // one line of letters, if multiline → insertPlainText should be used

        if (plainText == ' '){
            plainText = ' ';
        }
        
        this.text[this.cursorLine] = this.text[this.cursorLine].insertAt(this.cursorSymbol, plainText);
        this.cursorSymbol += plainText.length;
    }

    insertBreak(){
        // breakline
        this.text.splice(this.cursorLine + 1, 0, this.text[this.cursorLine].substr(this.cursorSymbol)); // insert cursorSymb:… to a new line
        this.text[this.cursorLine] = this.text[this.cursorLine].substr(0, this.cursorSymbol); // cut this line

        this.cursorLine += 1;
        this.cursorSymbol = 0;
    }

    replaceSelection(newText = ""){

        let sel = window.getSelection();
        console.assert(sel.rangeCount > 0);
        let r = sel.getRangeAt(0);

        let startSelect = this.getCoord(r.startContainer); // autoset = true, so will jump here after deletion
        this.cursorSymbol -= 1;
        let endSelect = this.getCoord(r.endContainer, false);

        // first delete unnecassary text

        
        if (endSelect[0] - startSelect[0]) { // more than one line
            this.text.splice(startSelect[0] + 1, endSelect[0] - (startSelect[0] + 1)); // remove full lines
            this.text[startSelect[0]] = (this.text[startSelect[0]].substr(0, startSelect[1] - 1) + 
                                        this.text[startSelect[0] + 1].substr(endSelect[1]));
            this.text.splice(startSelect[0] + 1, 1);
        }
        else { //the same line
            this.text[startSelect[0]] = (this.text[startSelect[0]].substr(0, startSelect[1] - 1) + 
                                        this.text[startSelect[0]].substr(endSelect[1]));
        }
        // then insert new
        if (newText){
            this.insertPlainText(newText);
        }
        

    }

    deleteBackward(){
        let sel = window.getSelection();
        console.assert(sel.rangeCount > 0);

        if (sel.getRangeAt(0).collapsed){
            this.deleteLetterBackward();
        }
        else{
            this.replaceSelection("");
        }
    }

    deleteLetterBackward(){
        if (this.cursorSymbol == 0 && this.cursorLine !== 0){
            this.cursorSymbol = this.text[this.cursorLine - 1].length;
            this.text[this.cursorLine - 1] += this.text[this.cursorLine];
            this.text.splice(this.cursorLine, 1);
            this.cursorLine--;
        }
        else if (this.cursorSymbol > 0){
            this.text[this.cursorLine] = this.text[this.cursorLine].slice(0, this.cursorSymbol - 1) + this.text[this.cursorLine].slice(this.cursorSymbol);
            this.cursorSymbol--;
        }
    }

    deleteLetterForward(){
        if (this.cursorSymbol == 0 && this.text[this.cursorLine].length == 0){ // first symbol
            this.deleteLetterBackward();
            this.cursorLine ++;
            this.cursorSymbol = 0;
        }
        else if (this.cursorSymbol < this.text[this.cursorLine].length){ // inline
            this.cursorSymbol ++;
            this.deleteLetterBackward();
        }
        else if (this.cursorLine < this.text.length - 1){ // end of the line
            this.cursorSymbol = 0;
            this.cursorLine ++;
            this.deleteLetterBackward();
        }
    }

    editorUPD(){

        this.editor.innerHTML = '';
        let symbolnum = 0;



        for (let lineNum = 0; lineNum < this.text.length; lineNum ++){

            let line = this.text[lineNum];
            let div = document.createElement('div');
            this.editor.appendChild(div);

            let divNotEmpty = false;

            for (let charNum = 0; charNum < line.length; charNum ++){
                let charSpan = document.createElement('span');
                let textInSpan = new Text(line[charNum]);

                /*invoke('my_custom_command', {l: line[charNum]}).then((message) => {
                            charSpan.style.color = message;
                            console.log(message)
                })*/
                // charSpan.style.fontWeight = 600;
                
                symbolnum++;
                charSpan.appendChild(textInSpan);
                div.appendChild(charSpan);

                if (lineNum == this.cursorLine && charNum + 1 == this.cursorSymbol){
                    this.safeSelectionAt(textInSpan, 1);
                }

                divNotEmpty = true;
            }

            if (!divNotEmpty){
                div.appendChild(new Text('​'));
            }
            

            if (this.cursorSymbol == 0 && lineNum == this.cursorLine){
                this.safeSelectionAt(div, 0);
            }
        }
        // colorify_stresses
        // colorify_assonanses
        // colorify_alliteration
        this.colorify_func(this.text).then((colors) => {
            if (colors == undefined){
                return;
            }
            for (let lineNum = 0; lineNum < this.text.length; lineNum ++){
                let line = this.text[lineNum];
                for (let charNum = 0; charNum < line.length; charNum ++){
                    this.editor.children[lineNum].children[charNum].style.background = colors[lineNum][charNum];
                    if (colors[lineNum][charNum] != "inherit"){
                        this.editor.children[lineNum].children[charNum].style.color = "#111"
                    }
                }
            }
        });
    }

    getCoord(obj, autoset=true){
        // if autoset, sets current position here. At any case returns cursor position.
        let cursorSymb;
        let cursorLine;

        if (obj.tagName === undefined){ // usual text
            obj = obj.parentNode;
        }

        if (obj.tagName === 'SPAN'){
            cursorSymb = Array.from(obj.parentNode.childNodes).indexOf(obj) + 1;
            obj = obj.parentNode;
        }
        else{
            cursorSymb = 0;
        }
        

        cursorLine = Array.from(obj.parentNode.childNodes).indexOf(obj);

        if (autoset){
            this.cursorLine = cursorLine;
            this.cursorSymbol = cursorSymb;
        }

        return [cursorLine, cursorSymb]
        
        //console.assert(this.text[this.cursorLine][this.cursorSymbol] !== undefined, this.text[this.cursorLine][this.cursorSymbol], this.text[this.cursorLine])
    }

    safeSelectionAt(startContainer, offset){
        let sel = window.getSelection();

        if (sel.rangeCount){
            sel.getRangeAt(0).setStart(startContainer, offset);
        }
        else{
            let r = new Range();
            r.setStart(startContainer, offset);
            sel.addRange(r);
        }
    }
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


let ed = new colorEditor(editor);

let asson_but = document.getElementById("asson_but");
let allit_but = document.getElementById("allit_but");
let stress_but = document.getElementById("stress_but");

asson_but.onclick = (e) => {
    ed.colorify_func = Colorifier.colorify_assonanses;
    ed.editorUPD();
    cur_but.firstChild.data = "Ассонансы";
};

allit_but.onclick = (e) => {
    ed.colorify_func = Colorifier.colorify_alliteration;
    ed.editorUPD();
    cur_but.firstChild.data = "Аллитерация";
};

stress_but.onclick = (e) => {
    ed.colorify_func = Colorifier.colorify_stresses;
    ed.editorUPD();
    cur_but.firstChild.data = "Ударения";
};