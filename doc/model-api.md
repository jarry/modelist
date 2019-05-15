# Model API
## 创建
#### define(props)
* 定义数据模型，所有模型都继承自Model数据结构，如果公共Model也可以抽取一个出来用于继承

```javascript
class ExampleModel extends Model {
   constructor(source, formatter) {
      super()
      // 定义数据模型的属性，可以是简单对象或者复杂对象
      this.define({
      	xxx: 'xxx'
      })
      this.init(source, formatter)
   }
}
```

| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| props|Object| 是 |{name: '', age: 0, favor: []}  | 属性与值对象，可以是复杂数据结构

#### init(source, formatter)
* 初始化Model

```js
	this.init(source, formatter)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| source|Object| 是 |{ name: 'Joe', age: 20, favor: [1,2,3] }  | 源数据|
| formatter|Object| 是 | { name: 'Max', age: (source, model, formatter) => source.age }  | 用于格式化数据, 支持3种参数，详细见format方法|

### Model.createModel(props, formatter, functions)
* 创建匿名的Model，传入属性、格式器与覆盖函数列表

```js
var data = { id: 0001, name: 'Joey', age: 20 }
let EngineerModel = Model.createModel(data)
// returns class AnonymousModel { id, name, age }
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:----|:------|:-------|
| props|Object| 是 |{ name: 'Joe', age: 20, favor: [1,2,3] }  | 源数据|
| formatter|Object | 否 | {name: 'Ali', age: 18 } | 用于格式化数据, 支持3种参数，详细见format方法|
|functions|Object|否|{toString: function() {}} | 用于覆盖Model原型中的方法, 比如覆盖toString |

## 实例化
### new
* 实例化自定义模型

```js
let var example = new ExampleModel(
	{
		color:'red', size: 20, weight: '50KG'
	}, {
		color: 'green'
	}
)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:----|:------|:-------|
| source|Object| 是 |{ color:'red', size: 20, weight: '50KG' } | 源数据|
| formatter|Object | 是 |{ color: (source) => source.color } | 用于格式化数据, 支持3种参数，详细见format方法|

## 格式化
### format(formatter, whole = true)
* 模型中用来格式化数据的函数，在实例化时传入数据源和格式器时就会自动执行，也可以手工再调用执行。

```js
example.format({
	// 格式器value有三种值：直接赋值、函数赋值、key名查找赋值

	// 1. 直接赋值替换，针对原生数据类型
	color: 'yellow',
	// size: 23
	// isX: true

	// 2. 函数赋值，获得return的值
	// format回调函数有三个参数，source, model, formatter。this指向model自身
	size: function(source, model, formatter) {
	  if (source.size === undefined) {
	    return 30
	  } else {
	    return source.size * 2
	  }
	},
	// 如果用箭头函数，则this不指向model
	// size: (source) => source.size

	// 原model中没有的属性，格式器可以新增
	newProp: 'newProp',

	// 3. 根据key名从source中查找，以数组标识
	subProp: ['child']
	// 也可多级查找key, 按照数组的顺序逐级调用源数据中的子属性
	// 若传递的是数字，且源数据中对应项是数组的话，则按下标获取成员项
	// 以下表示获取source.child.subChild[1]的值
	subChild: ['child', 'subChild', 1]
	},

	// whole参数设为false则表示仅按照当前规则器来格式化数据
	// 不会影响原来Model中的formatter，默认为true
	false
)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| formatter|Object | 否，若不传则执行默认格式器 |{ color: (source) => source.color } | 用于格式化数据, 回调函数支持3种参数，分别是source源数据, model模型自身, formatter校验器自身|
| whole|Boolean | 否 |false|是仅用于一次性格式化还是同时修改模型的formatter，默认为true。 |

### setFormatter(formatter, override = true)
* 设置格式器，一般在声明Model类时指定格式器或者实例化时指定，也可以手工再指定格式器，然后调用执行

```js
// 通过setFormatter函数来重新设置处理器
example.setFormatter({name: (source) => source.name })
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| formatter|Object | 是 |{ color: (source) => source.color } | 用于格式化数据, 回调函数支持3种参数，分别是source源数据, model模型自身, formatter校验器自身|
| override |Boolean | 否 |false| 继承还是整体覆盖，默认是继承|

### formatted(...args)
* 格式化完后的回调函数

```js
class ExampleModel extends Model {
	...
	formatted: function(formatter) {
	// 用于监听格式化完成后执行其他动作
	...do stuff
	}
	...
}
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| formatter|Object | 是 |{ color: (source) => source.color } | 格式化完后的回调参数|

### preprocess(source, formatter)
* 数据源预处理函数，有时候为了对源数据再进行一次加工后再交由处理来处理。这种情况不多见。

```js
class ExampleModel extends Model {
	...
      // 若覆盖了preprocess方法，即对源数据进行了干预，意思是在format之前把源数据调整为适合format的状态
      // 在preprocess里修改了source之后，Model里面的getSource()会受到影响，也就是最初的源变化了
      // 如果返回是非false，则在之后自动执行format，如果false表示源数据处理后暂停，不自动format数据
      preprocess(source, formatter) {
        source.orderType = 111
        return this
      }
	...
}
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| source |Object | 是 | { color: 'red'} | 格式化完后的回调参数|
| formatter|Object | 是 |{ color: (source) => source.color } | 格式化完后的回调参数|

## 遍历
### each(func)
* 对模型数据的遍历，跟`for in`类似，但仅遍历自身属性

```js
example.each(function(key, value) {
  // console.log('key>value', key, value) // 在return false前面则会全部打印
  if (key === 'color' || value > 10) {
    // return false，用于表示break，跳出循环, 一般return表示continue
    return false
  }
  console.log('this[key]>value', this[key], value)
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func |Function | 是 | (key, value) => { alert(value) } | 遍历成员 |

## 获取
### get(...keys)
* 根据key获取value

```js
// 返回favor值
example.get('favor')
// 返回favor以及age的值
example.get('favor', 'age')
// 返回favor以及age的值
example.get(['favor', 'age'])
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| keys |String\|Array | 是 | 'name' | 根据key获取属性值，单个直接返回value，多个返回数组value |

### getBy(func)
* 根据条件获取value，返回数组

```js
// 根据函数返回favor值
example.getBy((key, value) => {
  if (key == 'favor' || value > 0) {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func |Function | 是 | (key, value) => value | 根据条件返回value |

### getLength()
* 获取模型长度

```js
// 返回example自有属性的长度
example.getLength()
```

### getKeys()
* 获取模型所有key，返回数组

```js
// 返回全部属性，返回数组
example.getKeys()
```

### getValues()
* 获取模型所有的value，返回数组

```js
example.getValues()
```

### getEntries()
* 返回全部键值对的数组

```js
example.getEntries()
```

### hasKey(...keys)
* 判断是否含key，含有则为true，不包含为false

```js
example.hasKey('title')
example.hasKey('title','age')
example.hasKey(['title','age','size'])
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| keys |String\|Array | 是 | 'name' | 返回true或false |

### hasValue(...values)
* 判断是否含value，含有则为true，不包含为false

```js
// 是否含有value，含有则为true，不包含为false
example.hasValue('red')
example.hasValue('engineer', 20)
example.hasValuehasValue(1, [101, 102]))
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| values |Object | 是 | 'name' | 返回true或false |

### hasKeyValue(key, value)
* 判断是否含有key和value，一次判断一个，多个需要结合each函数

```js
// 是否含有某个key和value,返回true或false
example.hasKeyValue('age', 20)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'name' | key名称 |
| value |Object | 是 | 'Jack' | value名称 |

### filter(func)
* 根据条件过滤出属性与value，返回Object

```js
example.filter((key, value) => {
	// 把符合条件的成员过滤出来
	if (!value) {
	  return true
	}
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (key, value) => { return value > 0 } | 条件函数 |

### getSource()
* 返回模型的源数据

```js
example.getSource()
```

### getProxy()
* 获取模型代理

```js
// 返回模型的代理对象，通过Proxy可以监听数据更新
example.getProxy()
```

## 修改
### set(key, value)
* 设置模型属性

```js
// 修改一个属性，原属性存在，相当于example.age = 30
example.set('age', 30)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'age' | 属性名称 |
| value | String | 是 | 40 | 新的值 |

### add(key, value)
* 添加模型属性

```js
// 添加字段，已存在不覆盖
example.add('latest', true)
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| key | String | 是 | 'latest' | 属性名称 |
| value | String | 是 | false | 新的值 |

### addAll(obj)
* 批量添加模型属性

```js
// 添加多个字段，已存在不覆盖
example.addAll({color:'red', size: 20, weight: '50KG'})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| obj | Object | 是 | {a:'a','b':1} | 多个属性对象 |

### preprocess(source, formatter)
* 对源数据进行预处理，在复杂数据处理时可能有用

```js
class Example extends Model {
	...
	// 如果期望在进行正式处理数据前对source进行预处理，则可覆盖预处理函数
	// return false表示就会往下自动执行数据的format
	preprocess: function(source, formatter) {
	  // 对数据进行简单操作，修改的是原始数据，预处理过后的才会执行源数据到Model的赋值
	  if (Array.isArray(source.favor)) {
	    source.favor.book = source.favor
	  }
	  // 原始preprocess默认返回true，表示继续进行format，此时可以根据需要是否立刻进行format
	  return false
	}
	...
}
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| source | Object | 是 | {a:'a','b':1} | 数据源 |
| formatter | Object | 是 | { 'name': (source, model, formatter) => {} | 格式器 |

## 删除
### removeKey(...keys)
* 根据key来移除属性

```js
example.removeKey('size')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| keys | String|Array | 是 | ['age','name'] | 单个或多个属性名称 |

### removeValue(...values)
* 根据value来移除

```js
.example.removeValue('weight', 'greeen', 'unknow')
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| value | String|Array | 是 | [20, 'Jack'] | 单个或多个属性名称 |

### removeBy(func)
* 根据条件移除属性

```js
example.removeBy((key, value) => {
  if (key === 'size' || value >= 20) {
    return true
  }
})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| func | Function | 是 | (key, value) => { return true } | 是否符合条件的函数 |

### empty()
* 清空属性

```js
example.empty()
```

## 其他
### equals(obj)
* 属性value的全等比较

```js
example.equals({color:'red', size: 20, weight: '50KG'})
```
| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| obj | Object | 是 | example.toPlain() | 比较内容是否全相同 |

### clone()
* 克隆model对象，浅拷贝

```js
example.clone()
```
### toString()
* 获取模型字符串

```js
example.toString()
```

### toPlain()
* 返回扁平Object对象

```js
example.toPlain()
```

### toJSON()
* 返回标准JSON

```js
example.toPlain()
```

### addFunction(funcName, func)
* 为模型添加处理函数，主要用于创建AnonymousModel时覆盖Model上的函数。参见Model.createModel

```js
// 给模型实例添加一个函数覆盖toString
example.addFunction('toString', () => {
    return JSON.stringify(this)
})
```

| 参数 |类型| 必填 | 示例 | 说明 |
|:----|:---|:-----|:------|:-------|
| funcName | String | 是 | 'add' | 函数名称 |
| func | Function | 是 | (key, value) => { this[key] = value } | 函数 |
