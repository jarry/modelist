import { Model, List } from 'modelist2'
import welcome from './welcome'

const arr = [
  { id: 1001, type: 1, name: "Edward", value: 21, age: 23 },
  { id: 1002, type: 2, name: "Sharpe"},
  { id: 1003, type: 3, name: "And", value: 4, age: 16},
  { id: 1004, type: 4, name: "The", value:null, age: 14 },
  { id: 1005, type: 5, name: "Magnetic", age: 45 },
  { id: 1006, type: 6, name: "Zeros", value: 37, age: 4 },
  { id: 1007, type: 7, name: "Jarry", value: 4, age: 16}
];

console.log('Model:', Model, 'List:', List)

console.log(welcome.hello())

const list = new List(arr)
console.log(list.sortBy('type', 'desc'))

export default {
    welcome: welcome,
    Model: Model,
    List, List
}

