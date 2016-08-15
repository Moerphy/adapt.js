let regex_letter_number = "[a-zA-Z0-9]";
let regex_not_letter_number = "[^a-zA-Z0-9]";
let regex_separator = "[\\?!()\";/\\|`]";
let regex_clitics = "'|:|-|'S|'D|'M|'LL|'RE|'VE|N'T|'s|'d|'m|'ll|'re|'ve|n't"
let abbreviations_list = [ "Co.", "Corp.",
            "vs.", "e.g.", "etc.", "ex.", "cf.", "eg.", "Jan.", "Feb.", "Mar.",
            "Apr.", "Jun.", "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
            "jan.", "feb.", "mar.", "apr.", "jun.", "jul.", "aug.", "sept.",
            "oct.", "nov.", "dec.", "ed.", "eds.", "repr.", "trans.", "vol.",
            "vols.", "rev.", "est.", "b.", "m.", "bur.", "d.", "r.", "M.",
            "Dept.", "MM.", "U.", "Mr.", "Jr.", "Ms.", "Mme.", "Mrs.", "Dr.",
            "Ph.D."];

class EnglishTokenizer{

  tokenize(str){
    let s = str;
    s = s.replace('\t', " ", s);
    s = s.replace(new RegExp("(" + regex_separator + ")", 'g'), " $1 ");
    s = s.replace(new RegExp("([^0-9]),", 'g'), "$1 , ");
    s = s.replace(new RegExp(",([^0-9])", 'g'), " , $1");
    s = s.replace(new RegExp("^(')", 'g'), "$1 ");
    s = s.replace(new RegExp("(" + regex_not_letter_number + ")'", 'g'), "$1 '");
    s = s.replace(new RegExp("(" + regex_clitics + ")$", 'g'), " $1");
    s = s.replace(new RegExp("(" + regex_clitics + ")(" + regex_not_letter_number + ")", 'g'), " $1 $2");

    let words = s.trim().split(/\s/);
    let p1 = new RegExp(".*" + regex_letter_number + "\\.");
    let p2 = new RegExp("^([A-Za-z]\\.([A-Za-z]\\.)+|[A-Z][bcdfghj-nptvxz]+\\.)$");

    let token_list = []

    for(let word of words){
      if(word){
        let m1 = word.match(p1);
        let m2 = word.match(p2);
        if(m1 && abbreviations_list.indexOf(word) < 0 && !m2){
          token_list.push(word.slice(0, word.indexOf('.')));
          token_list.push(word.slice(word.indexOf('.')));
        }else{
          token_list.push(word);
        }
      }
    }

    return token_list;
  }
}

function tokenize_string(text){
  let tk = new EnglishTokenizer();
  return tk.tokenize(text);
};

export { EnglishTokenizer, tokenize_string };