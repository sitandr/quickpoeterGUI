/*import { clipboard } from 'electron';
const {execSync} = require('child_process');*/

String.prototype.insertAt = function(index, string)
{   
  return this.substr(0, index) + string + this.substr(index);
}


let readClipText = window.__TAURI__.clipboard.readText;
let appWindow = window.__TAURI__.window.appWindow;

appWindow.listen('save', (event) => {
    console.log("Saving", event)
})

function swap_visibility(el){
    console.log(el.style.visibility)
    if (el.style.visibility == "hidden" || el.style.visibility == ''){
        el.style.visibility = "inherit";
    }
    else{
        el.style.visibility = "hidden";
    }
}

let cur_but = document.getElementsByClassName("current_but")[0];
let choice_but = document.getElementsByClassName("choice_but")[0];
let status_bar = document.getElementsByClassName("status")[0];

let editor = document.getElementsByClassName("editor")[0];
let ed = new colorEditor(editor);

let finder_panel = document.getElementsByClassName("finder_panel")[0];
let field_button = document.getElementsByClassName("field_button")[0];
let field_dropup = document.getElementById("field_dropup");

let words_dropup = document.getElementById("words_dropup");

// Invoke the command
invoke("load_data").then(() => {
    //status_bar.firstChild.data ="Loaded data"
    //status_bar.style.visibility = "hidden";
    status_bar.remove();
    finder_panel.style.visibility = "visible";
});

let selected_field = null;
let available_fields;
invoke("get_available_fields").then((res) => {
    res.push("Без поля");
    res.push("Auto");
    res.push("New");
    console.log(res)
    available_fields = res;
    for (const field_name of available_fields){
        let d = document.createElement('div');
        d.appendChild(new Text(field_name))
        field_dropup.appendChild(d);
        
        d.onclick = (e) => {
            if (field_name == "Без поля"){
                selected_field = null;
            }
            else if (field_name == "New"){
                swap_visibility(words_dropup);
                selected_field = field_name;
                field_button.textContent = 'New'
                return;
            }
            else{
                selected_field = field_name;
            }

            field_button.textContent = field_name;
            field_dropup.style.visibility = "hidden";
        };
    }
});

cur_but.onclick = function (e){
    swap_visibility(choice_but);
}

field_button.onclick = (e) =>{swap_visibility(field_dropup)};

let finder_input = document.getElementsByClassName("finder_input")[0];
let finder_dropup = document.getElementById("finder_dropup");
let field_word_input = document.getElementById("input_field_word");

field_word_input.addEventListener('input', (e) => e.target.value = e.target.value.replaceAll(/[^а-яё]/gi, ''));

selected_field_words = [];
field_word_input.onkeydown = (e) => {
    if (e.key == "Enter"){
        let word = field_word_input.value;
        selected_field_words.push(word);

        let div = document.createElement("div");        
        div.appendChild(new Text(word));
        let close = document.createElement('span');
        close.appendChild(new Text('×'))
        div.appendChild(close);
        field_word_input.value = '';
        words_dropup.insertBefore(div, field_word_input);

        close.onclick = (e) => {
            words_dropup.removeChild(div);
            selected_field_words.splice(selected_field_words.indexOf(word), 1)
            //TODO: remove selected
        }
    }
}

let get_rhymes_id_obj;
let get_rhymes = async function(word, n=100){
    let local_obj = get_rhymes_id_obj = new Object();
    let text;
    if (selected_field == "New"){
        text = selected_field_words;
    }
    else{
        text = ed.text;
    }

    let result = await invoke("get_rhymes", {"word": word, "topN": n, "mean": selected_field, "text": text})
    if (local_obj == get_rhymes_id_obj){
        console.log("returned");
        return result;
    }
    console.log("cancelled");
};


finder_input.onkeydown = (e) => {
    if (e.key == "Enter"){
        get_rhymes(finder_input.value).then((res) => {
            if (res == undefined){
                return;
            }
            finder_dropup.textContent = '';
            for (const word of res){
                let d = document.createElement("div");
                d.appendChild(new Text(word.replace("'", "́").replace("`", "")));
                finder_dropup.appendChild(d);
            }
            finder_dropup.style.visibility = "visible";

        }, (err) => {
            let d = document.createElement("span");
            d.appendChild(new Text(err));
            d.style.color = "red";
            finder_dropup.textContent = '';
            finder_dropup.appendChild(d);
            finder_dropup.style.visibility = "visible";
        }) // .replace("'", "́")
    }
};


let asson_but = document.getElementById("asson_but");
let allit_but = document.getElementById("allit_but");
let stress_but = document.getElementById("stress_but");
let no_col_but = document.getElementById("no_col_but");

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

no_col_but.onclick = (e) => {
    ed.colorify_func = null;
    ed.editorUPD();
    cur_but.firstChild.data = "Без подсветки";
}

document.onkeydown = (e) => {
    if (e.key == "Escape"){
        swap_visibility(finder_dropup)
    }
};