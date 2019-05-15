# List API
## 实例化
### new List(source, modelClass)
* 实例化List数据结构

```js
// 来源数据项source与数据模型的属性可以不匹配，只有同名的会覆盖ExampleModel
const data = [ { name: 'Tom', age: 9, size: 8, color: 'red' }, { name: 'Hans', age: 20, size: 28, color: 'olive' } ]
// ExampleModel为指定数据模型，data2是数据源，数据源里的属性可以与模型ExampleModel定义的不一致
// 在实例化ExampleModel时来源数据会覆盖模型里相同的属性值，此时也会执行Model的格式器。
const exampleList = new List(data, ExampleModel)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:----|:------|:-------|
| source|Array\<Object\> | 是 | [{ color:'red', size: 20, weight: '50KG' }] | 源数据列表 |
| modelClass|Model | 否 | ExampleModel | 模型类，如果为空则表示创建匿名类 |

### setModelClass(modelClass, dataList = [])
* 更改List的模型类

```js
exampleList.setModelClass(ExampleModel)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:----|:------|:-------|
| modelClass|Model | 是 | ExampleModel | 模型类 |

## 格式化
### format(formatter, whole = true)
* 批量格式化List中的模型，`详见Model API中的format函数`

```js
exampleList.format({
  height: 30,
  size: function(source, model, formatter) {
    var key = 'size'
    // 根据某个属性值不同来更改另外一个属性值
    if (this['height'] > 10) {
      return this[key] / 2
    }
    return this[key] * 2
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| formatter|Object | 是 |{ color: (source) => source.color } | 用于格式化数据的key值对应三种值：1、直接量 2、函数赋值，支持3种参数(source源数据, model模型自身, formatter校验器自身)，3、key赋值，从source中查找，以数组标识|
| whole|Boolean | 否 |false|用于一次性还是同时修改模型的formatter |

## 遍历
### each(func)
* 对模型数据的遍历，跟`forEach`相同

```js
exampleList.each((model, i) => {
   console.log(model, i)
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func |Function | 是 | (key, value) => { alert(value) } | 遍历成员 |

## 获取
### get(index)
* 根据下标获取成员

```js
exampleList.get(0).set('color', 'white')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| index | Number | 是 | 2 | 下标 |

### getBy(func)
* 根据条件获取成员

```js
exampleList.getBy(function(model, idx, list) {
  if (model.age > 20) return false
  if (idx % 2== 0 ) {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (model) => model.age > 15 | 返回符合条件的成员新列表 |

### getByKey(...keys)
* 根据key和value获取成员

```js
exampleList.getByKey('height', 'color')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String|Array | 是 | ['height', 'width'] | 返回符合条件的成员新列表 |

### getByValue(...values)
* 根据value来获取成员

```js
exampleList.getByValue(45, 'Joey')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| value | String|Array | 是 | [20, 'Jack'] | 返回符合条件的成员新列表 |

### getByKeyValue(key, value)
* 根据key value来获取成员

```js
exampleList.getByKeyValue('color', 'white')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | 返回符合条件的成员新列表 |
| value | Object | 是 | 'Jack' | value完全匹配 |

### getValues(..keys)
* 返回全部成员

```js
exampleList.getValues('color', 'white')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| keys | String|Array | 否 |  | 返回所有成员或根据key返回成员列表 |

### hasItem(...models)
* 判断是否含有某个成员

```js
exampleList.hasItem({ name: 'Hans', age: 2, height: 18 })
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| keys | String|Array | 否 |  | 返回所有成员或根据key返回成员列表 |

### contains(item, func)
* 是否含有某个对象，对象属性值相同视为含有，可以传递比较条件

```js
exampleList.contains(
  { name: 'Hans', age: 2, height: 18 },
  function(model, idx, item) {
    return (model.name === item.name && model.height === item.height)
  }
)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| item | Object | 是 | {'key': 'value'} | JSON对象或Model |
| func | Function | 否 | (model, idx, item) => model.name === item.name | 自定义比较条件 |

### indexOfByKey(key, value)
* 根据model的key value来查找位置

```js
exampleList.indexOfByKey('color', 'white')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | key名称 |
| value | Object | 是 | 'Jack' | value值 |

### indexOfBy(func)
* 根据条件查找下标

```js
exampleList.indexOfBy((model, idx) => {
  if (model.color ==='white') {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (model, idx) => model.id === 1 | 比较条件 |

### remove(start, end)
* 根据下标移除成员Model,移除成员，[)，左闭右开

```js
exampleList.remove(0, 1)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| start | Number | 是 | 1 | 开始位置 |
| end | Number | 是 | 2 | 结束位置 |

### removeItem(...items)
* 删除完全相等的成员

```js
exampleList.remove(0, 1)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| item | Model|Array | 是 | [example1, example2] | 可以是单个或数组 |

### filter(func)
* 调用原生Array方法根据条件滤出数据。*注意*：<mark>在ES6环境下filter会返回this本身，而如果是ES5下因为无法使用Class中的extend，调用filter会返回新的数组，而不是this。wings-modelist库按ES6发布，modelist库按ES5发布。<mark>

```js
exampleList.filter((model, idx) => {
  return (model.isPaidContent !== 0)
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (model, idex) => idx === 0 | 跟filter相反 |

### inverse(func)
* 调用自定义inverse方法反选数据，返回的是this本身

```js
exampleList.inverse((model, idx) => {
  return (model.isPaidContent !== 0)
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (model, idex) => idx === 0 | 跟filter相反 |

### isEmpty()
* 判断是否为空集合，返回true或false

```js
exampleList.isEmpty()
```

### unique()
* 根据model的全部key值去重复

```js
exampleList.unique()
```

### uniqueBy(func)
* 根据条件去重复

```js
exampleList.uniqueBy((one, two) => {
  if (one.size - two.size <= 20) {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (one, two) => one.id === two.id | 判断条件 |

### uniqueByKey(...keys)
* 根据key value去重复

```js
exampleList.uniqueByKey('color', 'size')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | key名称 |
| value | Object | 是 | 'Jack' | value值 |

### groupBy(key, func)
* 根据key分组

```js
exampleList.groupBy('color')
// returns {red: Array(2), olive: Array(1)}

// 根据type分组，不用统计无效type
let result = examplelList.groupBy('type', (m, i) => {
  if (m.id <= 50) {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | key名称 |
| func | Function | 是 | (model, idx) => model.id > 0 | 判断条件 |

### countBy(func)
* 根据条件统计个数,返回个数

```js
exampleList.countBy((model, idx) => {
  return model.size > 20
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (model, idx) => model.id > 0 | 判断条件 |

### sortBy(key, order = 'asc')
* 根据条件统计个数,返回个数

```js
exampleList.sortBy('size')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'size' | model的key名称 |
| order | String | 否 | 'desc' | 升序还是降序，默认升序 |

## 修改
### add(data, valid = List.VALID_MODEL)
* 添加成员

```js
exampleList.add({ name: 'Thomas', age: 22, height: 18 })
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| data | Object | 是 | {'name':'Joe', 'age': 2} | data源数据 |
| valid | Boolean | 否 | false | 是否进行完整性校验，默认否 |

### addAll(dataList)
* 添加多个成员

```js
exampleList.add([{ name: 'Hans', age: 12, height: 38 }, { name: 'Joey', age: 22, height: 18 }])
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| dataList | Object | 是 | [{'name':'Joe', 'age': 2}, {'name':'Max', 'age': 3}] | data源数据列表，默认不校验一致性 |

### set(idx, model)
* 根据下标重新设置model
 
```js
exampleList.set(1, {name: 'Alex', age: 45})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| idx | Number | 是 | 1 | 下标位置 |
| model | Object | 是 | {'name':'Joe', 'age': 2} | 新数据对象 |

### setCheckModel(flag)
* 增加数据时是否校验Model的完整性
 
```js
// 设置checkModel为true后，再添加数据会失败，因为data2的属性缺少模型的一些属性
exampleList.setCheckModel(true)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| flag | Boolean | 是 | true | List默认为false，只有设置后才会进行属性完整校验，一般不需要设置完整性校验 |

### insert(idx, model)
* 根据下标插入对象
 
```js
exampleList.insert(2, {name: 'Jerry', age: 5})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| idx | Number | 是 | 1 | 下标 |
| model | Object\|Model | 是 | {'name': 'Black'} | 模型对象 |

### replaceBy(item, func)
* 根据下标插入对象
 
```js
exampleList.replaceBy({color:'black', size: 25}, (model, idx) => {
   return model.size === 30
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| item | Object\|Model| 是 | {'name': 'Black'} | 新成员，非Model会先专为同类Model |
| func | Function | 是 | (model, idx) => { return model.size === 30 } | 判断条件 |

### swap(fromIdx, toIdx)
* 根据下标将两个成员互相交换
 
```js
exampleList.swap(1, 3)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| fromIdx | Number| 是 | 1 | 第一个下标 |
| toIdx | Number | 是 | 2 | 第二个下标 |

### empty()
* 清空自有成员属性
 
```js
exampleList.empty()
```

### clear()
* 清空且删除静态属性
 
```js
exampleList.clear()
```

## 删除
### removeBy(func)
* 根据条件移除成员项
 
```js
exampleList.removeBy((model, idx) => {
  if (model.color == 'red') {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function| 是 | (key, value) => key === 'name' | 条件函数 |

### removeByKeyValue(key, value)
* 根据item的key value移除成员
 
```js
exampleList.removeByKeyValue('color', 'olive')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | key名称 |
| value | Object | 是 | 'Jack' | value值 |
 
## 其他
### equals(obj)
* 成员属性值的完整比较，深层比较
 
```js
const data = [ { name: 'Tom', age: 9, size: 8, color: 'red' }, { name: 'Hans', age: 20, size: 28, color: 'olive' } ]
exampleList.equals(data)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| obj | Object\<Object\>\|List\<Model\> | 是 | [{name:'Tom'}, {name:'Hans'}] | 数据源或自身 |

### clone()
* 克隆一个List，深度clone
 
```js
exampleList.clone()
```

### toString()
* * 获取模型字符串
 
```js
exampleList.toString()
```

### toPlain()
* 获取扁平的对象，将List全部成员都转为Object类型
 
```js
exampleList.toPlain()
```

### toJSON()
* 获取JSON对象，将List专为JSON类型
 
```js
exampleList.toJSON()
```

### toArray()
* 将List专为一个数组，内部成员依然是Model类型
 
```js
exampleList.toArray()
```

### validModel(model)
* 验证来源数据属性是否与Model属性一致，返回true和false
 
```js
exampleList.validModel({name:'name', value: 'value'})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| model | Object | 是 | {name:'Tom'} | 数据 |

### addFunction(funcName, func)
* 覆盖或新增一个方法
 
```js
// 覆盖toArray方法后，再调用时则会返回toPlain结果
exampleList.addFunction('toArray', function() {
  return this.toPlain()
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| funcName | String | 是 | 'toArray' | 函数名称 |
| func | Function | 是 | function() { return this } | 函数 |