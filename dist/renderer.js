import {Colorifier} from '/colorifier.js';

let colorifier = new Colorifier;

import {colorEditor} from '/editor.js';

const invoke = window.__TAURI__.invoke;
let readClipText = window.__TAURI__.clipboard.readText;
let appWindow = window.__TAURI__.window.appWindow;


const HELP_TEXT = 'Кнопка справа выбирает стиль подсветки. Можно подсветить ударные слоги, ассонансы и аллитерации.\
 Первые рекомендуется использовать вместе со структурным видом.<br>\
Используйте поле ввода слева для поиска рифмы к слову. Можно использовать паттерны, например, "++!"\
 для поиска трёхсложного слова с ударением на последнем слоге, или "++о\'й"  для таких слов, заканчивающихся на "-ой".\
 Вы можете выбрать смысловую тему подбираемой рифмы. <b>Auto</b> задаёт смысл по текущему стиху, <b>New</b> позволяет создать собственный смысл\
 по характерным словам.\
<br>\
Горячие клавиши:<br>\
<b>Ctrl + \'</b> — поставить(уточнить) ударение (можно ставить несколько на одно слово)<br>\
<b>Ctrl + Space</b> — добавить паузу в ритм<br>\
<b>Ctrl + <</b> — уменьшить произносимую длину слога <br>\
<b>Ctrl + ></b> — увеличить произносимую длину слога <br>\
<b>Alt + V</b> — переключиться в структурный вид <br>\
<b>Esc</b> — спрятать/показать поле поиска рифмы <br>\
<b>F11</b> — полноэкранный режим <br>\
Обратная связь: <a href="mailto:andr−sitnikov@mail.ru">andr−sitnikov@mail.ru</a>, <a target="_blank" rel="noopener noreferrer" href="https://github.com/sitandr/quickpoeterGUI">GitHub</a>\
' // using html string isn't good, but is convinient for inserting text in corresponding place 

function swap_visibility(el, hide_others = false){
    if (el.style.visibility == "hidden" || el.style.visibility == ''){
        if (hide_others){
            hide_all_dropups();
        }
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
let theme_button = document.getElementsByClassName("theme_button")[0];
let theme_dropup = document.getElementById("theme_dropup");
let rhymes_settings_dropup = document.getElementById("rhymes_settings");

let words_dropup = document.getElementById("words_dropup");


function show_error(error_text){
    let d = document.createElement("span");
    d.appendChild(new Text(error_text));
    d.style.color = "red";
    finder_dropup.textContent = '';
    finder_dropup.appendChild(d);
    hide_all_dropups();
    finder_dropup.style.visibility = "visible";
}

function show_help(){
    let d = document.createElement("span");
    d.innerHTML = HELP_TEXT;
    finder_dropup.textContent = '';
    finder_dropup.appendChild(d);
    swap_visibility(finder_dropup);
}

async function mutate_settings(){
    let sett = await invoke("get_settings");
    console.log(sett);
    for (let prop in sett){
        for (let subprop in sett[prop]){
            if (typeof(sett[prop][subprop]) == 'number'){
                sett[prop][subprop] = (1 + (Math.random() - 0.5)/2) * sett[prop][subprop];
            }
        }
    }
    console.log(sett);
    await invoke("save_settings", {"name": current_settings_name + " ⚅", "gs": sett});
}

document.getElementsByClassName("set_rhymes_button")[0].onclick = () => {
    swap_visibility(rhymes_settings_dropup, true)
};

let current_settings_name = "default";

async function load_settings(name){
    await invoke("load_settings", {"name": name}).then(null, (err) => show_error(err));
}

async function open_settings_folder(){
    let path = await invoke("get_app_data_path");
    let open = window.__TAURI__.shell.open;
    open(path);
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
        b.title = "Мутировать текущие настройки";
        b.classList.add("random_settings_btn");

        b.onclick = () => {
            mutate_settings().then(() => {render_settings()});
        }
        d.appendChild(b)

        b = document.createElement("button");
        b.appendChild(new Text("📂"));
        b.title = "Открыть папку настроек";
        b.classList.add("open_folder_btn");
        b.onclick = () => open_settings_folder();
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

let selected_theme = null;
let available_themes;
let last_selected_theme = null;

function changeSelectedTheme(new_theme){
    last_selected_theme.classList.remove('selected')
    last_selected_theme = new_theme;
    last_selected_theme.classList.add('selected')
}

invoke("get_available_themes").then((res) => {
    res.push("Без смысла");
    res.push("Auto");
    res.push("New");
    available_themes = res;
    for (const theme_name of available_themes){
        let d = document.createElement('div');
        d.appendChild(new Text(theme_name))
        theme_dropup.appendChild(d);
        
        if (theme_name == "Без смысла"){
            d.classList.add("special");

            last_selected_theme = d;
            d.classList.add("selected");

            d.onclick = (e) => {
                selected_theme = null;

                changeSelectedTheme(d)
                theme_button.textContent = theme_name;
                swap_visibility(theme_dropup);
            }
        }
        else if (theme_name == "New"){
            d.classList.add("special");
            
            d.onclick = (e) => {
                swap_visibility(words_dropup);
                changeSelectedTheme(d)

                selected_theme = theme_name;
                theme_button.textContent = theme_name
            }
        }
        else{
            if (theme_name == "Auto"){
                d.classList.add("special");
            }
            d.onclick = (e) => {
                changeSelectedTheme(d)

                selected_theme = theme_name;
                theme_button.textContent = theme_name;
                swap_visibility(theme_dropup);
            }
        }

            
    }
});

cur_but.onclick = function (e){
    swap_visibility(choice_but, true);
}

theme_button.onclick = (e) =>{swap_visibility(theme_dropup, true)};

let finder_input = document.getElementsByClassName("finder_input")[0];
let finder_dropup = document.getElementById("finder_dropup");
let theme_word_input = document.getElementById("input_theme_word");

function hide_all_dropups(){
    finder_dropup.style.visibility = 'hidden';
    theme_dropup.style.visibility = 'hidden';
    rhymes_settings_dropup.style.visibility = 'hidden';
    choice_but.style.visibility = 'hidden';
}

theme_word_input.addEventListener('input', (e) => e.target.value = e.target.value.replaceAll(/[^а-яё]/gi, ''));

let selected_theme_words = [];
theme_word_input.onkeydown = (e) => {
    if (e.key == "Enter"){
        let word = theme_word_input.value;
        selected_theme_words.push(word);

        let div = document.createElement("div");        
        div.appendChild(new Text(word));
        let close = document.createElement('span');
        close.appendChild(new Text('×'))
        div.appendChild(close);
        theme_word_input.value = '';
        words_dropup.insertBefore(div, theme_word_input);

        close.onclick = (e) => {
            words_dropup.removeChild(div);
            selected_theme_words.splice(selected_theme_words.indexOf(word), 1)
            //TODO: remove selected
        }
    }
}

let get_rhymes_id_obj;
let get_rhymes = async function(word, n=100){
    let local_obj = get_rhymes_id_obj = new Object();
    let text;
    if (selected_theme == "New"){
        text = selected_theme_words;
    }
    else{
        text = ed.text;
    }

    let result = await invoke("get_rhymes", {"word": word, "topN": n, "mean": selected_theme, "text": text})
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

                    for (let prop in word){
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
            finder_dropup.style.visibility = 'inherit';
        }, (err) => {show_error(err)})
    }
};


let asson_but = document.getElementById("asson_but");
let allit_but = document.getElementById("allit_but");
let stress_but = document.getElementById("stress_but");
let no_col_but = document.getElementById("no_col_but");

asson_but.onclick = (e) => {
    ed.colorify_func = colorifier.colorify_assonanses;
    ed.editorUPD();
    cur_but.firstChild.data = "Ассонансы";
};

allit_but.onclick = (e) => {
    ed.colorify_func = colorifier.colorify_alliteration;
    ed.editorUPD();
    cur_but.firstChild.data = "Аллитерация";
};

stress_but.onclick = (e) => {
    ed.colorify_func = colorifier.colorify_stresses;
    ed.editorUPD();
    cur_but.firstChild.data = "Ударения";
};

no_col_but.onclick = (e) => {
    ed.colorify_func = null;
    ed.editorUPD();
    cur_but.firstChild.data = "Без подсветки";
}

document.getElementsByClassName("structure_button")[0].onclick = (e) => {
	ed.structure_mode = !ed.structure_mode;
    ed.editorUPD();
}

document.getElementsByClassName("set_stress_button")[0].onclick = (e) => {
	ed.addStress();
}

document.getElementsByClassName("help_button")[0].onclick = (e) => {
    show_help();
}

/*document.getElementByClass("full_screen_button")[0].onclick() => {
	let isFull = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFull);
}*/

document.onkeydown = async (e) => {
    if (e.key == "Escape"){
        swap_visibility(finder_dropup, true);
    }
    else if (e.code == "KeyV" && e.altKey){
        // Alt + V — alternative view (squares)
        ed.structure_mode = !ed.structure_mode;
        ed.editorUPD();
    }
    else if (e.code == "KeyS" && e.ctrlKey){
        invoke("save_text_file", {'text': ed.text}).then(undefined, (err) => {show_error(err)})
    }
    else if (e.code == "F11"){
        let isFull = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFull);
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
