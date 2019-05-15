# Modelist 使用说明

## Modelist基本介绍
### Modelist是什么？
* Modelist包括Model与List两个数据结构，其中Model用于处理专门业务数据对象，List则是集合，包含Model以便批量来处理。
* Modelist的使用场景包括：中间层接口数据封装、MVVM框架的viewModel数据处理、一般业务场景但数据复杂的模型化处理、批量处理同类数据时

### Model有什么用？
 - Model是一种自定义的数据结构，是一个Class，用来定义传输的业务数据模型并通过定义处理器对源数据进行加工处理。
 - 数据模型分两种，包括从后台接口获取的用于视图渲染的数据以及从前端界面收集用于提交的数据。这两种数据都需要进行加工转换，尤其是对于复杂业务场景。
 - 对于视图来讲，用于渲染的数据最好是已经处理过适合渲染需要的数据，而不要视图再做干预，一般比较个性化。对于业务后台来讲，用于存储的数据是处理过适合增删改查的结构型数据，还要考虑通用。
- 在个性化和通用之间的转换，就是这个Model工厂所要做的事情。它会定义业务模型，并把源数据加工成为想要的结构。

### List有什么用？
- List是一种自定义的数据结构，是一个Class继承自Array，它扩展了很多针对集合数据统一处理的函数，便于批量对相同数据结构成员进行增删改查和分组过滤排序等。
- List的成员必须统一结构，也就是同一Model实例化的对象，这样可以针对统一的结构做批量处理
- List可以针对具名的Model或者匿名的Model进行统一处理，没有Model的简单结构会变成一个匿名Model
- 如果想要监听List的变动，可以使用getProxy()来进行数组方法的操作，这个与Model类似。

## Model使用说明

* 创建一个自定义Model，用于具体的业务对象。当数据处理有一定复杂时，建议为视图层以及逻辑层定义单独的Model。

```javascript
	// 创建一个ExampleModel，继承自Model基类
    class ExampleModel extends Model {
        // 构造器含有两个参数，source是数据来源，formatter数据格式器
        constructor(source, formatter) {
          super()
          // this.define用来定义模型的基本属性，用于前端展示或者是业务数据模型
          this.define({
              // 初始值可以是null或undefined(undeifned在转JSON被丢弃)，也可以是其他默认值
              order: null,
              color: undefined,
              size: 5,
              width: undefined
          })

          // 定义数据处理器，指定模型规则器，也可通过参数传入
          formatter = {
              // 属性直接赋值或通过函数赋值
              size: function(source, model, formatter) {
                  // 如果是function写法则this代表model
                  return source['size'] / 2
              },
              ...formatter
          }

          // 需要初始化数据模型，传入源数据与处理器
          // init执行时会把通过格式器把源数据复制到Model实例的属性上，如果格式器里没有定义属性的，以源数据同名属性直接复制
          this.init(source, formatter)
       }
    }

	// 实例化Model，第一个参数是来源数据，第二个参数格式器覆盖Model里面的格式器。实例化时会执行format。
    let example = new ExampleModel({color:'red', size: 10, width: 5}, {color: 'green', 'height': null})
    example.getKeys() // ["order", "color", "size", "width", "height"]
    example.getValues() // [null, "green", 5, 5, null]
    // 再次格式化数据，格式器将被复制到原有格式器
    example.format({
      color: 'blue',
      width: (source, model, formatter) => {
        return model.width * 2
      }
    })
    example.get('color', 'width', 'height') // ["blue", 10, null]
    example.hasValue(10, 'blue') // true
```


* 创建一个匿名Model，new List不指定Model则会自动创建匿名Model。当需要通过List来批量处理数据但没有定义专门的数据模型时用到。

```javascript
// 声明一个匿名Model，定义属性和规则器
var Animal = Model.createModel({name: null, type: undefined, favor: []}, {
  age: (source, model) => source.age === undefined ?  0 : source.age
})
var a = new Animal({name: 'Teddy', type: 'bear', favor: ['honey', 'apple', 'peach']})
// AnonymousModel {name: "Teddy", type: "bear", favor: Array(3), age: 0, __source__: {…}, …}
a.hasKeyValue('type', 'bear') // true
a.format({
 age: (source, model, formatter) => model.age + 5
})
a.each((k, v) => console.log(k + '=' + v))
// name=Teddy
// type=bear
// favor=honey,apple,peach
// age=5
a.getBy((k, v) => isNaN(v) && !Array.isArray(v)) // ["Teddy", "bear"]
```

* 创建一个自定义的Model，对源数据进行预处理，然后再手动format。

```js
var data = { id:1001, type: 2, character:{color: 'red', width: 100, height: '20px'}}
var SHAPE_TYPE = ['circle', 'square', 'triangle', 'heart']
// 这是一个通用格式器
var ShapeFormatter = {
  type: (source) => (SHAPE_TYPE[source.type] || ''),
  color: (source) => (source.color || ''),
  size: (source) => {
    return [source.size.width, source.size.height]
  }
}
class ShapeModel extends Model {
  constructor(source, formatter) {
    super()
    this.define({
      id:null,
      type:'',
      color:'',
      size:[/*width, height*/]
    })
	// 格式器为外部的格式器
    this.init(source, {...ShapeFormatter})
  }
  // 对源数据预处理，以便适用通用格式器，将character内部元素展开为适合统一处理的格式
  preprocess(source, formatter) {
    var character = source.character
    if (character) {
      source.color = character.color
      source.size = source.size || {}
      source.size.width = character.width
      source.size.height = parseInt(character.height)
    }
    // 返回false则实例化后要手工执行format函数,非false则自动执行
    return false
  }
}
var shape = new ShapeModel(data)
console.log(shape)
// ShapeModel {id: 1001, type: 2, color: "red", size: {…}, __source__: {…}, …}
shape.format()
console.log(shape)
// ShapeModel {id: 1001, type: "triangle", color: "red", size: Array(2), __source__: {…}, …}
```

## List使用说明
* 基于业务Model进行批量数据操作，List中的数据是一样的Model，借用List的方法可以简便地批量格式化数据。

```javascript
	const data = [ { size: 9, width: 8, color: 'red' }, { size: 20, width: 28, color: 'olive' },
	{ name: 'Jack', size: 15, width: 18, color: 'black' }]
    // 新建List对象，指定来源数据与模型对象
    // 实例化ExampleModel时来源数据会覆盖模型里的相同属性，缺失的属性则用模型里面的默认值。
    // 同时也执行了Model里面的format，此时format按照规则器进行批量处理
    var exampleList = new List(data, ExampleModel)
    var order = 0
    // 讲数据批量格式化
    exampleList.format({
      order: (source, model, formatter) => {
      	return model.order || order++
      }
    })
    console.log(exampleList)
	/*
    List(3) [ExampleModel, ExampleModel, ExampleModel, isCheckModel: false, Symbol(ModelClass): ƒ, Symbol(proxy): Proxy]
    0:ExampleModel {order: 0, color: "red", size: 4.5, width: 8, __source__: {…}, …}
    1:ExampleModel {order: 1, color: "olive", size: 10, width: 28, __source__: {…}, …}
    2:ExampleModel {order: 2, color: "black", size: 7.5, width: 18, __source__: {…}, …}
    length:3
	*/
	// 通过原始数组方法查找对象
	exampleList.find((item, i) => item.size > 5)
	// ExampleModel {order: 1, color: "olive", size: 10, width: 28, __source__: {…}, …}
	// 调用List自己的方法
	exampleList.getByKeyValue('color', 'red')
	// List [ExampleModel, isCheckModel: false, Symbol(ModelClass): ƒ, Symbol(proxy): Proxy]
	// 0:ExampleModel {order: 0, color: "red", size: 4.5, width: 8, __source__: {…}, …}
	// 查找对象下标
	exampleList.indexOf(exampleList.get(1))
	// 1
	exampleList.indexOf(exampleList.get(1).toJSON())
	// -1
	// 根据内容查找是否包含对象
	exampleList.contains(exampleList.get(1).toJSON())
	// true
```

## Modelist详细API
* [Modelist API.html](./api.html)
* [Modelist API.md](./api.md)

## Modelist Demo
* [Modelist Demo](../demo/)

## Modelist Test Case
* [Modelist Test](../test/)
