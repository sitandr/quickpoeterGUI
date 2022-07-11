#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tauri::command;
use quickpoeter::finder::{WordCollector};
use lazy_static::lazy_static;

lazy_static! {
    static ref WC: WordCollector = WordCollector::load_default();
}

#[command]
fn my_custom_command(l: &str) -> String{
		let l = l.as_bytes()[0];
		let s: String = format!("{:X}{:X}{:X}", l, l, l);
		"#".to_owned() + &s
}

#[command(async)]
fn find_stresses(word: &str) -> Option<(usize, Vec<usize>)>{
    WC.get_word(word).and_then(|w| Some(w.get_stresses()))
}

#[command(async)]
fn load_data(){
    lazy_static::initialize(&WC);
}


fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![my_custom_command, find_stresses, load_data])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
