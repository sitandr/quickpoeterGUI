#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


// use clap::Parser;
// use tauri::{CustomMenuItem, Menu, Submenu};
use quickpoeter::meaner::MeanField;
use tauri::command;
use quickpoeter::finder::{WordCollector};
use quickpoeter::reader::MeanStrFields;
use quickpoeter::api::{find, find_from_args, Args, string2word};

use lazy_static::lazy_static;

lazy_static! {
    static ref WC: WordCollector = WordCollector::load_default();
}

lazy_static! {
    static ref MF: MeanStrFields = MeanStrFields::load_default();
}


#[command(async)]
fn get_rhymes(word: String, top_n: u32, mean: Option<String>, text: Vec<String>) -> Result<Vec<&'static str>, String>{
    Ok(
        if mean == Some("Auto".to_string()){
            find(&WC, string2word(&WC, word)?, MeanField::from_strings_filter(&WC, &select_words_from_text(text)).as_ref(), &vec![], top_n)
        }
        else if mean == Some("New".to_string()){
            find(&WC, string2word(&WC, word)?, Some(&MeanField::from_str(&WC, &text.iter().map(|s| &**s).collect())
                                                    .map_err(|words| format!("Unknown words: {:?}", words))?), &vec![], top_n)
        }
        else{
            find_from_args(&WC, &MF, Args{to_find: word, field: mean, rps: None, top_n: top_n})?
        }
        .into_iter().map(|wdr| &*wdr.word.src).collect()
    )
}

fn select_words_from_text(text: Vec<String>) -> Vec<String>{
    text.iter().map(|s|
        String::from_iter(s.to_lowercase().chars().map(|c|
            match c{
                'а' ..= 'я' => c,
                'ё'|' ' => c,
                _ => ' '
            }))
        .split(' ').map(|s| s.to_string()).filter(|s| s.len() > 0).collect::<Vec<_>>()).flatten().collect()
}

#[command(async)]
fn find_stresses(word: &str) -> Option<(usize, Vec<usize>)>{
    WC.get_word(word).and_then(|w| Some(w.get_stresses()))
}

#[command(async)]
fn get_available_fields() -> Vec<&'static str>{
    MF.str_fields.keys().map(|s| &**s).collect()
}

#[command(async)]
fn load_data(){
    lazy_static::initialize(&WC);
}


fn main() {
    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
 /*   let quit = CustomMenuItem::new("quit".to_string(), "Выйти");
    let mut save = CustomMenuItem::new("save".to_string(), "Сохранить");
//    save = save.accelerator("Alt+S");//CmdOrControl+S");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(save));
    let menu = Menu::new()
      .add_submenu(submenu)
      .add_item(CustomMenuItem::new("help", "Помощь"));
*/
    tauri::Builder::default()
 /*       .setup(|_| {
            println!("{:?}, {}", std::env::args_os(), std::env::args_os().len());
            if std::env::args_os().len() > 1{
                let args = Args::try_parse().expect("Error while parsing CLI");
                println!("{:?}", find_from_args(&WC, &MF, args));
            }
            Ok(())
        })*/
/*        .menu(menu)
        .on_menu_event(|event| {
            let window = event.window();
            match event.menu_item_id() {
                "quit" => {
                    std::process::exit(0);
                }
                "save" => {
                    window.emit("save", ()).unwrap();
                    println!("Save button clicked");
                }
                _ => {}
            }
        })*/
        .invoke_handler(tauri::generate_handler![find_stresses, load_data, get_rhymes, get_available_fields])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
