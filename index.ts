import { Stack } from '@opensource-technologies/typescript-data-structure-library';

function createNewEntry( currObj: Object, mykey: any, value : any) : Object{
  return {...currObj, [mykey] : value}
}

export function json(raw: string): Object {
  let result : Object = {};
  const clean : string = raw.replace(/[\s\\]/g, "");

  let key : any;
  let value : any;
  let currVal : any = "";
  const stack = new Stack<any>();
  let isQuote: boolean = false;
  for(const c of clean){
  console.log(stack);
  switch(c){
    case '\"': isQuote = true; break;
    case '}' : stack.peek() == '{' ? (()=> {stack.pop()})() : (() => {throw new SyntaxError("Invalid JSON")})(); break;
    case ']' : stack.peek() == '[' ? (()=> {stack.pop()})() : (() => {throw new SyntaxError("Invalid JSON")})(); break;
    case '{' : stack.push(c); break;
    case '[' : stack.push(c); break;
    case ':' : 
    case ',' : createNewEntry(result, key, value); break;
    default : currVal += c; break;
    }
  }
  
  if (stack.size() != 0) 
    throw new SyntaxError("Invalid JSON");
  
  return result;
}
