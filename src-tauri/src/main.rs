#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn my_custom_command(l: &str) -> String{
    let l = l.as_bytes()[0];
    let s: String = format!("{:X}{:X}{:X}", l, l, l);
    "#".to_owned() + &s
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![my_custom_command])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
