(function () {
  'use strict';

  const Node = {
    Number: class Number {
      constructor(value) {
        this._value = value;
      }
      toString() {
        return this._value.toString();
      }
    },
    Group: class Group {
      constructor(node) {
        this._node = node;
      }
      toString() {
        return "(group " + this._node.toString() + ")";
      }
    },
    Add: class Add {
      constructor(left, right) {
        this._left = left;
        this._right = right;
      }
      toString() {
        return "(add " + this._left.toString() + " " + this._right.toString() + ")";
      }
    },
    Sub: class Sub {
      constructor(left, right) {
        this._left = left;
        this._right = right;
      }
      toString() {
        return "(sub " + this._left.toString() + " " + this._right.toString() + ")";
      }
    },
    Mul: class Mul {
      constructor(left, right) {
        this._left = left;
        this._right = right;
      }
      toString() {
        return "(mul " + this._left.toString() + " " + this._right.toString() + ")";
      }
    },
    Div: class Div {
      constructor(left, right) {
        this._left = left;
        this._right = right;
      }
      toString() {
        return "(div " + this._left.toString() + " " + this._right.toString() + ")";
      }
    },
  };

  class Source {
    constructor(source) {
      this._prev = 0;
      this._pos = 0;
      this._chars = [...source];
    }
    peek() {
      if (this._pos >= this._chars.length) {
        return '(EOF)';
      }
      return this._chars[this._pos];
    }
    accept(charset) {
      if (this._pos >= this._chars.length) {
        return false;    // eof
      }
      const c = this._chars[this._pos];
      if (charset.indexOf(c) != -1) {
        this._pos++;
        return true;
      }
      return false;
    }
    emit() {
      if (this._prev === this._pos) {
        throw new Error("no character(s) were accepted");
      }
      let str = this._chars.slice(this._prev, this._pos).join('');
      this._prev = this._pos;
      return str;
    }
  }

  function runTests(expr) {
    const $result = document.getElementById('test-result');
    $result.value = '';
    $result.classList.remove('error');
    try {
      const errors = doTests();
      if (errors.length > 0) {
        $result.value = errors.map(e => "* " + e.toString()).join('\n');
        $result.classList.add('error');
      } else {
        $result.value = '👍';
      }
    } catch (e) {
      $result.value = e.stack || e.toString();
      $result.classList.add('error');
    }
  }

  class UnitTest {
    constructor() {
      this._results = [];
    }
    results() {
      return this._results;
    }
    assert(cond, msg) {
      if (!cond) {
        this._results.push("FAIL: " + msg);
      }
    }
    assertEqual(expected, got, msg) {
      if (expected !== got) {
        this._results.push(
          "FAIL:\n" +
          "expected: " + expected.toString() +
          "\ngot: " + got.toString() + msg);
      }
    }
  }

  function doTests() {
    let t = new UnitTest();
    [
      ["0", "0"],
      ["1", "1"],
      ["42", "42"],
      ["(0)", "(group 0)"],
      ["(1)", "(group 1)"],
      ["(42)", "(group 42)"],
      ["12+34", "(add 12 34)"],
      ["12-34", "(sub 12 34)"],
      ["12*34", "(mul 12 34)"],
      ["8/2", "(div 8 2)"],
      ["1+2-3+4", "(add (sub (add 1 2) 3) 4)"],
      ["1+2*3", "(add 1 (mul 2 3))"],
      ["(1+2)*3", "(mul (group (add 1 2)) 3)"],
      ["(1+2)-3+4", "(add (sub (group (add 1 2)) 3) 4)"],
      ["(1*6)/3*4", "(mul (div (group (mul 1 6)) 3) 4)"],
      ["1+(2-3)+4", "(add (add 1 (group (sub 2 3))) 4)"],
      ["1*(6/3)*4", "(mul (mul 1 (group (div 6 3))) 4)"],
      ["1+2-(3+4)", "(sub (add 1 2) (group (add 3 4)))"],
      ["3*4/(1*2)", "(div (mul 3 4) (group (mul 1 2)))"],
      }
    });
    return t.results();
  }

  function calculate(expr) {
    const $result = document.getElementById('result');
    const $error = document.getElementById('error');
    $result.value = '';
    $error.value = '';
    try {
      const node = parse(new Source(expr));
      if (node) {
        $result.value = node.toString();
      }
    } catch (e) {
      $error.value = e.stack || e.toString();
    }
  }

  // expr = plus
  // plus = mul (("+" / "-") mul)*
  // mul = number_or_expr (("*" / "/") number_or_expr)?
  // number_or_expr =  "(" expr ")" / ("0" - "9")+
  function parse(source) {
    return parsePlus(source);
  }

  function parsePlus(source) {
    let node = parseMul(source);
    while (true) {
      if (source.accept('+')) {
        source.emit();
        node = new Node.Add(node, parseMul(source));
      } else if (source.accept('-')) {
        source.emit();
        node = new Node.Sub(node, parseMul(source));
      } else {
        break;
      }
    }
    return node;
  }

  function parseMul(source) {
    let node = parseNumberOrExpr(source);
    while (true) {
      if (source.accept('*')) {
        source.emit();
        node = new Node.Mul(node, parseNumberOrExpr(source));
      } else if (source.accept('/')) {
        source.emit();
        node = new Node.Div(node, parseNumberOrExpr(source));
      } else {
        break;
      }
    }
    return node;
  }

  function parseNumberOrExpr(source) {
    if (source.accept('(')) {
      source.emit();
      const expr = parse(source);
      if (!source.accept(')')) {
        throw new Error("expected ')' but got '" + source.peek() + "'");
      }
      source.emit();
      return new Node.Group(expr);
    }
    return parseNumber(source);
  }

  function parseNumber(source) {
    while (source.accept('0123456789'))
      ;
    const n = parseInt(source.emit(), 10);
    return new Node.Number(n);
  }

  document.getElementById('expression')
    .addEventListener('keyup', (e) => calculate(e.target.value));
  document.getElementById('run-tests')
    .addEventListener('click', () => runTests());
})();
