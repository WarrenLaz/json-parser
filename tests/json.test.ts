import { json } from '../index.ts';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_PATH: string = path.dirname(path.join(process.cwd(), 'tests', 'sum.test.ts'));
const jsonFILES: Array<string> = [];

beforeAll(async () => {
  for (let i = 1; i <= 5; i++) {
    try {
      const filePath: string = path.join(BASE_PATH, `/jsons/item00${i}.json`);
      const jsonFile: string = await readFile(filePath, 'utf8');
      jsonFILES.push(jsonFile);
    } catch (err) {
      console.log("NO FILE EXISTS: ", err);
    }
  }
});

for (let i = 0; i < 4; i++) {
  test(`json testing 00${i + 1}`, () => {
    expect(json(jsonFILES[i])).toEqual(JSON.parse(jsonFILES[i]));
  });
}

test(`throws on invalid JSON ${jsonFILES[4]}`, () => {
  expect(() => json(jsonFILES[4])).toThrow(SyntaxError);
});