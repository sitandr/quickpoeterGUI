#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use std::fs;
// use clap::Parser;
// use tauri::{CustomMenuItem, Menu, Submenu};
use std::io::Read;
use std::io::BufReader;
use std::fs::File;
use std::sync::RwLock;
use quickpoeter::finder::WordDistanceResult;
use quickpoeter::meaner::MeanTheme;
use quickpoeter::reader;
use quickpoeter::reader::GeneralSettings;
use tauri::command;
use quickpoeter::finder::{WordCollector};
use quickpoeter::reader::MeanStrThemes;
use quickpoeter::api::{find, find_from_args, Args, string2word};

use lazy_static::lazy_static;


lazy_static! {
    static ref WC: WordCollector = WordCollector::load_default();
    static ref MF: MeanStrThemes = MeanStrThemes::load_default();
    static ref GS: RwLock<GeneralSettings> = RwLock::new(GeneralSettings::load_default());
    static ref APP_DATA_PATH: String= {
        let mut path = tauri::api::path::data_dir().unwrap();
        path.push("Quickpoeter");
        let my_dir = path.into_os_string().into_string().unwrap();
        std::fs::create_dir_all(&my_dir).unwrap();
        my_dir
    };
    static ref DEFAULT_TEXT_FILE: String = {
        let mut path = tauri::api::path::data_dir().unwrap();
        path.push("Quickpoeter");
        path.push("current_text");
        path.set_extension("txt");
        path.into_os_string().into_string().unwrap()
    };
}


#[command(async)]
fn get_rhymes(word: String, top_n: u32, mean: Option<String>, text: Vec<String>) -> Result<Vec<WordDistanceResult<'static>>, String>{
    Ok(
        if mean == Some("Auto".to_string()){
            find(&WC, &GS.read().unwrap(), string2word(&WC, &word)?, MeanTheme::from_strings_filter(&WC, &select_words_from_text(text)).as_ref(), &vec![], top_n)
        }
        else if mean == Some("New".to_string()){
            find(&WC, &GS.read().unwrap(), string2word(&WC, &word)?, Some(&MeanTheme::from_str(&WC, &text.iter().map(|s| &**s).collect())
                                                    .map_err(|words| format!("Unknown words: {:?}", words))?), &vec![], top_n)
        }
        else{
            find_from_args(&WC, &MF, &GS.read().unwrap(), &Args{to_find: word, theme: mean, rps: None, top_n, debug: false, measure: None})?
        }
        .into_iter().collect()
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
fn find_stress(word: &str) -> Option<(usize, Option<usize>)>{
    WC.get_word(word).and_then(|w| Some(w.get_stresses()))
}

#[command(async)]
fn find_stresses(words: Vec<&str>) -> Vec<Option<(usize, Option<usize>)>>{
    words.into_iter().map(|w| find_stress(&*w.to_lowercase())).collect()
}

#[command(async)]
fn get_available_themes() -> Vec<&'static str>{
    MF.str_themes.keys().map(|s| &**s).collect()
}

#[command(async)]
fn load_data(){
    lazy_static::initialize(&WC);
}

#[command(async)]
fn load_settings(name: &str) -> Result<(), String>{
    let mut gs = GS.write().unwrap();
    *gs = match name{
        "default" => reader::yaml_read("config/coefficients.yaml")?,
        _ => {
            let mut path = APP_DATA_PATH.clone();
            path.push_str("/coefficients/");
            
            path.push_str(name);
            path.push_str(".yaml");
            reader::yaml_read(&*path)?
        }
    };
    Ok(())
}

#[command]
fn get_app_data_path() -> &'static str{
    &*APP_DATA_PATH
}

#[command]
fn get_available_settings() -> Vec<String>{
    let mut res = vec![];
    let coeff = format!("{}/coefficients", APP_DATA_PATH.as_str());
    std::fs::create_dir_all(&coeff).map_err(|err| err.to_string()).unwrap();
    for entry in fs::read_dir(coeff).expect("Can't access data dir"){
        let name = entry.expect("Error at file parsing").file_name().into_string().expect("Not valid UTF in filename");
        if name.ends_with(".yaml"){
            res.push(name.strip_suffix(".yaml").unwrap().to_string())
        }
    }
    res
}

#[command(async)]
fn save_settings(name: &str, gs: GeneralSettings){
    let path = format!("{}/coefficients/{}.yaml", APP_DATA_PATH.as_str(), name);
    let buffer = File::create(path).expect("Error while opening settings for writing");
    serde_yaml::to_writer(buffer, &gs).expect("Error while writing");
}

#[command(async)]
fn load_text_file() -> Result<Vec<String>, String>{
    dbg!(&**DEFAULT_TEXT_FILE);
    read_text_file(&**DEFAULT_TEXT_FILE).or_else(|err| match err.kind(){
        std::io::ErrorKind::NotFound => Ok("".to_string()),
        _ => Err(err)
    }).map_err(|err| format!("Could not open text: {}", err)).map(|text| text.split('\n').map(|s| s.to_string()).collect())
}

fn read_text_file(path: &str) -> Result<String, std::io::Error>{
    let f = File::open(path)?;
    let mut buf_reader = BufReader::new(f);
    let mut contents = String::new();
    buf_reader.read_to_string(&mut contents)?;
    Ok(contents)
}

#[command(async)]
fn save_text_file(text: Vec<String>) -> Result<(), String>{
    let text = text.join("\n");
    std::fs::write(&**DEFAULT_TEXT_FILE, text).map_err(|err| format!("Could not write text: {}", err))
}

#[command(async)]
fn get_settings() -> GeneralSettings{
    (*GS.read().unwrap()).clone()
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
        .invoke_handler(tauri::generate_handler![find_stresses, load_data, get_rhymes, get_available_themes,
                                                load_text_file, save_text_file, get_app_data_path,
                                                get_settings, load_settings, get_available_settings, save_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
