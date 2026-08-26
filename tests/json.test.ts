import {json} from '../index.ts';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

for(let i = 1; i <= 4; i++){
  test(`json testing 00${i}`, async () => {
    
      const filePath:string = path.join(path.dirname(path.join(process.cwd(), 'tests', 'sum.test.ts')), `/jsons/item00${i}.json`);
  
      const jsonFile:string = await readFile(filePath, 'utf8');

      expect( json(jsonFile) ).toEqual( JSON.parse(jsonFile) ); 
  });
}