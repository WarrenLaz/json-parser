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

const PUNCT = ["{", "}", "[", "]", ":", ","];

function parser(tokens: Array<any>): Object {
    // keep containers in a stack as [key in parent, container]. the top is the current one
    let stack: Array<[any, any]> = [];
    //store the key to later construct an entry
    let key: any = null;
    let result: any = undefined;
    //what kind of token is allowed next
    let expect: "value" | "valueOrClose" | "key" | "keyOrClose" | "colon" | "commaOrClose" | "end" = "value";

    //put a finished value into the current container, or make it the result if there is none
    function addValue(k: any, value: any): void {
        if (stack.length === 0) {
            result = value;
            expect = "end";
            return;
        }
        const top = stack[stack.length - 1];
        if (Array.isArray(top[1])) {
            top[1].push(value);
        } else {
            top[1] = createNewEntry(top[1], k, value);
        }
        expect = "commaOrClose";
    }

    //closing bracket pops the container and adds it to its parent
    function close(): void {
        const previous = stack.pop()!;
        addValue(previous[0], previous[1]);
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const top = stack[stack.length - 1];

        if ((expect as string) === "end") {
            throw new SyntaxError(`Invalid JSON: Unexpected trailing token at ${i}`);
        }

        if (expect === "colon") {
            if (token !== ":") throw new SyntaxError(`Invalid JSON: Expected ":" at token ${i}`);
            expect = "value";
            continue;
        }

        if (expect === "key" || expect === "keyOrClose") {
            //empty object
            if (token === "}" && expect === "keyOrClose") {
                close();
                continue;
            }
            if (typeof token !== "string" || PUNCT.includes(token)) {
                throw new SyntaxError(`Invalid JSON: Expected string key at token ${i}`);
            }
            key = token;
            expect = "colon";
            continue;
        }

        if ((expect as typeof expect) === "commaOrClose") {
            const isArray = Array.isArray(top[1]);
            if (token === ",") {
                expect = isArray ? "value" : "key";
                continue;
            }
            if (token === (isArray ? "]" : "}")) {
                close();
                continue;
            }
            throw new SyntaxError(`Invalid JSON: Expected "," or "${isArray ? "]" : "}"}" at token ${i}`);
        }

        //expect is "value" or "valueOrClose"
        //empty array
        if (token === "]" && expect === "valueOrClose") {
            close();
            continue;
        }
        //opening bracket signals creation of a new container
        if (token === "{") {
            stack.push([key, {}]);
            expect = "keyOrClose";
            continue;
        }
        if (token === "[") {
            stack.push([key, []]);
            expect = "valueOrClose";
            continue;
        }
        if (PUNCT.includes(token)) {
            throw new SyntaxError(`Invalid JSON: Unexpected "${token}" at token ${i}`);
        }
        addValue(key, token);
    }

    if (expect !== "end") {
        throw new SyntaxError("Invalid JSON: Unexpected end of input");
    }
    return result;
}

export function json(raw: string): Object {
  let tokens : Array<any> = lexer(raw);
  return parser(tokens);
}
