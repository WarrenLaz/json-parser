export function json(raw: string): Object {
  let result : Object = {};
  const split_string: Array<string> = raw.split(" ");
  result = {
  ...result,
  "split_string": split_string
}; 
  return result;
}
