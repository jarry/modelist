/**
 * @file list.js
 * @desc
 * - batch processing Model member of List
 * - more util method to process List data simply
 * - watching data change use Proxy
 * @author Jarry<jarryli@google.com>
 */

import {
  addUpdateListener,
  defineProperty,
  logger,
  observeObject,
  format,
  is
} from './model.js'
import Model from './model.js'
const isModelClass = (modelClass) => {
  return (modelClass === Model ||
    Model.prototype.isPrototypeOf(modelClass.prototype))
  // modelClass.prototype instanceof Model)
}

/** Utils */
const isList = is('List')
const isPlainObject = function (obj) {
  if (obj && obj.constructor &&
    !hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
    return false
  }
  return true
}
const isArrayOrList = function (dataList) {
  if (Array.isArray(dataList) || isList(dataList) || dataList instanceof List) {
    return true
  }
  return false
}
const createAnonymousModel = function (data, formatter) {
  if (typeof data !== 'object') return
  let properties = {}
  let keys = Object.keys(data)
  for (var key of keys) {
    properties[key] = null
  }
  return Model.createModel(properties, formatter)
}
const extendsArray = function(clazz) {
  var props = []
  props = [...Object.getOwnPropertyNames(Object.getPrototypeOf([]))]
  for (var prop of props) {
    // extends all properties form Array.prototype, but not override
    if (prop !== 'constructor' && prop !== 'length'
      && !(clazz.prototype.hasOwnProperty(prop))) {
        defineProperty(clazz.prototype, prop, Array.prototype[prop], false)
    }
  }
  defineProperty(clazz.prototype, 'length', 0, false)
  defineProperty(clazz.prototype, Symbol.iterator, Array.prototype[Symbol.iterator], false)
  // defineProperty(clazz.prototype, 'constructor', Array, false)
  return clazz
}

/** Constants */
const _MODEL_CLASS_ = Symbol('ModelClass')
const _PROXY_ = Symbol('proxy')

/** Class base List(Modelist) */
// for ES6 direct extends Array
// class List extends Array {
// for ES5 using babeljs compile
class List {
  /**
   * @param {(Array|List).<Object>} dataList=[] - orginal JSONArray data
   * @param {Model} [modelCass] - Model Class for validation
   */
  constructor(dataList = [], modelClass) {
    if (dataList.length > 0 && !isPlainObject(dataList[0]) &&
      !(dataList[0] instanceof Model)) {
      throw new Error('The first item of dataList is not an object or Model.')
      return
    }
    // ES6 should call super derived class before, ES5 not use extends
    // super()
    this.setCheckModel(List.VALID_MODEL)
    this.setModelClass(modelClass, dataList)
    this.setProxy()
    this.init(dataList)
  }

  init(dataList) {
    this.clear()
    if (dataList) {
      if (!this.getModelClass()) {
        this.setModelClass(null, dataList)
      }
      this.add(dataList)
    }
    return this
  }

  /** defined model Symbol for validation data's Model */
  setModelClass(modelClass, dataList = []) {
    if (!modelClass || !isModelClass(modelClass)) {
      if (dataList[0] && isModelClass(dataList[0].constructor)) {
        modelClass = dataList[0].constructor
      } else if (typeof Model !== undefined && Model.createModel) {
        modelClass = createAnonymousModel(dataList[0])
      }
    }
    defineProperty(this, _MODEL_CLASS_, modelClass, false)
  }

  getPrototype() {
    return Object.getPrototypeOf(this);
  }

  getModelClass() {
    return this[_MODEL_CLASS_]
  }

  get[Symbol.toStringTag]() {
    return 'List'
  }

  /** defineProperty(this, '__model__', new modelClass(), false) */
  setProxy() {
    defineProperty(this, _PROXY_, observeObject(this), false)
  }

  getProxy() {
    return this[_PROXY_]
  }

  /** for override, watch data change */
  onUpdate(idx, item, list, proxy) {
    // logger.info("%c%s", "color: red;", 'List onUpdate:', arguments)
  }

  /** for override the onUpdate */
  addUpdateListener(func) {
    addUpdateListener(this, 'Update', func)
    return this
  }

  addFunction(funcName, func) {
    if (typeof funcName !== 'string' || typeof func !== 'function'
      || typeof this[funcName] !== 'function') {
        logger.error('override ' + funcName + ' function failed.')
        return this
    }
    defineProperty(this, funcName, func, false)
    return this
  }

  getLength() {
    return this.length
  }

  /** validation whether model own same properties with ModelClass */
  validModel(model) {
    for (var prop in this[0]) {
      if (this[0].hasOwnProperty(prop) && !model.hasOwnProperty(prop)) {
        return false
      }
    }
    return true
  }

  /**
   * add item to list
   * @param {(Object|Array|List)} data - object will be coverted an array
   * @param {boolean} valid - valid item with List's model
   * @param return {List} this
   */
  add(data, valid = List.VALID_MODEL) {
    if (data === undefined || data === null) {
      return this
    }
    let model,
      list = isArrayOrList(data) ? data : [data]
    let i = 0,
      l = list.length
    for (; i < l; i++) {
      model = list[i]
      if ('object' != typeof model) {
        continue
      }
      if (this.isCheckModel && !this.validModel(model)) {
        logger.warn('The data is not exactly the same properties as the Model.', model)
        continue
      }
      if (!this.getModelClass()) {
        this.setModelClass(null, [model])
      }
      if (this.getModelClass() && !(model instanceof this.getModelClass())) {
        model = new(this.getModelClass())(list[i])
      }
      this.getProxy().push(model)
    }
    return this
  }

  setCheckModel(flag) {
    defineProperty(this, 'isCheckModel', flag, false)
  }

  addAll(dataList) {
    return this.add(dataList)
  }

  /**
   * process all member model by formatter
   * @param {Object.<string, (primitive value|Function|Array)} [formatter] - format property by config
   * @param {boolean} [whole] - whether this one formatter parameter only
   * @example
   * formart({
   *   key: value | function(source, model, formatter) {
   *       return source.key
   *   } | Array(['key', 'childKey', array index])
   * })
   * @return {List} this
   */
  format(formatter, whole = true) {
    // for (let model of this) {
    let model
    for (var i = 0, l = this.length; i < l; i++) {
      model = this[i]
      model.getPrototype().format.call(model, formatter, whole)
    }
    return this
  }

  /**
   * reset member by index of List
   * @param {number} idx
   * @param {Model} model
   * @return {List} this
   */
  set(idx, model) {
    if (idx !== undefined && idx < this.length && model) {
      if (!(model instanceof this.getModelClass())) {
        model = new(this.getModelClass())(model)
      }
      this.getProxy()[idx] = model;
    }
    return this
  }

  /** insert model after index */
  insert(idx, model) {
    if (!(model instanceof this.getModelClass())) {
      model = new(this.getModelClass())(model)
    }
    this.getProxy().splice(idx, 0, model)
    return this
  }

  get(index) {
    return this.getProxy()[index]
  }

  /** get member by condition */
  getBy(func) {
    if (typeof func !== 'function') return
    let result = new(this.constructor)()
    this.every((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        result.add(model)
      }
      return true
    })
    return result
  }

  /** get models by keys that key's value is not undefined */
  getByKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    return this.getBy(
      (model, idx, list) => {
        let result = false
        keys.every((key) => {
          if (model.hasOwnProperty(key)) {
            result = true
            return false
          }
          return true
        })
        return result
      }
    )
  }

  /** get models by key's value */
  getByValue(...values) {
    if (Array.isArray(values[0])) {
      values = values[0]
    }
    return this.getBy(
      (model, idx, list) => {
        let result = false
        model.each((key, value, model) => {
          if (values.includes(value)) {
            result = true
            // if have any same value, break current each
            return false
          }
        })
        return result
      }
    )
  }

  getByKeyValue(key, value) {
    return this.getBy((model) => {
      return model[key] === value
    })
  }

  /** get all model's value */
  getValues(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    return this.map(function (model) {
      if (keys.length) {
        return model.getPrototype().get.call(model, keys)
      } else {
        return model.getPrototype().getValues.call(model)
      }
    })
  }

  hasItem(...models) {
    if (Array.isArray(models[0])) {
      models = models[0]
    }
    for (let model of models) {
      if (!this.contains(model)) {
        return false
      }
    }
    return true
  }

  /** contains model by comparison function, default is model's equals */
  contains(item, func) {
    func = func || function (model, idx, item) {
      return model === item || model.getPrototype().equals.call(model, item)
    }
    return this.some((model, idx) => {
      return func.call(this, model, idx, item, this)
    })
  }

  /** indexOf model by condition */
  indexOfBy(func) {
    let i = 0,
      l = this.length
    func = func || function (model, idx) {
      return false
    }
    while (i < l) {
      if (func.call(this, this[i], i, this) === true) {
        return i
      }
      i++
    }
    return -1
  }

  indexOfByKey(key, value) {
    return this.indexOfBy((model) => {
      return model[key] === value
    })
  }

  /** alias of forEach */
  each(func) {
    if (typeof func !== 'function') return
    this.forEach(func)
    return this
  }

  /**
   * remove member from List
   * [start, end), interval to be left-closed and right-open
   * @param {number} start
   * @param {number} end
   */
  remove(start, end) {
    if (this.length <= 0) {
      return this
    }
    start = start < 0 ? 0 : start
    end = end || start + 1
    this.getProxy().splice(start, end - start)
    return this
  }

  /** remove full same members */
  removeItem(...items) {
    if (Array.isArray(items[0])) {
      items = items[0]
    }
    return this.removeBy((model, idx) => {
      return items.includes(model)
    })
    return this
  }

  /** remove item by condition */
  removeBy(func) {
    for (let i = 0, l = this.length; i < l; i++) {
      if (func.call(this, this[i], i, this) === true) {
        this.getProxy().splice(i, 1)
        l--
        i--
      }
    }
    return this
  }

  /** replace item by condition */
  replaceBy(item, func) {
    for (let i = 0, l = this.length; i < l; i++) {
      if (func.call(this, this[i], i, this) === true) {
        if (!(item instanceof this.getModelClass())) {
          item = new(this.getModelClass())(item)
        }
        this[i] = item
      }
    }
    return this
  }

  /** remove item by item's attribute */
  removeByKeyValue(key, value) {
    return this.removeBy((model) => {
      return model[key] === value;
    })
    return this
  }

  /** invert selection by condition */
  inverse(func) {
    if (typeof func !== 'function') return
    let copy = new(this.constructor)()
    this.forEach((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        return
      }
      copy.add(model)
    })
    return copy
  }

  empty() {
    this.remove(0, this.length)
    return this
  }

  clear() {
    this.empty()
    for (let item in this) {
      delete this[item]
    }
    return this
  }

  isEmpty() {
    return this.length === 0
  }

  /** deep comparison through model's toString */
  equals(list) {
    if (!(isArrayOrList(list)) || list.length !== this.length) {
      return false
    }
    return this.every((model, idx) => {
      return (model.getPrototype().equals.call(model, list[idx]))
    })
  }

  /** strictly unique from model equals */
  unique() {
    return this.uniqueBy((one, two) => {
      return one.equals(two)
    })
  }

  uniqueBy(func) {
    func = func || (() => false)
    let l = this.length
    while (l-- > 0) {
      for (let i = 0; i < l; i++) {
        if (func(this[l], this[i]) === true) {
          this.splice(l, 1)
          break
        }
      }
    }
    return this
  }

  /** unique by compare same key and value */
  uniqueByKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    return this.uniqueBy((one, two) => {
      return keys.every((key, i) => {
        return (one[key] === two[key])
      })
    })
  }

  /**
   * group by model's key
   * @param {string} key
   * @param {Function} func
   * @return {Object.<string, Array>} result - likes { key1: [model], key2: [...]}
   */
  groupBy(key, func) {
    let result = {}
    func = func || ((model, idx) => true)
    this.forEach((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        result[model[key]] = result[model[key]] || []
        result[model[key]].push(model)
      }
    })
    return result
  }

  /** count items by condition */
  countBy(func) {
    let result = 0
    func = func || ((model, idx) => false)
    this.forEach((model, idx) => {
      if (func.call(this, model, idx) === true) {
        result++
      }
    })
    return result
  }

  /** sort according key of model, the default order is asc */
  sortBy(key, order = 'asc') {
    this.sort(function (a, b) {
      let left = a[key],
        right = b[key]
      if (left === undefined || left === null) {
        return order == 'desc' ? 1 : -1
      }
      if (right === undefined || right === null) {
        return order == 'desc' ? -1 : 1
      }
      if (left > right) {
        return order == 'desc' ? -1 : 1
      }
      if (left < right) {
        return order == 'desc' ? 1 : -1
      }
      return 0
    })
    return this
  }

  /** swap item by index */
  swap(fromIdx, toIdx) {
    if (fromIdx < 0) {
      fromIdx = 0
    } else if (fromIdx > this.length - 1) {
      fromIdx = this.length - 1
    }
    if (toIdx < 0) {
      toIdx = 0
    } else if (toIdx > this.length - 1) {
      toIdx = this.length - 1
    }
    let from = this[fromIdx]
    let to = this[toIdx]
    if (this.length > toIdx) {
      this.splice(toIdx, 1, from)
      this.splice(fromIdx, 1, to)
    }
    return this
  }

  /** shallow copy via model clone */
  clone() {
    let result = new(this.constructor)()
    this.forEach((model) => {
      if (model instanceof Model) {
        result.add(model.getPrototype().clone.call(model))
      }
    })
    return result
  }

  /** List to array , model to object */
  toPlain() {
    let list = Array.from(this)
    list.map(function (model, i) {
      list[i] = (list[i] && typeof list[i].toPlain === 'function') ?
        list[i].toPlain() : list[i]
    })
    return list
  }

  /** convert plain objct to string */
  toString() {
    try {
      return JSON.stringify(this.toPlain())
    } catch (e) {
      logger.error(e);
    }
  }

  /** every model -> object -> string -> JSON */
  toJSON() {
    let list = Array.from(this)
    list.forEach(function (model, i) {
      list[i] = (model && typeof model.toJSON === 'function') ?
        model.toJSON() : model
    })
    return list
  }

  toArray() {
    return Array.from(this)
  }
}

// fix compile bug of webpack Babeljs loader whose can't extends Array prototype properties
// nodejs enviroment might ignore the bug
extendsArray(List)
/** List static config */
List.VALID_MODEL = false
export const Modelist = List
export default List
