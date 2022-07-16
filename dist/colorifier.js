// With the Tauri API npm package:
// import { invoke } from '@tauri-apps/api/tauri'

// With the Tauri global script, enabled when `tauri.conf.json > build > withGlobalTauri` is set to true:
const invoke = window.__TAURI__.invoke;
const WORD = /(?=([а-яё́]*))\1/gi;
//const SYLL = /(?=([аоэуыиюеёюя]?))\1(?=([бвгджзйклмнпрстфхцчшщ]*))\2/gi;
const VOWEL = /[аоэуыиюеёюя]/gi;

//0        Т С   Ч
//1 РЛНМ П     Ш
//2        К Х  Ф

alliteration = {
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

assonanses = {
	"О": "hsl(0, 80%, 70%)",
	"Ё": "hsl(0, 80%, 70%)",
	"А": "hsl(30, 80%, 70%)",
	"Я": "hsl(30, 80%, 70%)",
	"Э": "hsl(60, 80%, 70%)",
	"Е": "hsl(60, 80%, 70%)",
	"У": "hsl(140, 80%, 70%)",
	"Ю": "hsl(140, 80%, 70%)",
	"И": "hsl(-80, 80%, 70%)",
	"Ы": "hsl(-50, 80%, 70%)",
}

PRIMARY_STRESS = "hsl(70, 80%, 70%)";
SECONDARY_STRESS = "hsl(10, 80%, 70%)";
NO_STRESS = "hsl(150, 70%, 50%)";
UNKNOWN_STRESS = "hsl(-80, 80%, 70%)";

let cashed_stresses = {};


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

async function get_stresses(word){
	word = word.toLowerCase();
	if (!(word in cashed_stresses)){
		cashed_stresses[word] = await invoke("find_stresses", {"word": word});
	}
	return cashed_stresses[word];
}


class Colorifier{
	static colorify_alliteration = makeSingle(function*(text){
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

	static colorify_assonanses = makeSingle(function*(text){
		let stresses = yield Colorifier.colorify_stresses(text);
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

	static colorify_stresses = makeSingle(function*(text){
		let colors = [];
		for (let i=0; i<text.length; i++){
			let line = text[i];
			colors.push(new Array(line.length).fill("inherit"));
			let word_matches = line.matchAll(WORD);

			for (const match of word_matches){
				let word = match[0];

				if (word.length == 0){
					continue;
				}

				let vowels = Array.from(word.matchAll(VOWEL));
				let stresses;
				let user_stressed = word.includes("́")
				if (vowels.length > 1 && !user_stressed){
					stresses = yield get_stresses(word);
				}

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
						if (stresses == null){
							col = UNKNOWN_STRESS;
						}
						else if (j == stresses[0]){
							col = PRIMARY_STRESS;
						}
						else if (stresses[1].includes(j)){
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

/*Colorifier.colorify_assonanses = makeSingle(Colorifier.colorify_assonanses);
Colorifier.colorify_alliteration = makeSingle(Colorifier.colorify_assonanses);
Colorifier.colorify_stresses = makeSingle(Colorifier.colorify_assonanses);*/