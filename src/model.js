/**
 * @file model.js
 * @desc
 * - basic Model for data Model inheritance
 * - define data properties and formatter
 * - watching data change from Proxy
 * @author Jarry<jarryli@gmail.com>
 */

/** Utils */
export function is(clazz = 'Object') {
  return function (obj) {
    let type = '[object ' + clazz + ']'
    return (Object.prototype.toString.call(obj) == type)
  }
}
const isObject = is('Object')
const isModel = is('Model')
const isList = is('List')
const isArrayOrList = (obj) => {
  return (Array.isArray(obj) || isList(obj))
}
export function defineProperty(obj, key, val, enumerable, config) {
  Object.defineProperty(obj, key, Object.assign({
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  }, config))
}

export function format(model, formatter, source = {}) {
  if (!isObject(formatter)) {
    logger.warn('formatter is no an object.')
    return
  }
  for (let key in formatter) {
    if (isArrayOrList(formatter[key]) && formatter[key].length > 0) {
      let target = source
      for (let next of formatter[key]) {
        if (!isObject(target) && !isArrayOrList(target)) {
          target = model[key]
          break
        }
        target = target[next]
      }
      model[key] = target
    } else {
      model[key] = (typeof formatter[key] === 'function') ?
        (formatter[key]).call(model, source, model, formatter) :
        formatter[key]
    }
  }
  return model
}

export function addUpdateListener(obj, evt, func) {
  defineProperty(obj, 'on' + evt, func, false)
}

export function observeObject(object) {
  function createProxy(prefix, object) {
    return new Proxy(object, {
      set: (target, property, value, receiver) => {
        if (typeof property === 'symbol') {
          return true
        }
        let getter = property && property.get
        let setter = property && property.set
        value = getter ? getter.call(this) : value
        target[property] = value
        object.onUpdate.call(object, prefix + property, value, target, receiver)
        return true
      },

      get: (target, property, receiver) => {
        let getter = property && property.get
        let setter = property && property.set
        let value = getter ? getter.call(this) : target[property]
        if (isObject(value) && object.hasOwnProperty(value)) {
          return createProxy(prefix + property + '.', value)
        } else {
          return value
        }
      }
    })
  }

  return createProxy('', object)
}

/** Constants */
export const logger = console || {}
logger.INFO_ON = false
if (logger.INFO_ON) {
  logger.info = console.info
} else {
  logger.info = () => undefined
}
const _PROXY_ = Symbol('proxy')
const _FORMATTER_ = Symbol('formatter')

/** Class abstract Model for inheritance */
export default class Model {
  constructor() {
    // watcher from Proxy
    defineProperty(this, _PROXY_, observeObject(this), false)
    defineProperty(this, _FORMATTER_, {}, false)
  }

  /**
   * define properties for Model
   * @param {Object} props - properties key and value.
   * @example define({name:'Tom', gender: 1},
   *                 {gender: (key, value) => value === 1 ? 'boy': 'gril'})
   */
  define(props) {
    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        this[key] = props[key]
      }
    }
  }

  /**
   * initial formatter and to execute process and format
   * @param {JSON} source - The source JSON object.
   * @param {Object} [formatter] - properties key and value.
   * @example init({name:'Tom'}, {name: 'Jack'})
   * @return {Model} this
   */
  init(source, formatter) {
    if (!isObject(source) && !isModel(source)) {
      logger.warn('the source is not Object type')
      return this
    }
    // set source data
    defineProperty(this, '__source__', source, false, {
      writable: false
    })
    // set formatter
    this.getPrototype().setFormatter.call(this, formatter, false)
    // process source
    let processSource = this.preprocess(source, formatter)
    // copy source to properties
    this.each((key) => {
      if (this.hasOwnProperty(key) && source[key] !== undefined) {
        this.getPrototype().set.call(this, key, source[key])
      }
    })
    // format Model after processing source
    if (processSource !== false) {
      this.getPrototype().format.call(this)
    }
    return this
  }

  getPrototype() {
    return Object.getPrototypeOf(this);
  }

  get[Symbol.toStringTag]() {
    return 'Model'
  }

  getProxy() {
    return this[_PROXY_]
  }

  getSource() {
    return this['__source__']
  }

  getFormatter() {
    return this[_FORMATTER_]
  }

  addFormatter(formatter) {
    return this.getPrototype().setFormatter.call(this, formatter, false)
  }

  setFormatter(formatter, override = true) {
    if (override) {
      this[_FORMATTER_] = formatter
    } else {
      Object.assign(this.getPrototype().getFormatter.call(this), formatter)
    }
    return this
  }

  /**
   * for override to preprocess source data.
   * if return false will not execute format.
   */
  preprocess(source, formatter) {
    return true
  }

  /**
   * process data by formatter
   * @param {Object.<string, (primitive value|Function|Array)} [formatter] - format property by config
   * @param {boolean} [whole] - whether this one formatter parameter only
   * @example
   * formart({
   *   key: value | function(source, model, formatter) {
   *       return source.key
   *   } | Array(['key', 'childKey', array index])
   * })
   * @return {Model} this
   */
  format(formatter, whole = true) {
    if (formatter && whole) {
      Object.assign(this.getPrototype().getFormatter.call(this), formatter)
    }
    formatter = whole ? this.getPrototype().getFormatter.call(this) : formatter
    format(this.getProxy(), formatter, this.getSource())
    this.getPrototype().formatted.call(this, formatter)
    return this
  }

  /**
   * for override, invoke after format done
   */
  formatted(...args) {
    logger.info("%c%s", "color: blue;", 'Model formatted:', arguments)
  }

  /** for override, watch data change */
  onUpdate(key, value, model, proxy) {
    logger.info("%c%s", "color: red;", 'Model onUpdate:', arguments)
  }

  /** for override the onUpdate */
  addUpdateListener(func) {
    addUpdateListener(this, 'Update', func)
    return this
  }

  addFunction(funcName, func) {
    if (typeof funcName !== 'string' || typeof func !== 'function'
      || typeof this[funcName] !== 'function') {
        return this
    }
    defineProperty(this, funcName, func, false)
    return this
  }

  /**
   * each every properties. break loop while func returns false
   * @param {Function} func - function(key, value, Model) {}
   * @return {Model} this
   */
  each(func) {
    if (typeof func !== 'function') return
    for (let key in this) {
      if (this.hasOwnProperty(key)) {
        if (func.call(this, key, this[key], this) === false) {
          break
        }
      }
    }
    return this
  }

  /**
   * reset value by key
   * @param {string} key
   * @param {*} value
   * @return {Model} this
   */
  set(key, value) {
    this.getProxy()[key] = value
    return this
  }

  add(key, value) {
    if (!this.hasOwnProperty(key)) {
      this.getPrototype().set.call(this, key, value)
    }
    return this
  }

  addAll(obj) {
    for (var key in obj) {
      this.add(key, obj[key])
    }
    return this
  }

  /**
   * input key or keys, return values
   * @param {...string | Array.<string> } keys
   * @param {*} value
   * @return {Array} result
   */
  get(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    if (keys.length <= 1) {
      return this.getProxy()[keys]
    }
    let result = []
    keys.every((key) => {
      if (this.hasOwnProperty(key)) {
        result.push(this[key])
      }
      return true
    })
    this.onUpdate(keys, result, this, this.getProxy())
    return result
  }

  /**
   * get value array by condition
   */
  getBy(func) {
    let result = []
    if (typeof func !== 'function') return
    this.getPrototype().each.call(this, (key, value) => {
      if (func.call(this, key, value, this) === true) {
        result.push(value)
      }
    })
    this.onUpdate(func, result, this, this.getProxy())
    return result
  }

  getLength() {
    return this.getPrototype().getKeys.call(this).length
  }

  empty() {
    this.getPrototype().each.call(this, (key) => {
      this.getPrototype().removeKey.call(this, key)
    })
    return this
  }

  getKeys() {
    return Object.keys(this)
  }

  getValues() {
    return Object.values(this)
  }

  getEntries() {
    return Object.entries(this)
  }

  hasKey(...keys) {
    if (keys === undefined) return false
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    return keys.every((key) => {
      if (this.hasOwnProperty(key)) {
        return true
      }
      return false
    })
  }

  hasValue(...values) {
    if (values === undefined) return false
    if (Array.isArray(values[0])) {
      values = values[0]
    }
    let result
    return values.every((value) => {
      result = false
      this.getPrototype().each.call(this, (key, val) => {
        if (value === val) {
          result = true
          return
        } else if (val !== undefined) {
          if (Array.isArray(value) && value.toString() === val.toString()) {
            result = true
            return
          } else if (isObject(value) && JSON.stringify(value) === JSON.stringify(val)) {
            result = true
            return
          }
        }
      })
      return result
    })
  }

  hasKeyValue(key, value) {
    return (this[key] === value)
  }

  /**
   * remove this by function
   * @param {Function} func - function(key, value, Model)
   * @return {Model} this
   */
  removeBy(func) {
    if (typeof func !== 'function') return
    this.getPrototype().each.call(this, (key, value) => {
      if (func.call(this, key, value, this) === true) {
        delete this.getProxy()[key]
      }
    })
    return this
  }

  removeKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0]
    }
    keys.forEach((key) => {
      delete this.getProxy()[key]
    })
    return this
  }

  removeValue(...values) {
    if (Array.isArray(values[0])) {
      values = values[0]
    }
    this.getPrototype().each.call(this, (key, value) => {
      if (values.includes(value)) {
        delete this.getProxy()[key]
      }
    })
    return this
  }

  /**
   * filter out properties by function
   * @param {Function} func - function(key, value, Model)
   * @return {Object} result
   */
  filter(func) {
    if (typeof func !== 'function') return
    let result = {}
    for (let key in this) {
      if (func.call(this, key, this[key], this) === true) {
        result[key] = this[key]
      }
    }
    return result
  }

  /**
   * deep comparison by JSONStringify
   */
  equals(obj) {
    if (obj === this) {
      return true
    }
    if (typeof obj !== typeof this || obj === undefined || obj === null) {
      return false
    }
    if (Object.keys(obj).length !== this.getLength()) {
      return false
    }
    try {
      return this.toString() === JSON.stringify(obj)
    } catch (ex) {
      logger.error(obj, this, ' equals error.')
      return false
    }
  }

  /**
   * shallow copy property
   */
  clone() {
    let copy = new(this.constructor)(this)
    this.each((key) => copy[key] = this[key])
    return copy
  }

  toString() {
    try {
      return JSON.stringify(this.toPlain());
    } catch (e) {
      logger.error('toString error:', e);
    }
  }

  /**
   * convert self and every Model/List property to plain objects
   */
  toPlain() {
    let _toArray = (obj) => {
      let result = []
      obj.forEach((member, idx) => {
        result[idx] = _toPlain(member)
      })
      return result
    }
    let _toObject = (obj) => {
      let result = {}
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = _toPlain(obj[key])
        }
      }
      return result
    }
    let _toPlain = (obj) => {
      if (isArrayOrList(obj)) {
        return _toArray(obj)
      } else if (isObject(obj) || obj instanceof Model) {
        return _toObject(obj)
      }
      return obj
    }

    try {
      return _toPlain(this)
    } catch (e) {
      logger.error('toPlain error:', e);
    }
  }

  toJSON() {
    let _toJSON = (obj) => {
      if (obj === undefined) {
        return
      }
      let result
      // returns the primitive value
      if (typeof obj === 'string' || typeof obj === 'number' ||
        obj === null || typeof obj === 'boolean'
        // || typeof obj === 'symbol'
      ) {
        result = obj
      // Array or List
      } else if (isArrayOrList(obj)) {
        result = []
        obj.forEach((member, idx) => {
          if (member !== undefined) {
            result[idx] = _toJSON(member)
          }
        })
      // plain Object or Model
      } else if (isObject(obj) || obj instanceof Model) {
        result = {}
        for (var key in obj) {
          if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            result[key] = _toJSON(obj[key])
          }
        }
      } else if (obj !== null && obj !== undefined) {
        // other Objects to string
          result = obj.toString()
      }
      return result
    }

    try {
      return _toJSON(this)
    } catch (e) {
      logger.error('toJSON error:', e);
    }
  }

  /**
   * creating temporary Model
   * @param {Object} props - { key: value }
   * @param {Object.<key, (value|Function|Array)} [formatter] - see format function
   * @param {Object.<key, Function>} [functions] - ovrride function list { name: function() {} }
   * @return {AnonymousModel} new anonymouse Model
   */
  static createModel(props, formatter, functions) {
    return class AnonymousModel extends Model {
      /**
       * constructor of the new anonymous Model
       * @param {Object.<key, value>} source
       * @param {Object.<key, (value|Function|Array)>} formula
       */
      constructor(source, formula) {
        super()
        super.define(props)
        for (var name in functions) {
          super.addFunction(name, functions[name])
        }
        super.init.call(this, source, Object.assign(formatter || {}, formula))
      }
    }
  }
}
