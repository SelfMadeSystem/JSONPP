function parseJSONPP(input: any) {
  var p = new Parser(input);
  p.parse()
  return p.root;
}

function parseNumAuto(s: string) {
  var base = 10;
  var sw = s.startsWith('-') || s.startsWith('+');
  var b: any;
  b = s.substring(sw ? 1 : 0, 2)

  switch (b) {
    case '0b':
      base = 2;
      break;
    case '0o':
      base = 8;
      break;
    case '0x':
      base = 16;
      break;
  }

  if (base != 10) {
    if (sw) {
      s = s.substring(0, 1) + s.substring(3);
    } else {
      s = s.substring(2);
    }
  }

  return parseNumBase(s, base);
}

function parseNumBase(s: { startsWith: (arg0: string) => any; substring: (arg0: number) => any; split: (arg0: string) => any; }, b: number) {
  const neg = s.startsWith('-');
  if (neg || s.startsWith('+')) {
    s = s.substring(1);
  }
  const split = s.split('.');
  return (parseIntBase(split[0], b) + (split.length == 1 ? 0 : parseFloatBase(split[1], b))) * (neg ? -1 : 1);
}

function parseIntBase(s: any[], b: number) {
  const { length } = s;
  var result = 0;
  var pow = 1;
  for (var i = 0; i < length; i++) {
    var c = s[length - i - 1];
    if (!isValidNumBaseChar(c, b)) throw 'Invalid char: ' + c + ' for base: ' + b;
    result += getNumForChar(c) * pow;
    pow *= b;
  }
  return result;
}

function parseFloatBase(s: any[], b: number) {
  const { length } = s;
  var result = 0;
  var pow = 1/b;
  for (var i = 0; i < length; i++) {
    var c = s[i];
    if (!isValidNumBaseChar(c, b)) throw 'Invalid char: ' + c + ' for base: ' + b;
    result += getNumForChar(c) * pow;
    pow /= b;
  }
  return result;
}

function isValidNumBaseChar(c: { toLowerCase: () => { (): any; new(): any; charCodeAt: { (): any; new(): any; }; }; }, b: number) {
  const i = c.toLowerCase().charCodeAt();
  return (i >= 48 && i <= 57 || i >= 97 && i <= 122) && getNumForChar(c) < b;
}

function getNumForChar(c: { toLowerCase: () => { (): any; new(): any; charCodeAt: { (): any; new(): any; }; }; }) {
  const i = c.toLowerCase().charCodeAt();
  return i >= 48 && i <= 57 ? i - 48 : i - 87;
}

class Obj {
  obj: {};
  cache: any;
  root: Obj | Arr;
  constructor(root: Obj | Arr) {
    this.obj = {};
    this.cache = undefined;
    this.root = root;
  }

  get(s: string) {
    var split = s.split('.');

    var i = split[0];
    var item = this.obj[i];

    if (split.length > 1 && item.get instanceof Function) {
      split.shift()
      return item.get(split.join('.'));
    }

    return item.toRaw();
  }

  toRaw() {
    if (this.cache) {
      return this.cache;
    }
    this.cache = {};

    for (var i in this.obj) {
      if (this.obj.hasOwnProperty(i)) {
        this.cache[i] = this.obj[i].toRaw();
      }
    }

    return this.cache;
  }
}

class Arr {
  arr: any[];
  root: any;
  cache: any;
  constructor(root: any) {
    this.arr = [];
    this.root = root;
    this.cache = undefined;
  }

  get(s: string) {
    var split = s.split('.');

    var i = parseInt(split[0]);
    var item = this.arr[i];

    if (split.length > 1 && item.get instanceof Function) {
      split.shift()
      return item.get(split.join('.'));
    }

    return item.toRaw();
  }

  toRaw() {
    if (this.cache) {
      return this.cache;
    }
    this.cache = []
    this.arr.forEach((e, i) => {
      this.cache.push(e.toRaw())
    });

    return this.cache;
  }
}

class Ref {
  ref: any;
  root: any;
  constructor(root: any, ref: any) {
    this.ref = ref;
    this.root = root;
  }

  toRaw() {
    return this.root.get(this.ref);
  }
}

class Raw {
  raw: any;
  root: any;
  constructor(root: any, raw?: undefined) {
    this.raw = raw;
    this.root = root;
  }

  toRaw() {
    return this.raw;
  }
}

class Parser {
  root: any;
  tokenizer: Tokenizer;
  tokens: any[];
  at: number;
  lookingForParam: boolean;
  constructor(input: any) {
    this.tokenizer = new Tokenizer(input);
    this.tokens = [];
    this.at = 0;
    this.lookingForParam = false;
    this.root = new Obj(null);
  }

  parse() {
    this.tokenizer.start();
    this.tokens = this.tokenizer.tokens;
    var next = this.get();
    switch (next.type) {
      case 'key':
        this.root.obj = this.getNextObjRoot().obj;
        break;
      case 'obj':
        this.root.obj = this.getNextObj().obj;
        break;
      case 'arr':
        this.root = new Arr(null);
        this.root.arr = this.getNextArr().arr;
        break;
      default:
        this.root = this.getNext();
        break;
    }
    if (!this.isDone()) {
      throw "OEF Expected"
    }
  }

  getNext() {
    const t = this.get()
    const { type, content } = t;
    switch (type) {
      case 'key':
        return this.getNextKey(t);
      case 'obj':
        return this.getNextObj();
      case 'arr':
        return this.getNextArr();
      case 'str':
        return new Raw(this.root, content);
      case 'ref':
        return new Ref(this.root, content);
      default:
        return new Raw(this.root, content);
    }
  }

  getNextKey(t: { content: any; }) {
    var raw = new Raw(this.root);
    const { content } = t;
    switch (content) {
      case 'true':
        raw.raw = true;
        break;
      case 'false':
        raw.raw = false;
        break;
      case 'null':
        raw.raw = null;
        break;
      default:
        if (this.isNumerical(content[0])) {
          raw.raw = parseNumAuto(content);
          break;
        }
        raw.raw = content;
        break;
    }
    return raw;
  }

  getNextObj() {
    const obj = new Obj(this.root);
    this.at++;
    this.checkOEF();
    while (this.get().type != 'objEnd') {
      this.checkOEF();
      var key: string | number;
      const t = this.get();
      const { type, content } = t;
      switch (type) {
        case 'key':
        case 'str':
          key = content;
          break;
        default:
          throw 'Bad. ' + t.type;
      }
      this.at++;
      obj.obj[key] = this.getNext();
      this.at++;
    }
    return obj;
  }

  getNextObjRoot() {
    const obj = new Obj(this.root);
    this.checkOEF();
    while (!this.isDone()) {
      var key: string | number;
      const t = this.get();
      const { type, content } = t;
      switch (type) {
        case 'key':
        case 'str':
          key = content;
          break;
        default:
          throw 'Bad. ' + t.type;
      }
      this.at++;
      obj.obj[key] = this.getNext();
      this.at++;
    }
    return obj;
  }

  getNextArr() {
    const arr = new Arr(this.root);
    this.at++;
    while (this.get().type != 'arrEnd') {
      this.checkOEF();
      arr.arr.push(this.getNext());
      this.at++;
    }
    return arr;
  }

  isNumerical(c: string) {
    const code = c.charCodeAt(0);
    //           0          9            _            .            -
    return (code >= 48 && code <= 57) || (code == 95) || (code == 46) || (code == 45);
  }

  get(i?: number) {
    return this.tokens[this.at + (i || 0)];
  }

  isDone() {
    return this.at >= this.tokens.length;
  }

  checkOEF() {
    if (this.isDone())
      throw 'Unexpected OEF'
  }
}
