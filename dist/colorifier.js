// With the Tauri API npm package:
// import { invoke } from '@tauri-apps/api/tauri'

// With the Tauri global script, enabled when `tauri.conf.json > build > withGlobalTauri` is set to true:
const invoke = window.__TAURI__.invoke;

//0        Т С   Ч
//1 РЛНМ П     Ш
//2        К Х  Ф

assonanses = {
	"Р": "hsl(160, 80%, 40%)",
	"Л": "hsl(150, 80%, 40%)",
	"Н": "hsl(140, 80%, 40%)",
	"М": "hsl(120, 80%, 40%)",
	"П": "hsl(80, 100%, 60%)",
	"Т": "hsl(50, 100%, 60%)",
	"К": "hsl(40, 80%,  55%)",
	"С": "hsl(30, 100%, 70%)",
	"Ш": "hsl(0,   70%, 80%)",
	"Ч": "hsl(-40, 80%, 80%)",

	"Х": "hsl(20, 80%,  55%)",
	"Ф": "hsl(13, 80%,  55%)",

	"Б": "hsl(80, 100%, 30%)", // п*
	"В": "hsl(13, 70%,  40%)", // ф*
	"Г": "hsl(40, 80%,  30%)", // к*
	"Д": "hsl(50, 100%, 35%)", // т*
	"Ж": "hsl(0,   70%, 60%)", // ш*
	"З": "hsl(50, 100%, 40%)", // с*
	"Ц": "hsl(40, 100%, 70%)", // тс
	"Щ": "hsl(0,   90%, 80%)", // ш^
	"Й": "hsl(-80, 60%, 60%)", // j
};

/*
 о 
  а э 
           
у     ы
        и
*/

alliteration = {
	"О": "hsl(0, 80%, 70%)",
	"А": "hsl(30, 80%, 70%)",
	"Э": "hsl(60, 80%, 70%)",
	"У": "hsl(140, 80%, 70%)",
	"И": "hsl(-80, 80%, 70%)",
	"Ы": "hsl(-50, 80%, 70%)",
}

class Colorifier{
	static colorify_assonanses(text){
		return new Promise(function(resolve, reject){
			let colors = [];
			for (let i=0; i<text.length; i++){
				let line = text[i];
				colors.push([]);
				for (let j=0; j<line.length; j++){
					let l = line[j].toUpperCase();
					if (l in assonanses){
						colors[i].push(assonanses[l]);
					}
					else{
						colors[i].push("inherit");
					}
				}
			}
			resolve(colors);
		});
	}

	static colorify_alliteration(text){
		let colors = [];
		for (let i=0; i<text.length; i++){
			let line = text[i];
			colors.push([]);
			for (let j=0; j<line.length; j++){
				let l = line[j].toUpperCase();
				if (l in alliteration){
					colors[i].push(alliteration[l]);
				}
				else{
					colors[i].push("inherit");
				}
			}
		}
		return colors;
	}

	static colorify_stresses(text){

	}
}