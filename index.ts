function typeResolver(token: string): any{
    if(!isNaN(Number(token)) && String(token).trim() !== ""){
        return Number(token);
    }
    if(token =="null")
        return null
    if(token == "true")
        return true;
    if(token == "false")
        return false;
    return token;
}

function lexer(raw: string): Array<any> {
    let tokens: Array<any> = [];
    let word: string = "";
    let isQuote: boolean = false;
    const stack: string[] = [];
    const closeToOpen: Record<string, string> = {
        ')': '(',
        ']': '[',
        '}': '{',
    };

    // Use regular expressions for set inclusion testing
    const brackets = /^[}{[\]()]$/;
    const structural = /^[:,]$/;

    for (let i = 0; i < raw.length; i++) {
        const c = raw[i];

        // 1. Handle Strings & Quotes
        if (c === '"') {
            if (!isQuote) {
                isQuote = true;
            } else {
                isQuote = false;
                tokens.push(word);
                word = "";
            }
            continue; // Skip structural checks if we are processing string flags
        }

        // 2. Accumulate inner string text and skip whitespace inside strings
        if (isQuote) {
            word += c;
            continue; 
        }

        // 3. Skip standalone whitespace outside of string values
        if (/\s/.test(c)) {
            continue;
        }

        // 4. Handle Bracket Validation
        if (brackets.test(c)) {
            if (closeToOpen[c]) {
                if (stack.length > 0 && stack[stack.length - 1] === closeToOpen[c]) {
                    stack.pop();
                } else {
                    throw new SyntaxError("Invalid JSON: Mismatched brackets");
                }
            } else {
                stack.push(c);
            }
            tokens.push(c);
            continue;
        }

        // 5. Handle structural JSON separators
        if (structural.test(c)) {
            tokens.push(c);
            continue;
        }

        // 6. Accumulate other primitive raw literals (true, false, null, numbers)
        word += c;
        
        // Peek ahead to see if the primitive literal is finished
        const next = raw[i + 1];
        if (!next || /\s/.test(next) || brackets.test(next) || structural.test(next) || next === '"') {
            if (word.trim()) {
                tokens.push(typeResolver(word));
                word = "";
            }
        }
    }

    if (isQuote || stack.length !== 0) {
        throw new SyntaxError("Invalid JSON: Unclosed structure");
    }
    
    return tokens;
}


function createNewEntry( currObj: Object, mykey: any, value : any) : Object{
  return {...currObj, [mykey] : value}
}

function parser(tokens: Array<any>): Object{
    // keep objects in a stack. the top most is the current object
    let stack: Array<Array<any>> = [];
    //store the key to later construct an entry
    let key: any = null;
    //iterate until the last token which will always end with a "}" [closing bracket]
    for(let i=0; i < tokens.length-1; i++){
        let token = tokens[i];
        //opening bracket signals creation of a new object
        if(token == "{"){
            stack.push([key,{}]);
        }
        if(token == "["){
            stack.push([key,[]]);
        }
        //closing bracket constructs the object and adds it to the parent
        if(token == "}"){
            stack[stack.length-1][1]=createNewEntry(stack[stack.length-1][1], key, tokens[i-1]);
            let previous = stack.pop()!;
            stack[stack.length-1][1]=createNewEntry(stack[stack.length-1][1], previous[0], previous[1]);
            if(tokens[i+1]==",")
                i++;
            continue;
        }
        if(token == "]"){
            stack[stack.length-1][1].push(tokens[i-1])
            let previous = stack.pop()!;
            stack[stack.length-1][1]=createNewEntry(stack[stack.length-1][1], previous[0], previous[1]);
            if(tokens[i+1]==",")
                i++;
            continue;
        }

        if(Array.isArray(stack[stack.length-1][1])){
            if(token == ","){
                stack[stack.length-1][1].push(tokens[i-1])
            }
        } else{
            //the previous token of a semicolon will always be a key
            if(token == ":"){
                key = tokens[i-1];
            }
            if(token == ","){
                stack[stack.length-1][1]=createNewEntry(stack[stack.length-1][1], key, tokens[i-1]);
            }
            if(i == tokens.length-2){
             stack[stack.length-1][1]=createNewEntry(stack[stack.length-1][1], key, tokens[i]);
            }
        }
    }
    return stack.pop()![1];

}

export function json(raw: string): Object {
  let tokens : Array<any> = lexer(raw);
  return parser(tokens);
}
const raw = "{\"glossary\":{\"title\":\"example glossary\",\"GlossDiv\":{\"title\":\"S\",\"GlossList\":{\"GlossEntry\":{\"ID\":\"SGML\",\"SortAs\":\"SGML\",\"GlossTerm\":\"Standard Generalized Markup Language\",\"Acronym\":\"SGML\",\"Abbrev\":\"ISO 8879:1986\",\"GlossDef\":{\"para\":\"A meta-markup language, used to create markup languages such as DocBook.\",\"GlossSeeAlso\":[\"GML\",\"XML\"]},\"GlossSee\":\"markup\"}}}}}";
console.log(json(raw))