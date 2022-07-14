#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tauri::command;
use quickpoeter::finder::{WordCollector};
use quickpoeter::reader::MeanStrFields;
use quickpoeter::api::{find_from_args, Args};

use lazy_static::lazy_static;

lazy_static! {
    static ref WC: WordCollector = WordCollector::load_default();
}

lazy_static! {
    static ref MF: MeanStrFields = MeanStrFields::load_default();
}

#[command(async)]
fn get_rhymes(word: String, top_n: u32, mean: Option<String>) -> Result<Vec<&'static str>, String>{
    let r = find_from_args(&WC, &MF, Args{to_find: word, mean: mean, rps: None, top_n: top_n})
        .and_then(|wdresults| Ok(wdresults.into_iter().map(|wdr| &*wdr.word.src).collect()));
        r
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
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![find_stresses, load_data, get_rhymes, get_available_fields])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
