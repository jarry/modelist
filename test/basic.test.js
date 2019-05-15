const Modelist = require('../dist/index.min')
const Model = Modelist.Model
const List = Modelist.List

/**
 * 安装node 和 jest，执行命令测试
 * $ jest test/basic.test.js 
 */

 /** 匿名Model测试  */

// 源数据
const employeeData = { title: 'Software Engineer', gender: 1, age: 25, favor: [101, 102] }

// 创建匿名Model，这个model并没有定义，而是临时的一个model
let EngineerModel = Model.createModel(employeeData)
let engineer = new EngineerModel(employeeData, {
  title: 'Software Research Engineer', gender: 2, age: 21, favor: (source) => {
    return [201, 102]
  }
})

// 实例化测试
test('EngineerModel是一个匿名类，其类型是AnonymousModel', () => {
  console.log('engineer:', engineer)
  expect(engineer instanceof Model).toBe(true)
})

// 查找测试 
test('匿名model查找相关测试', () => {
  expect(engineer.get('gender')).toBe(2)
  expect(engineer.get('gender1')).toBe(undefined)
  expect(engineer.get('favor', 'age')).toEqual([[201, 102], 21])
  expect(engineer.getBy((key, value) => {
    if (key == 'favor' || value > 0) {
      return true
    }
  })).toEqual([2, 21, [201,102]])
  expect(engineer.getLength()).toBe(4)
  expect(engineer.getPrototype().getLength.call(engineer)).toBe(4)
  expect(engineer.getValues()).toEqual(["Software Research Engineer", 2, 21, [201, 102]])
  expect(engineer.hasKeyValue('age', 25)).toBe(false)
  expect(engineer.hasKeyValue('age', 21)).toBeTruthy()
  expect(engineer.filter((key, value) => {
    return value >= 2
  })).toEqual({'gender': 2, 'age': 21})
})

// 获取全量
test('匿名model toString/toPlain/toJSON', () => {
  let employeeData = { title: 'Software Research Engineer', gender: 2, age: 21, favor: [201, 102] }
  expect(engineer.toPlain()).toEqual(employeeData)
  expect(engineer.clone().toJSON()).toEqual(employeeData)
  expect(engineer.equals(employeeData)).toBe(true)
  expect(engineer.toJSON()).toEqual(JSON.parse(JSON.stringify(employeeData)))
  expect(engineer.toString()).toBe(JSON.stringify(employeeData))
})

// 修改测试
test('匿名model修改相关测试', () => {
  engineer.set('age', 30)
  engineer.add('area', 'Hongkong')
  engineer.addAll({location:'BJ',gender:2,nation:'China'})
  console.log('engineer after change:', engineer)
  expect(engineer.get('age')).toBe(30)
  expect(engineer.get('area')).toBe('Hongkong')
  expect(engineer.get('favor', 'age')).toEqual([[201, 102], 30])
  expect(engineer.getBy((key, value) => {
    if (typeof(value) == 'string') {
      return true
    }
  })).toEqual(['Software Research Engineer','Hongkong', 'BJ', 'China'])
  expect(engineer.getLength()).toBe(7)
  expect(engineer.hasKey('title')).toBe(true)
  expect(engineer.hasKey('title', 'favor')).toBe(true)
  expect(engineer.hasKey('title', 'favor', 'none')).toBe(false)
  expect(engineer.hasValue(1, [101, 102])).toBe(false)
  expect(engineer.hasValue(30, [201, 102])).toBe(true)
})

// format 测试
test('匿名model format测试', () => {
  // 格式化数据，format有formatter规则和是否运行单次规则还是全部运行
  engineer.format({
    // format回调函数有三个参数，source, model, formatter一般仅需要source
    gender: (source, model) => {
      return model.gender === 1 ? '男' : '女'
    },
    // 直接赋值替换
    age: 40,
    // 函数修改
    favor: function(source, model) {
      let favorDict = {
        '101': '音乐',
        '102': '电影',
        '201': '动漫'
      }
      // 如果是普通函数 this就是model
      // console.log('this === model:', this === model, this.getSource())
      var isTrue = this === model
      expect(isTrue).toBe(true)
      return this['favor'].map((value, idx) => favorDict[value])
    }
  })
  console.log('engineer format:', engineer)
  expect(engineer.get('gender')).toBe('女')
  expect(engineer.get('age')).toBe(40)
  expect(engineer.get('favor')).toEqual(["动漫", "电影"])
})

// 删除测试
test('匿名model删除相关测试', () => {
  engineer.removeKey('age')
  expect(engineer.get('age')).toBe(undefined)
  engineer.removeValue(21)
  expect(engineer.getBy((key, value) => {
    return value.length > 3
  })).toEqual(['Software Research Engineer', 'Hongkong', 'China'])
  engineer.removeBy(function(key, value) {
    return value.length > 5
  })
  console.log('engineer after remove some key:', engineer)
  expect(engineer.get('area')).toBe(undefined)
  expect(engineer.get('location')).toBe('BJ')
  engineer.empty()
  expect(engineer.get('location')).not.toBe('BJ')
  expect(engineer.toJSON()).toEqual({})
})

 /** 业务Model测试  */
  // 创建一个ExampleModel继承自Model基类
class ExampleModel extends Model {
  // 构造器含有两个参数，source是实例化时的数据来源，formatter是可选参数，用于数据格式化器
  constructor(source, formatter) {
    super()
    // this.define用来定义模型的基本属性，模型的每个属性都需要在这里定义
    this.define({
        // 初始值可以是null或undefined(undeifned在转JSON被丢弃)，也可以是默认值，建议增加描述说明
        order: null,
        color: undefined,
        size: 5,
        width: undefined,
        height: null
    })

    // 定义数据处理器，可以提前写好规则器也可以在实例化时再传入规则处理器
    // 还可以通过setFormatter函数来重新设置处理器
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
            if (source[key] === undefined) {
              return model[key]
            }
            if (source[key] < 10) {
                return source[key] + 5
            }
            return source[key] + 2
        }
    }, formatter)

    // 需要初始化数据模型，传入源数据与处理器
    // init执行时源数据会覆盖Model的同名属性
    this.init(source, formatter)
  }
}
let example = new ExampleModel(
  {color:'red', size: 20, weight: '50KG', 'child': { 'subChild': ['lion', 'hippo', 'monkey'] }},
  { color: 'green'}
)

// 测试业务model基本操作
test('测试业务model基本操作', () => {
  example.add('latest', true)
  example.addAll({color:'red', size: 20, weight: '50KG'})
  expect(example.hasKey('size', 'name')).toBe(false)
  expect(example.hasKey('weight','color')).toBe(true)
  example.set('order', 1)
  expect(example.getKeys()).toEqual(["order", "color", "size", "width", "height", "latest", "weight"])
  expect(example.getValues()).toEqual([1, "green", 22, undefined, null, true, "50KG"])
  expect(example.hasValue(20, 'red')).not.toBe(true)
  expect(example.hasValue(20, 'red')).toBe(false)
  expect(example.hasKeyValue('size', 20)).toBe(false)
  expect(example.hasKeyValue('size', 22)).toBe(true)

  example.removeKey('size')
  example.removeValue('weight', 'greeen', 'unknow')
  example.removeBy((key, value) => {
    if (key === 'size' || value >= 20) {
      return true
    }
  })
  example.each(function(key, value) {
    // console.log('key>value', key, value) // 在return false前面则会全部打印
    if (key === 'color' || value > 10) {
      // return false，用于表示break，跳出循环, 一般return表示continue
      return false
    }
    console.log('this[key]>value', this[key], value)
    expect(this[key] === 1 && value === 1).toBe(true)
  })

  example.format(
    {
      color: 'yellow',
      size: function(source) {
        if (source.size === undefined) {
          return 30
        }
      },
      // 原model中没有的属性，格式器可以新增
      'newProp': 'newProp',

      // 多级查找属性, 按照数组顺序使用源数据中的子属性
      'subChild': ['child', 'subChild', 1]
    },

    // 这个参数false表示仅按照当前规则器来格式化数据一次, 这个校验器不会影响原来的
    false
  )

  console.log('example Model after format:', example)

  expect(example.filter((key, value) => {
    // 把符合条件的全部过滤出来，返回新对象
    if (!value) {
      return true
    }
  })).toEqual({width: undefined, height: null, size: undefined})

  expect(example.toJSON()).toEqual(
    {"color": "yellow", "height": null, "latest": true, "newProp": "newProp", "order": 1, "subChild": "hippo", "weight": "50KG"}
  )

  expect(example.equals({color:'red', size: 20, weight: '50KG'})).toBeFalsy()

})

 /** List中含有匿名Model测试  */
 // 构建一个源数据
 const data = [ { name: 'Tom', age: 9, height: 10, size: 20 }, { name: 'Hans', age: 10, height: 28, size: 50 } ]
 //  List(dataList, modelCass)有两个参数，data是必选, modelClass若不指定则是匿名model
 const anonymousList = new List(data)
 test('List中含有匿名Model测试', () => {
     // 获得model字段个数
     expect(anonymousList.length).toBe(2)
     // 如果通过proxy来更新数据时，原始数组函数也会触发List的update监听
     expect(anonymousList.getProxy().pop().get('age')).toBe(10)

     // 添加成员
     expect(anonymousList.add({ name: 'Thomas', age: 22, height: 18 }).get(1).age).toBe(22)
     // 添加多个成员
     expect(
       anonymousList.addAll([{ name: 'Hans', age: 12, height: 38 }, { name: 'Joey', age: 22, height: 18 }]).length
     ).toBe(4)
     // 格式化数据
     expect(
       // 针对批量匿名Model进行格式化数据处理
       anonymousList.format({
         age: (source) => {
           var value = source.age
           return (value > 10) ? value : value * 2
         }
       }).get(0).toJSON()
     ).toEqual({ name: 'Tom', age: 18, height: 10, size: 20 })

     // 根据下标重新设置model
     expect(anonymousList.set(1, {name: 'Alex', age: 45}).get(1).age).toBe(45)
     // 插入对象
     expect(anonymousList.insert(2, {name: 'Jerry', age: 5}).get(2).name).toBe('Jerry')
     // 根据key移除指定位置的model
     expect(anonymousList.get(1).removeKey('height').height).toBe(undefined)
     // 获得指定位置model
     expect(anonymousList.get(3).age).toBe(12)
     // 根据条件获得指定位置model
     expect(anonymousList.getBy(function(model, idx, list) {
       if (model.age > 20) return false
       if (idx % 2== 0 ) {
         return true
       }
     }).length).toBe(2)
     console.log('anonymousList changed:', anonymousList)
     // 根据key来获取成员，如果key的value为undefined则被忽略
     expect(anonymousList.getByKey('height', 'color').getLength()).toBe(4)
     // 根据value来获取成员
     expect(anonymousList.getByValue(45, 'Joey').getLength()).toBe(2)
     // 根据key value来获取成员
     expect(anonymousList.getByKeyValue('color', 'white').getLength()).toBe(0)
     // 获取全部成员的value
     expect(anonymousList.getValues().length).toBe(5)
     // 是否含有某个成员，对象属性值相同视为含有
     expect(anonymousList.hasItem({name: "Joey", age: 22, height: 18 })).toBe(false)
     expect(anonymousList.hasItem({name: "Joey", age: 22, height: 18, size: null})).toBe(true)
     // 是否含有某个对象，对象属性值相同视为含有，可以传递比较条件
     expect(anonymousList.contains({name: "Joey", age: 22, height: 18},
      function(model, idx, item) {
        return (model.name === item.name && model.height === item.height)
      })
    ).toBe(true)
 })

  /** List中含有匿名Model测试  */
 // 构建一个源数据
test('List中含有业务Model测试', () => {
  // 来源数据项source与数据模型的属性可以不匹配，只有同名的会覆盖ExampleModel
  const data2 = [ { name: 'Tom', age: 9, size: 8, color: 'red' }, { name: 'Hans', age: 20, size: 28, color: 'olive' } ]
  // ExampleModel为指定数据模型，data2是数据源，数据源里的属性可以与模型ExampleModel定义的不一致
  // 在实例化ExampleModel时来源数据会覆盖模型里相同的属性值，此时也会执行Model的格式器。
  const exampleList = new List(data2, ExampleModel)
  // 如果设置了检查Model为true(默认取List中的静态值)，则会对添加的数据逐个进行属性校验，如果属性缺失则不允许添加
  exampleList.setCheckModel(true)
  // 设置checkModel为true后，再添加数据会失败，因为data2的属性缺少模型的一些属性
  exampleList.add(data2)
  exampleList.setCheckModel(false)
  expect(new List(data2, ExampleModel).length).toBe(2)
  // 通过format批量更新Model，format函数会逐个调用Model里面的format函数，传入的规则会被之前的规则所继承
  // 可以指定是仅按传入的规则来处理，还是按照全部规则全部处理一次，默认是全部规则都处理一遍
  expect(exampleList.getLength()).toBe(2)
  // 格式化数据，其中height直接更换，size根据函数修改
  expect(exampleList.format({
    height: 30,
    size: function(source, model, formatter) {
      var key = 'size'
      // 根据某个属性值不同来更改另外一个属性值
      if (this['size'] > 15) {
        return this[key] / 2
      }
      return this[key] * 2
    }
  }).get(0).get('size')).toBe(26)

  // 测试获取单个Model并且修改单个Model的属性
  expect(exampleList.get(0).set('color', 'white').get('color')).toBe('white')
  // 测试通过Model的format方法格式化数据
  expect(exampleList.get(1).format({
    width: function(source, model, formatter) {
      return (typeof model['width'] === 'undefined') ? 5 : model['width'] * 10
  }}, false).width).toEqual(5)
  // 通过List批量修改数据，第二参数为false，表示仅限本次传递的规则，这个规则不被Model的既有规则继承
  expect(exampleList.format({
    color: (source, model, formatter) => {
      return (source.color || model[source]) != 'white' ? 'white' : 'orange'
    }
  }, false).get(0).get('color')).toBe('white')
  // 根据model的key value来查找位置
  expect(exampleList.indexOfByKey('color', 'white')).toBeGreaterThanOrEqual(0)
  // 根据条件查找
  expect(exampleList.indexOfBy((model, idx) => {
    if (model.color ==='white') {
      return true
    }
  })).toBe(0)

  console.log('examplist after changed:', exampleList)

  //移除成员，[)，左闭右开
  expect(exampleList.remove(0, 1).length).toBe(1)
  // 根据内容删除完全相等的成员
  expect(exampleList.removeItem(exampleList.get(0)).length).toBe(0)
  // 添加多个model
  expect(exampleList.addAll(data2).getLength()).toBe(2)

  // 根据条件移除成员项
  expect(exampleList.removeBy((model, idx) => {
    if (model.color == 'red') {
      return true
    }
  }).getLength()).toBe(1)
  // 清空成员
  expect(exampleList.empty().isEmpty()).toBeTruthy()

  // 根据条件过滤取得成员
  expect(exampleList.addAll(data2).addAll(data2).filter((model, idx) => {
    return model.size > 10
  }))
  // 根据key分组
  expect(exampleList.groupBy('color').red.length).toBe(2)
  // 根据条件统计个数
  expect(exampleList.countBy((model, idx) => {
    return model.size > 20
  })).toBe(2)
  // 根据key排序，默认升序, 如降序则第二个参数为'desc'
  expect(exampleList.sortBy('size').get(0).size).toBe(13)
  // 两个成员互相交换
  expect(exampleList.swap(1, 2).get(1).size).toBe(30)
  // 克隆一个List，深度clone
  expect(exampleList.clone().equals(exampleList.toPlain())).toBeTruthy()
  // 判断是否与其他对象相等，比较是成员的数据
  expect(exampleList.equals(data2)).toBe(false)
  // 根据item的key value移除成员
  expect(exampleList.removeByKeyValue('color', 'olive').getLength()).toBe(2)
  // 根据model的全部key值去重复
  expect(exampleList.unique().getLength()).toBe(2)
  // 根据key value去重复
  expect(exampleList.uniqueByKey('color', 'size').length).toBe(1)
  // 根据条件去重复
  expect(exampleList.uniqueBy((one, two) => {
    if (one.size - two.size <= 20) {
      return true
    }
  }).getLength()).toBe(1)
  expect(exampleList.addAll(data2).length).toBe(3)
  // toPlain变为简单对象
  // toJSON变为标准JSON
  // toString内容改为字符串
  expect(
    exampleList.toString().indexOf('"color":"red"')
  ).not.toBe(-1)
})