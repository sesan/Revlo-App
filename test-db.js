import { supabase } from './src/lib/supabase.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Testing insert...");
  const { data, error } = await supabase.from('highlights').insert([{
    user_id: '11111111-1111-1111-1111-111111111111', // dummy
    passage_id: 'JHN-3',
    word_start: 0,
    word_end: 1,
    color: 'yellow'
  }]);
  console.log("Error:", error);
}
test();
