/*import { clipboard } from 'electron';
const {execSync} = require('child_process');*/

String.prototype.insertAt = function(index, string)
{   
  return this.substr(0, index) + string + this.substr(index);
}


let readClipText = window.__TAURI__.clipboard.readText;
let appWindow = window.__TAURI__.window.appWindow;

/*
appWindow.listen('save', (event) => {
    console.log("Saving", event)
})*/ // it was code for menu… Rest in peace.

function swap_visibility(el){
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

invoke("load_text_file").then((text) => {
    ed.text = text;
    ed.editorUPD();
}, (err) => {show_error(err)})

let finder_panel = document.getElementsByClassName("finder_panel")[0];
let field_button = document.getElementsByClassName("field_button")[0];
let field_dropup = document.getElementById("field_dropup");

let words_dropup = document.getElementById("words_dropup");


function show_error(error_text){
    let d = document.createElement("span");
    d.appendChild(new Text(error_text));
    d.style.color = "red";
    finder_dropup.textContent = '';
    finder_dropup.appendChild(d);
    finder_dropup.style.visibility = "visible";
}

async function mutate_settings(){
    let sett = await invoke("get_settings");
    for (prop in sett){
        for (subprop in sett[prop]){
            sett[prop][subprop] = (0.9 + Math.random()/5) * sett[prop][subprop];
        }
    }
    await invoke("save_settings", {"name": "Мутировавшие настройки", "gs": sett});
}

document.getElementsByClassName("set_rhymes_button")[0].onclick = () => {
    swap_visibility(document.getElementById("rhymes_settings"))
};

let current_settings_name = "default";

async function load_settings(name){
    await invoke("load_settings", {"name": name}).then(null, (err) => show_error(err));
}

function render_settings(){
    invoke("get_available_settings").then((res) => {
        let rhymes_settings = document.getElementById("rhymes_settings");
        rhymes_settings.innerHTML = '';
        
        res.push("default");
        for (let i in res){
            let name = res[i];
            let d = document.createElement("div");
            d.appendChild(new Text(name=="default"?"Стандартные настройки":name));
            
            let b;
    
            if (current_settings_name == name){
                b = document.createElement("button");
                b.title = "Перезагрузить"
                b.appendChild(new Text("↺"));
                b.classList.add("reload_settings_btn");
                b.onclick = () => {
                    load_settings(name);
                    render_settings();
                };
                d.classList.add("selected");
            }
            else{
                b = document.createElement("button");
                b.title = "Выбрать";
                b.appendChild(new Text("✓"));
                b.onclick = () => {
                    current_settings_name = name;
                    load_settings(name);
                    render_settings();
                }
            }
    
            d.appendChild(b);
            rhymes_settings.appendChild(d);
        }
        let d = document.createElement("div");
        let b = document.createElement("button");
        b.appendChild(new Text("⚅"));
        b.classList.add("random_settings_btn");
        b.titile = "Создать случайные настройки";
        b.onclick = () => {
            mutate_settings().then(() => {render_settings()});
        }
        d.appendChild(b)
        rhymes_settings.appendChild(d);
    })
}


// Invoke the command
invoke("load_data").then(() => {
    status_bar.remove();
    finder_panel.style.visibility = "visible";
});

render_settings();

let selected_field = null;
let available_fields;
invoke("get_available_fields").then((res) => {
    res.push("Без поля");
    res.push("Auto");
    res.push("New");
    available_fields = res;
    for (const field_name of available_fields){
        let d = document.createElement('div');
        d.appendChild(new Text(field_name))
        field_dropup.appendChild(d);
        
        if (field_name == "Без поля"){
            d.classList.add("special");
            d.onclick = (e) => {
                selected_field = null;
                field_button.textContent = field_name;
                field_dropup.style.visibility = "hidden";
            }
        }
        else if (field_name == "New"){
            d.classList.add("special");
            
            d.onclick = (e) => {
                swap_visibility(words_dropup);
                selected_field = field_name;
                field_button.textContent = 'New'
            }
        }
        else{
            if (field_name == "Auto"){
                d.classList.add("special");
            }
            d.onclick = (e) => {
                selected_field = field_name;
                field_button.textContent = field_name;
                field_dropup.style.visibility = "hidden";
            }
        }

            
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
        return result;
    }
};




finder_input.onkeydown = (e) => {
    if (e.key == "Enter"){
        get_rhymes(finder_input.value).then((res) => {
            if (res == undefined){
                return;
            }
            finder_dropup.textContent = '';
            let info_block = document.getElementsByClassName("info_block")[0];

            for (const word of res){
                let d = document.createElement("div");
                d.appendChild(new Text(word.word.replace("'", "́").replace("`", "")));

                d.onmouseenter = (e) => {
                    console.log("Entered")
                    info_block.innerHTML = '';
                    info_block.style.visibility = "inherit";
                    let word_prop = (s) => {return Math.round(word[s]*1_000)/1_000};
                    let div_create = (prop) => {
                        let d = document.createElement("div");
                        d.appendChild(new Text(prop + ": "));
                        let s = document.createElement("span");
                        s.appendChild(new Text(word_prop(prop)));
                        d.appendChild(s);
                        return d;
                    }

                    info_block.appendChild(div_create("dist")); // distance should be the first

                    for (prop in word){
                        if (prop == "word" || prop == "dist"){
                            continue;
                        }
                        
                        info_block.appendChild(div_create(prop));
                    }
                }
                d.onmouseleave = (e) => {
                    info_block.style.visibility = "hidden";
                }
                finder_dropup.appendChild(d);
            }
            finder_dropup.style.visibility = "visible";

        }, (err) => {show_error(err)})
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
    else if (e.code == "KeyV" && e.altKey){
        // Alt + V — alternative view (squares)
        ed.structure_mode = !ed.structure_mode;
        ed.editorUPD();
    }
    else if (e.code == "KeyS" && e.ctrlKey){
        invoke("save_text_file", {'text': ed.text}).then(undefined, (err) => {show_error(err)})
    }
};
window.__TAURI__.window.appWindow.once('tauri://close-requested',
    (e) => {
        invoke("save_text_file", {'text': ed.text})
        .then(
            () => {window.__TAURI__.process.exit(0)},
            (err) => {show_error(err)}
            )
        }
    )