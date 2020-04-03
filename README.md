# Modelist 数据结构

    新增加两种数据结构，用于处理业务数据。Model用于定义数据模型(展现或逻辑)，List进行批量处理。
    通过这种方式方便地对Model进行查找、过滤、修改、增删和排序，同时提升代码的可读性和可维护性以及扩展性等。


## install
```shell
$ npm i modelist2
```
> see npm: [modelist2](https://www.npmjs.com/package/modelist2)
  

```shell
$ npm run build   # 打包umd版本
$ npm run dev     # 执行测试用例
$ rollup -c # 打包 cjs与esm版本
```

## source code


> 源码：[https://github.com/jarry/modelist](https://github.com/jarry/modelist)



### Model

    用于定义业务模型和格式化数据，可以为某个具体业务对象，分别或统一建立视图层和逻辑层的模型

```javascript

    // 创建一个ExampleModel继承自Model基类
    class ExampleModel extends Model {
        // 构造器含有两个参数，source是实例化时的数据来源，formatter数据格式化器。
        constructor(source, formatter) {
          super()
          // this.define用来定义模型的基本属性，这是向前端展示或者向后台递交的数据模型，可以根据业务与展现情况设置
          this.define({
              // 初始值可以是null或undefined(undeifned在转JSON被丢弃)，也可以是默认值，建议增加描述说明
              order: null,
              color: undefined,
              size: 5,
              width: undefined,
              height: null
          })

          // 定义数据处理器，可以提前写好规则器也可以在在外部定义再传入
          formatter = Object.assign({
              // 属性直接赋值
              order: Math.random(),
              // 属性通过函数赋值
              color: function(source, model, formatter) {
                  // 如果是function写法则this代表model
                  return source['color'] || 'black'
              },
              size: (source, model, formatter) => {
                  let key = 'size'
                  if (source[key] < 10) {
                      return source[key] + 5
                  }
                  return source[key] * 2
              },
              // 通过key名查找赋值
              keyProp: ['sourceKey']
          }, formatter)

          // 需要初始化数据模型，传入源数据与处理器
          // init执行时源数据会覆盖Model的同名属性
          this.init(source, formatter)
       }
    }

    // 实例化Model，第一个参数是数据，第二个参数格式器
    let example = new ExampleModel({color:'red', size: 10, width: 5}, { color: 'green'})
    example.get('color')  // green
    example.hasKey('color', 'size', 'width') // true
    example.hasValue(5, 'red') // false
    example.getKeys() // ["order", "color", "size", "width", "height"]
    // 再次格式化数据，格式器将被复制到原有格式器
    example.format({
      color: 'blue',
      width: (source, model, formatter) => {
        return model.width * 2
      }
    })
    example.get('width')  // 10
    example.hasValue(10, 'blue') // true
```

### List

    对于模型的统一批量处理，把一类数据按照模型统一进行修改、查找、排序等

```javascript
    // 这是一组数据，里面的内容均属于某个模型
    const data = [ { name: 'Tom', size: 9, width: 8, color: 'red' }, { name: 'Hans', size: 20, width: 28, color: 'olive' },
      { name: 'Jack', size: 15, width: 18, color: 'black' }]
    // 新建List对象，指定来源数据与模型对象
    // 实例化ExampleModel时来源数据会覆盖模型里的相同属性，缺失的属性则用模型里面的默认值。
    // 同时也执行了Model里面的format，此时format按照规则器进行批量处理
    const exampleList = new List(data, ExampleModel)

    // 根据key value查找Model所在位置
    exampleList.indexOfByKey('color', 'olive') // 1
    // 根据条件查找成员
    exampleList.indexOfBy((model, idx) => {
      if (model.width > 10) {
        return true
      }
    }) // 0
    // 根据key分组
    exampleList.groupBy('color') // {red: Array(1), olive: Array(1), black: Array(1)}
    // 根据条件统计数量
    exampleList.countBy((model, idx) => {
      return model.size > 15
    }) // 2
    exampleList.swap(0, 2) // 0,2项目交换
    // 根据条件去重复项
    exampleList.uniqueBy((one, two) => {
      if (one.size - two.size <= 20) {
        return true
      }
    })
    // 转为简单结构对象，Model => Object, List => Array
    exampleList.toPlain()
    // 转为标准JSON, 只保留string, number, boolean, null, Array, Object
    exampleList.toJSON()
    // 将内容转为字符串
    exampleList.toString()
```

## 使用说明

> 使用说明 [./doc/intro.md](./doc/intro.md)

> 使用说明 [./doc/intro.html](./doc/modelist/doc/intro.html)

> API [./doc/modelist/doc/api.html](./doc/modelist/doc/api.html)

## 更多DEMO实例

> DEMO地址：[./doc/modelist/demo/](./doc/modelist/demo/)


## 完整引用例子

> Example地址：[./doc/modelist/example/](./doc/modelist/example/)
