// With the Tauri API npm package:
// import { invoke } from '@tauri-apps/api/tauri'

// With the Tauri global script, enabled when `tauri.conf.json > build > withGlobalTauri` is set to true:
const invoke = window.__TAURI__.invoke;
const WORD = /(?=([а-яё́›‹¦]+))\1/gi;
//const SYLL = /(?=([аоэуыиюеёюя]?))\1(?=([бвгджзйклмнпрстфхцчшщ]*))\2/gi;
const VOWEL = /[аоэуыиюеёюя]/gi;
const PAUSE = /¦/gi;

//0        Т С   Ч
//1 РЛНМ П     Ш
//2        К Х  Ф

const alliteration = {
	"Р": "hsl(160, 80%, 40%)",
	"Л": "hsl(150, 80%, 40%)",
	"Н": "hsl(140, 80%, 40%)",
	"М": "hsl(120, 80%, 40%)",
	"П": "hsl(80, 100%, 60%)",
	"Т": "hsl(50, 100%, 60%)",
	"К": "hsl(40, 80%,  55%)",
	"С": "hsl(30, 100%, 70%)",
	"Ш": "hsl(0,   70%, 80%)",
	"Ч": "hsl(320, 80%, 80%)",

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
	"Й": "hsl(280, 60%, 60%)", // j
};

/*
 о 
  а  э
        и    
у     ы
*/

export const assonanses = {
	"О": "hsl(0, 80%, 70%)",
	"Ё": "hsl(0, 80%, 70%)",
	"А": "hsl(30, 80%, 70%)",
	"Я": "hsl(30, 80%, 70%)",
	"Э": "hsl(60, 80%, 70%)",
	"Е": "hsl(60, 80%, 70%)",
	"У": "hsl(200, 80%, 70%)",
	"Ю": "hsl(200, 80%, 70%)",
	"И": "hsl(120, 80%, 72%)",
	"Ы": "hsl(157, 80%, 65%)",
}

const PRIMARY_STRESS = "hsl(70, 80%, 70%)";
const SECONDARY_STRESS = "hsl(10, 80%, 70%)";
const NO_STRESS = "hsl(150, 70%, 50%)";
const UNKNOWN_STRESS = "hsl(300, 80%, 70%)";
const PAUSE_COLOR = "hsl(280, 60%, 50%)";

function makeSingle(generator) { // function copied from some site to cancel not actual calls of async
  let globalNonce;
  return async function(...args) {
    const localNonce = globalNonce = new Object();

    const iter = generator(...args);
    let resumeValue;
    for (;;) {
      const n = iter.next(resumeValue);

      // whatever the generator yielded, _now_ run await on it
      resumeValue = await n.value;
      if (localNonce !== globalNonce) {
        return;  // a new call was made
      }

	  if (n.done) {
        return n.value;  // final return value of passed generator
      }
      // next loop, we give resumeValue back to the generator
    }
  };
}

export class Colorifier{
	constructor(){

		let self = this;
		
		this.colorify_alliteration = makeSingle(function*(text){
			let colors = [];
			for (let i=0; i<text.length; i++){
				let line = text[i];
				colors.push(new Array(line.length).fill("inherit"));
				for (let j=0; j<line.length; j++){
					let l = line[j].toUpperCase();
					if (l in alliteration){
						colors[i][j] = alliteration[l];
					}
				}
			}
			return colors;
		});

		this.colorify_assonanses = makeSingle(function*(text){
			console.log(self);
			let stresses = yield self.colorify_stresses(text);
			let colors = [];
			for (let i=0; i<text.length; i++){
				let line = text[i];
				colors.push(new Array(line.length).fill("inherit"));
				for (let j=0; j<line.length; j++){
					let l = line[j].toUpperCase();

					if (l == 'О' && stresses[i][j] == NO_STRESS){
						l = 'А';
					}
					if (l in assonanses){
						colors[i][j] = assonanses[l];
					}
				}
			}
			return colors;
		});

		this.colorify_stresses = makeSingle(function*(text){
			let colors = [];
			for (let i=0; i<text.length; i++){
				let line = text[i];
				colors.push(new Array(line.length).fill("inherit"));
				let pauses_m = line.matchAll(PAUSE);
				for (const match of pauses_m){
					colors[i][match.index] = PAUSE_COLOR;
				}
				let word_matches = Array.from(line.matchAll(WORD));
				let all_stresses = yield invoke("find_stresses", {"words":
												 word_matches.map((m) => 
												 m[0].replace(/[›‹¦]/g, ""))});

				for (let ind = 0; ind < all_stresses.length; ind++){
					let match = word_matches[ind];
					let stresses = all_stresses[ind];
					let word = match[0];

					if (word.length == 0){
						continue;
					}

					let vowels = Array.from(word.matchAll(VOWEL));
					let user_stressed = word.includes("́")

					let j = 0;

					for (const v_match of vowels){
						let v = v_match[0];
						
						let col = NO_STRESS;

						if (user_stressed){
							if (word[v_match.index + 1] == "́"){
								col = PRIMARY_STRESS;
							}
						}
						else if (vowels.length == 1){
							col = SECONDARY_STRESS;
						}
						else{
							if (word[v_match.index] == "ё"){
								col = PRIMARY_STRESS;
							}
							else if (stresses == null){
								col = UNKNOWN_STRESS;
							}
							else if (j == stresses[0]){
								col = PRIMARY_STRESS;
							}
							else if (j == stresses[1]){
								col = SECONDARY_STRESS;
							}
						}

						let c_lett_num = match.index + v_match.index;
						colors[i][c_lett_num] = col;
						j++;
					}
				} 
			}
			return colors;
		});
	}
}

/*Colorifier.colorify_assonanses = makeSingle(Colorifier.colorify_assonanses);
Colorifier.colorify_alliteration = makeSingle(Colorifier.colorify_assonanses);
Colorifier.colorify_stresses = makeSingle(Colorifier.colorify_assonanses);*/
