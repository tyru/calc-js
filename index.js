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
        $result.value = errors.map(e => e.toString()).join('\n');
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
        this._results.push("fail: " + msg);
      }
    }
    assertEqual(expected, got) {
      if (expected !== got) {
        this._results.push(
          "expected '" + expected.toString() +
          "' but got '" + got.toString() + "'");
      }
    }
  }

  function doTests() {
    let t = new UnitTest();
    [
      ["0", "0"],
      ["1", "1"],
      ["42", "42"],
      ["12+34", "(add 12 34)"],
      ["12-34", "(sub 12 34)"],
      ["12*34", "(mul 12 34)"],
      ["12/34", "(div 12 34)"],
      ["1+2-3+4", "(add 1 (sub 2 (add 3 4)))"],
    ].forEach(([input, expected]) => {
      const node = parse(new Source(input));
      t.assert(node, "node must not be null: " + input);
      if (node) {
        t.assertEqual(expected, node.toString());
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
  // plus = mul (("+" / "-") plus)?
  // mul = number (("*" / "/") mul)?
  // number = ("0" - "9")+
  function parse(source) {
    return parsePlus(source);
  }

  function parsePlus(source) {
    const left = parseMul(source);
    if (source.accept('+')) {
      source.emit();
      return new Node.Add(left, parsePlus(source));
    } else if (source.accept('-')) {
      source.emit();
      return new Node.Sub(left, parsePlus(source));
    } else {
      return left;
    }
  }

  function parseMul(source) {
    const left = parseNumber(source);
    if (source.accept('*')) {
      source.emit();
      return new Node.Mul(left, parseMul(source));
    } else if (source.accept('/')) {
      source.emit();
      return new Node.Div(left, parseMul(source));
    } else {
      return left;
    }
  }

  function parseNumber(source) {
    while (source.accept('0123456789'))
      ;
    const n = parseInt(source.emit(), 10);
    return new Node.Number(n);
  }

  document.getElementById('expression')
    .addEventListener('keyup', (e) => calculate(e.target.value));
})();
