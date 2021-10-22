const tokenTypes = [
  'key',    // Key                    key: 'OwO'
  'sep',    // Seperator              :
  'obj',    // Object                 {
  'objEnd', // Obj end                }
  'arr',    // Array                  [
  'arrEnd', // Array                  ]
  'str',    // String                 " or '
  'ref',    // Reference              ${
  'cmt',    // Comment
  'mlc'     /* Multi-line comment */
]

class Token {
  type: any;
  content: any;
  constructor(type: any, content: any) {
    this.type = type;
    this.content = content;
  }
}

class Tokenizer {
  input: any;
  at: number;
  info: any;
  content: any;
  tokens: any[];// TODO: Comments
  constructor(input: any) {
    this.input = input;
    this.at = 0;
    this.info = undefined;
    this.content = undefined;
    this.tokens = [];
  }

  start() {
    while (!this.isDone()) {
      this.nextToken();
    }
  }

  nextToken() {
    var token = this.getToken();
    if (token == undefined) {
      return;
    }
    this.content = undefined;
    // console.log(token, this.get());
    switch (token) {
      case 'key':
        this.loopKey();
        break;
      case 'str':
        this.loopStr();
        break;
      case 'sep':
        this.at++;
        return;
      case 'ref':
        this.loopRef();
        break;
      case 'cmt':
        this.loopCmt();
        return;
      case 'mlc':
        this.loopMlc();
        return;
      default:
        this.at++;
    }
    this.tokens.push(new Token(token, this.content))
  }

  loopKey() {
    this.content = '';
    do {
      this.content += this.get();
      this.at++;
    } while (!this.isDone() && this.isKeyChar());
    this.content = this.content.trim();
  }

  loopStr() {
    this.info = this.get();
    this.content = '';
    this.at++;
    do {
      this.content += this.parseNextStringChar();
    } while (!this.isDone() && this.get() != this.info);
    this.at++;
  }

  loopRef() {
    this.info = '}';
    this.content = '';
    this.at++;
    this.at++;
    do {
      this.content += this.parseNextStringChar();
    } while (!this.isDone() && this.get() != this.info);
    this.at++;
  }

  loopCmt() {
    do {
      this.at++;
    } while (!this.isDone() && this.get() != "\n");
    this.at++;
  }

  loopMlc() {
    do {
      this.at++;
    } while (!this.isDone() && !(this.get() == "*" && this.get(1) == "/"));
    this.at++;
    this.at++;
  }

  parseNextStringChar() {
    var c = this.get();
    this.at++;
    if (c == '\\') {
      c = this.getUnescapedChar();
      this.at++;
    }
    return c;
  }

  getUnescapedChar() {
    var c = this.get();
    switch (c) {
      case '\b':
      case '\n':
      case '\r':
      case '\t':
      case '\v':
        return '';
      case 'b':
        return '\b';
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case 'v':
        return '\v';
      // case 'x':
      //   return '\v';
      default:
        return c;
    }
  }

  getToken() {
    if (this.isDone()) {
      return;
    }
    switch (this.get()) {
      case ':':
      case ',':
        return 'sep';
      case "{":
        return 'obj';
      case "}":
        return 'objEnd';
      case "[":
        return 'arr';
      case "]":
        return 'arrEnd';
      case "'":
      case '"':
        return 'str';
      case "$":
        if (this.get(1) == "{") {
            return 'ref';
        }
        throw "$" + this.get(1) + this.get(2)
      case '/':
        switch (this.get(1)) {
          case '/':
            return 'cmt';
          case '*':
            return 'mlc';
        }
        throw "/"
      default:
        if (this.isWhitespace()) {
          this.at++;
          return this.getToken();
        }
        if (this.isKeyChar()) {
          return 'key';
        }
        throw this.get()
    }
  }

  isDone() {
    return this.at >= this.input.length;
  }

  get(i?: number) {
    return this.input[this.at + (i || 0)];
  }

  isWhitespace(i?: number) {
    return this.get(i).trim() === '';
  }

  isKeyChar(i?: number) {
    const code = this.get(i).charCodeAt();
    //              a             z                A             Z
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90) ||
    //       0             9               _               .               -
    (code >= 48 && code <= 57) || (code == 95) || (code == 46) || (code == 45);
  }
}
