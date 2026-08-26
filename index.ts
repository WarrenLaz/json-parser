import { Stack } from '@opensource-technologies/typescript-data-structure-library';

function createNewEntry( currObj: Object, mykey: any, value : any) : Object{
  return {...currObj, [mykey] : value}
}

function putNewObject(currObj: Object, newObj : Object) : Object{
    return {...currObj, newObj}
}

export function json(raw: string): Object {
  let result : Object = {};
  const clean : string = raw.replace(/[\s\\]/g, "");

  let substring : string = "";
  const stack = new Stack<any>();
  let isQuote: boolean = false;
  for(const c of clean){
    switch(c){
      case '\"': isQuote = true; break;
      case '}' : stack.peek() == '{' ? ()=> {stack.pop() } : () => {throw new Error("Invalid JSON")}; break;
      case ']' : stack.peek() == ']' ? ()=> {stack.pop()} : () => {throw new Error("Invalid JSON")}; break;
      case '{' : stack.push(c); break;
      case '[' : stack.push(c); break;
      case ':' : 
      case ',' : createNewEntry(); break;
      default : substring += c; break;
    }
  }

  return result;
}
