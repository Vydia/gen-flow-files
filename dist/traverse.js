"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._traverse = void 0;

var _traverse2 = _interopRequireDefault(require("@babel/traverse"));

var _visitior = require("./visitior");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _traverse = function _traverse(ast) {
  var skipTransform = false;
  (0, _traverse2["default"])(ast, (0, _visitior.visitor)({
    onChangeSkipTransform: function onChangeSkipTransform(v) {
      return skipTransform = v;
    }
  }));
  return {
    skipTransform: skipTransform
  };
};

exports._traverse = _traverse;