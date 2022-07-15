/*import { clipboard } from 'electron';
const {execSync} = require('child_process');*/

String.prototype.insertAt = function(index, string)
{   
  return this.substr(0, index) + string + this.substr(index);
}


let readClipText = window.__TAURI__.clipboard.readText;

let cur_but = document.getElementsByClassName("current_but")[0];
let choice_but = document.getElementsByClassName("choice_but")[0];
let status_bar = document.getElementsByClassName("status")[0];

let editor = document.getElementsByClassName("editor")[0];
let ed = new colorEditor(editor);

let finder_panel = document.getElementsByClassName("finder_panel")[0];
let field_button = document.getElementsByClassName("field_button")[0];
let field_dropup = document.getElementById("field_dropup");


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
    available_fields = res;
    for (const field_name of available_fields){
        let d = document.createElement('div');
        d.appendChild(new Text(field_name))
        field_dropup.appendChild(d);
        d.onclick = (e) => {
            if (field_name == "Без поля"){
                selected_field = null;
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
    if (choice_but.style.visibility == "hidden"){
        choice_but.style.visibility = "inherit";
    }
    else{
        choice_but.style.visibility = "hidden";
    }
}

field_button.onclick = (e) =>{
    if (field_dropup.style.visibility == "hidden"){
        field_dropup.style.visibility = "inherit";
    }
    else{
        field_dropup.style.visibility = "hidden";
    }
};

let finder_input = document.getElementsByClassName("finder_input")[0];
let finder_dropup = document.getElementById("finder_dropup");

let get_rhymes_id_obj;
let get_rhymes = async function(word, n=100){
    let local_obj = get_rhymes_id_obj = new Object();
    let result = await invoke("get_rhymes", {"word": word, "topN": n, "mean": selected_field})
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
            finder_dropup.appendChild(d);
            finder_dropup.style.visibility = "visible";
        }) // .replace("'", "́")
    }
};


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

document.onkeydown = (e) => {
    if (e.key == "Alt"){
        ed.structure_mode = !ed.structure_mode;
        ed.editorUPD();
        e.preventDefault();
    }
    else if (e.key == "Escape"){
        if (finder_dropup.style.visibility == "hidden"){
            finder_dropup.style.visibility = "inherit";
        }
        else{
            finder_dropup.style.visibility = "hidden";
        }
    }
};