/**
 * @file model.js
 * @desc
 * - basic Model for data Model inheritance
 * - define data properties and formatter
 * - watching data change from Proxy
 * @author Jarry<jarryli@google.com>
 */

/** Utils */
function is(clazz = 'Object') {
  return function (obj) {
    let type = '[object ' + clazz + ']';
    return (Object.prototype.toString.call(obj) == type)
  }
}
const isObject = is('Object');
const isModel = is('Model');
const isList = is('List');
const isArrayOrList = (obj) => {
  return (Array.isArray(obj) || isList(obj))
};
function defineProperty(obj, key, val, enumerable, config) {
  Object.defineProperty(obj, key, Object.assign({
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  }, config));
}

function format(model, formatter, source = {}) {
  if (!isObject(formatter)) {
    logger.warn('formatter is no an object.');
    return
  }
  for (let key in formatter) {
    if (isArrayOrList(formatter[key]) && formatter[key].length > 0) {
      let target = source;
      for (let next of formatter[key]) {
        if (!isObject(target) && !isArrayOrList(target)) {
          target = model[key];
          break
        }
        target = target[next];
      }
      model[key] = target;
    } else {
      model[key] = (typeof formatter[key] === 'function') ?
        (formatter[key]).call(model, source, model, formatter) :
        formatter[key];
    }
  }
  return model
}

function addUpdateListener(obj, evt, func) {
  defineProperty(obj, 'on' + evt, func, false);
}

function observeObject(object) {
  function createProxy(prefix, object) {
    return new Proxy(object, {
      set: (target, property, value, receiver) => {
        if (typeof property === 'symbol') {
          return true
        }
        let getter = property && property.get;
        let setter = property && property.set;
        value = getter ? getter.call(this) : value;
        target[property] = value;
        object.onUpdate.call(object, prefix + property, value, target, receiver);
        return true
      },

      get: (target, property, receiver) => {
        let getter = property && property.get;
        let setter = property && property.set;
        let value = getter ? getter.call(this) : target[property];
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
const logger = console || {};
logger.INFO_ON = false;
if (logger.INFO_ON) {
  logger.info = console.info;
} else {
  logger.info = () => undefined;
}
const _PROXY_ = Symbol('proxy');
const _FORMATTER_ = Symbol('formatter');

/** Class abstract Model for inheritance */
class Model {
  constructor() {
    // watcher from Proxy
    defineProperty(this, _PROXY_, observeObject(this), false);
    defineProperty(this, _FORMATTER_, {}, false);
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
        this[key] = props[key];
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
      logger.warn('the source is not Object type');
      return this
    }
    // set source data
    defineProperty(this, '__source__', source, false, {
      writable: false
    });
    // set formatter
    this.getPrototype().setFormatter.call(this, formatter, false);
    // process source
    let processSource = this.preprocess(source, formatter);
    // copy source to properties
    this.each((key) => {
      if (this.hasOwnProperty(key) && source[key] !== undefined) {
        this.getPrototype().set.call(this, key, source[key]);
      }
    });
    // format Model after processing source
    if (processSource !== false) {
      this.getPrototype().format.call(this);
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
      this[_FORMATTER_] = formatter;
    } else {
      Object.assign(this.getPrototype().getFormatter.call(this), formatter);
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
      Object.assign(this.getPrototype().getFormatter.call(this), formatter);
    }
    formatter = whole ? this.getPrototype().getFormatter.call(this) : formatter;
    format(this.getProxy(), formatter, this.getSource());
    this.getPrototype().formatted.call(this, formatter);
    return this
  }

  /**
   * for override, invoke after format done
   */
  formatted(...args) {
    logger.info("%c%s", "color: blue;", 'Model formatted:', arguments);
  }

  /** for override, watch data change */
  onUpdate(key, value, model, proxy) {
    logger.info("%c%s", "color: red;", 'Model onUpdate:', arguments);
  }

  /** for override the onUpdate */
  addUpdateListener(func) {
    addUpdateListener(this, 'Update', func);
    return this
  }

  addFunction(funcName, func) {
    if (typeof funcName !== 'string' || typeof func !== 'function'
      || typeof this[funcName] !== 'function') {
        return this
    }
    defineProperty(this, funcName, func, false);
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
    this.getProxy()[key] = value;
    return this
  }

  add(key, value) {
    if (!this.hasOwnProperty(key)) {
      this.getPrototype().set.call(this, key, value);
    }
    return this
  }

  addAll(obj) {
    for (var key in obj) {
      this.add(key, obj[key]);
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
      keys = keys[0];
    }
    if (keys.length <= 1) {
      return this.getProxy()[keys]
    }
    let result = [];
    keys.every((key) => {
      if (this.hasOwnProperty(key)) {
        result.push(this[key]);
      }
      return true
    });
    this.onUpdate(keys, result, this, this.getProxy());
    return result
  }

  /**
   * get value array by condition
   */
  getBy(func) {
    let result = [];
    if (typeof func !== 'function') return
    this.getPrototype().each.call(this, (key, value) => {
      if (func.call(this, key, value, this) === true) {
        result.push(value);
      }
    });
    this.onUpdate(func, result, this, this.getProxy());
    return result
  }

  getLength() {
    return this.getPrototype().getKeys.call(this).length
  }

  empty() {
    this.getPrototype().each.call(this, (key) => {
      this.getPrototype().removeKey.call(this, key);
    });
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
      keys = keys[0];
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
      values = values[0];
    }
    let result;
    return values.every((value) => {
      result = false;
      this.getPrototype().each.call(this, (key, val) => {
        if (value === val) {
          result = true;
          return
        } else if (val !== undefined) {
          if (Array.isArray(value) && value.toString() === val.toString()) {
            result = true;
            return
          } else if (isObject(value) && JSON.stringify(value) === JSON.stringify(val)) {
            result = true;
            return
          }
        }
      });
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
        delete this.getProxy()[key];
      }
    });
    return this
  }

  removeKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0];
    }
    keys.forEach((key) => {
      delete this.getProxy()[key];
    });
    return this
  }

  removeValue(...values) {
    if (Array.isArray(values[0])) {
      values = values[0];
    }
    this.getPrototype().each.call(this, (key, value) => {
      if (values.includes(value)) {
        delete this.getProxy()[key];
      }
    });
    return this
  }

  /**
   * filter out properties by function
   * @param {Function} func - function(key, value, Model)
   * @return {Object} result
   */
  filter(func) {
    if (typeof func !== 'function') return
    let result = {};
    for (let key in this) {
      if (func.call(this, key, this[key], this) === true) {
        result[key] = this[key];
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
      logger.error(obj, this, ' equals error.');
      return false
    }
  }

  /**
   * shallow copy property
   */
  clone() {
    let copy = new(this.constructor)(this);
    this.each((key) => copy[key] = this[key]);
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
      let result = [];
      obj.forEach((member, idx) => {
        result[idx] = _toPlain(member);
      });
      return result
    };
    let _toObject = (obj) => {
      let result = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = _toPlain(obj[key]);
        }
      }
      return result
    };
    let _toPlain = (obj) => {
      if (isArrayOrList(obj)) {
        return _toArray(obj)
      } else if (isObject(obj) || obj instanceof Model) {
        return _toObject(obj)
      }
      return obj
    };

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
      let result;
      // returns the primitive value
      if (typeof obj === 'string' || typeof obj === 'number' ||
        obj === null || typeof obj === 'boolean'
        // || typeof obj === 'symbol'
      ) {
        result = obj;
      // Array or List
      } else if (isArrayOrList(obj)) {
        result = [];
        obj.forEach((member, idx) => {
          if (member !== undefined) {
            result[idx] = _toJSON(member);
          }
        });
      // plain Object or Model
      } else if (isObject(obj) || obj instanceof Model) {
        result = {};
        for (var key in obj) {
          if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            result[key] = _toJSON(obj[key]);
          }
        }
      } else if (obj !== null && obj !== undefined) {
        // other Objects to string
          result = obj.toString();
      }
      return result
    };

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
        super();
        super.define(props);
        for (var name in functions) {
          super.addFunction(name, functions[name]);
        }
        super.init.call(this, source, Object.assign(formatter || {}, formula));
      }
    }
  }
}

/**
 * @file list.js
 * @desc
 * - batch processing Model member of List
 * - more util method to process List data simply
 * - watching data change use Proxy
 * @author Jarry<jarryli@google.com>
 */
const isModelClass = (modelClass) => {
  return (modelClass === Model ||
    Model.prototype.isPrototypeOf(modelClass.prototype))
  // modelClass.prototype instanceof Model)
};

/** Utils */
const isList$1 = is('List');
const isPlainObject = function (obj) {
  if (obj && obj.constructor &&
    !hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')) {
    return false
  }
  return true
};
const isArrayOrList$1 = function (dataList) {
  if (Array.isArray(dataList) || isList$1(dataList) || dataList instanceof List) {
    return true
  }
  return false
};
const createAnonymousModel = function (data, formatter) {
  if (typeof data !== 'object') return
  let properties = {};
  let keys = Object.keys(data);
  for (var key of keys) {
    properties[key] = null;
  }
  return Model.createModel(properties, formatter)
};
const extendsArray = function(clazz) {
  var props = [];
  props = [...Object.getOwnPropertyNames(Object.getPrototypeOf([]))];
  for (var prop of props) {
    // extends all properties form Array.prototype, but not override
    if (prop !== 'constructor' && prop !== 'length'
      && !(clazz.prototype.hasOwnProperty(prop))) {
        defineProperty(clazz.prototype, prop, Array.prototype[prop], false);
    }
  }
  defineProperty(clazz.prototype, 'length', 0, false);
  defineProperty(clazz.prototype, Symbol.iterator, Array.prototype[Symbol.iterator], false);
  // defineProperty(clazz.prototype, 'constructor', Array, false)
  return clazz
};

/** Constants */
const _MODEL_CLASS_ = Symbol('ModelClass');
const _PROXY_$1 = Symbol('proxy');

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
    this.setCheckModel(List.VALID_MODEL);
    this.setModelClass(modelClass, dataList);
    this.setProxy();
    this.init(dataList);
  }

  init(dataList) {
    this.clear();
    if (dataList) {
      if (!this.getModelClass()) {
        this.setModelClass(null, dataList);
      }
      this.add(dataList);
    }
    return this
  }

  /** defined model Symbol for validation data's Model */
  setModelClass(modelClass, dataList = []) {
    if (!modelClass || !isModelClass(modelClass)) {
      if (dataList[0] && isModelClass(dataList[0].constructor)) {
        modelClass = dataList[0].constructor;
      } else if (typeof Model !== undefined && Model.createModel) {
        modelClass = createAnonymousModel(dataList[0]);
      }
    }
    defineProperty(this, _MODEL_CLASS_, modelClass, false);
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
    defineProperty(this, _PROXY_$1, observeObject(this), false);
  }

  getProxy() {
    return this[_PROXY_$1]
  }

  /** for override, watch data change */
  onUpdate(idx, item, list, proxy) {
    // logger.info("%c%s", "color: red;", 'List onUpdate:', arguments)
  }

  /** for override the onUpdate */
  addUpdateListener(func) {
    addUpdateListener(this, 'Update', func);
    return this
  }

  addFunction(funcName, func) {
    if (typeof funcName !== 'string' || typeof func !== 'function'
      || typeof this[funcName] !== 'function') {
        logger.error('override ' + funcName + ' function failed.');
        return this
    }
    defineProperty(this, funcName, func, false);
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
      list = isArrayOrList$1(data) ? data : [data];
    let i = 0,
      l = list.length;
    for (; i < l; i++) {
      model = list[i];
      if ('object' != typeof model) {
        continue
      }
      if (this.isCheckModel && !this.validModel(model)) {
        logger.warn('The data is not exactly the same properties as the Model.', model);
        continue
      }
      if (!this.getModelClass()) {
        this.setModelClass(null, [model]);
      }
      if (this.getModelClass() && !(model instanceof this.getModelClass())) {
        model = new(this.getModelClass())(list[i]);
      }
      this.getProxy().push(model);
    }
    return this
  }

  setCheckModel(flag) {
    defineProperty(this, 'isCheckModel', flag, false);
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
    let model;
    for (var i = 0, l = this.length; i < l; i++) {
      model = this[i];
      model.getPrototype().format.call(model, formatter, whole);
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
        model = new(this.getModelClass())(model);
      }
      this.getProxy()[idx] = model;
    }
    return this
  }

  /** insert model after index */
  insert(idx, model) {
    if (!(model instanceof this.getModelClass())) {
      model = new(this.getModelClass())(model);
    }
    this.getProxy().splice(idx, 0, model);
    return this
  }

  get(index) {
    return this.getProxy()[index]
  }

  /** get member by condition */
  getBy(func) {
    if (typeof func !== 'function') return
    let result = new(this.constructor)();
    this.every((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        result.add(model);
      }
      return true
    });
    return result
  }

  /** get models by keys that key's value is not undefined */
  getByKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0];
    }
    return this.getBy(
      (model, idx, list) => {
        let result = false;
        keys.every((key) => {
          if (model.hasOwnProperty(key)) {
            result = true;
            return false
          }
          return true
        });
        return result
      }
    )
  }

  /** get models by key's value */
  getByValue(...values) {
    if (Array.isArray(values[0])) {
      values = values[0];
    }
    return this.getBy(
      (model, idx, list) => {
        let result = false;
        model.each((key, value, model) => {
          if (values.includes(value)) {
            result = true;
            // if have any same value, break current each
            return false
          }
        });
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
      keys = keys[0];
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
      models = models[0];
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
    };
    return this.some((model, idx) => {
      return func.call(this, model, idx, item, this)
    })
  }

  /** indexOf model by condition */
  indexOfBy(func) {
    let i = 0,
      l = this.length;
    func = func || function (model, idx) {
      return false
    };
    while (i < l) {
      if (func.call(this, this[i], i, this) === true) {
        return i
      }
      i++;
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
    this.forEach(func);
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
    start = start < 0 ? 0 : start;
    end = end || start + 1;
    this.getProxy().splice(start, end - start);
    return this
  }

  /** remove full same members */
  removeItem(...items) {
    if (Array.isArray(items[0])) {
      items = items[0];
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
        this.getProxy().splice(i, 1);
        l--;
        i--;
      }
    }
    return this
  }

  /** replace item by condition */
  replaceBy(item, func) {
    for (let i = 0, l = this.length; i < l; i++) {
      if (func.call(this, this[i], i, this) === true) {
        if (!(item instanceof this.getModelClass())) {
          item = new(this.getModelClass())(item);
        }
        this[i] = item;
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
    let copy = new(this.constructor)();
    this.forEach((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        return
      }
      copy.add(model);
    });
    return copy
  }

  empty() {
    this.remove(0, this.length);
    return this
  }

  clear() {
    this.empty();
    for (let item in this) {
      delete this[item];
    }
    return this
  }

  isEmpty() {
    return this.length === 0
  }

  /** deep comparison through model's toString */
  equals(list) {
    if (!(isArrayOrList$1(list)) || list.length !== this.length) {
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
    func = func || (() => false);
    let l = this.length;
    while (l-- > 0) {
      for (let i = 0; i < l; i++) {
        if (func(this[l], this[i]) === true) {
          this.splice(l, 1);
          break
        }
      }
    }
    return this
  }

  /** unique by compare same key and value */
  uniqueByKey(...keys) {
    if (Array.isArray(keys[0])) {
      keys = keys[0];
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
    let result = {};
    func = func || ((model, idx) => true);
    this.forEach((model, idx) => {
      if (func.call(this, model, idx, this) === true) {
        result[model[key]] = result[model[key]] || [];
        result[model[key]].push(model);
      }
    });
    return result
  }

  /** count items by condition */
  countBy(func) {
    let result = 0;
    func = func || ((model, idx) => false);
    this.forEach((model, idx) => {
      if (func.call(this, model, idx) === true) {
        result++;
      }
    });
    return result
  }

  /** sort according key of model, the default order is asc */
  sortBy(key, order = 'asc') {
    this.sort(function (a, b) {
      let left = a[key],
        right = b[key];
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
    });
    return this
  }

  /** swap item by index */
  swap(fromIdx, toIdx) {
    if (fromIdx < 0) {
      fromIdx = 0;
    } else if (fromIdx > this.length - 1) {
      fromIdx = this.length - 1;
    }
    if (toIdx < 0) {
      toIdx = 0;
    } else if (toIdx > this.length - 1) {
      toIdx = this.length - 1;
    }
    let from = this[fromIdx];
    let to = this[toIdx];
    if (this.length > toIdx) {
      this.splice(toIdx, 1, from);
      this.splice(fromIdx, 1, to);
    }
    return this
  }

  /** shallow copy via model clone */
  clone() {
    let result = new(this.constructor)();
    this.forEach((model) => {
      if (model instanceof Model) {
        result.add(model.getPrototype().clone.call(model));
      }
    });
    return result
  }

  /** List to array , model to object */
  toPlain() {
    let list = Array.from(this);
    list.map(function (model, i) {
      list[i] = (list[i] && typeof list[i].toPlain === 'function') ?
        list[i].toPlain() : list[i];
    });
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
    let list = Array.from(this);
    list.forEach(function (model, i) {
      list[i] = (model && typeof model.toJSON === 'function') ?
        model.toJSON() : model;
    });
    return list
  }

  toArray() {
    return Array.from(this)
  }
}

// fix compile bug of webpack Babeljs loader whose can't extends Array prototype properties
// nodejs enviroment might ignore the bug
extendsArray(List);
/** List static config */
List.VALID_MODEL = false;

export { Model, List };
