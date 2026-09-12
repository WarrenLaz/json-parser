import { Stack } from '@opensource-technologies/typescript-data-structure-library';

function createNewEntry( currObj: Object, mykey: any, value : any) : Object{
  return {...currObj, [mykey] : value}
}

function putNewObject(currObj: Object, newObj : Object) : Object{
    return {...currObj, newObj}
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
            word += c;
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
                tokens.push(word);
                word = "";
            }
        }
    }

    if (isQuote || stack.length !== 0) {
        throw new SyntaxError("Invalid JSON: Unclosed structure");
    }
    
    return tokens;
}


export function json(raw: string): Object {
  let result : Object = {};


  return result;
}

console.log(lexer("{\"abcd\" : \"abds\", abs:1}"))