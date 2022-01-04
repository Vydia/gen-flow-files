"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _helperPluginUtils = require("@babel/helper-plugin-utils");

var _pluginSyntaxFlow = _interopRequireDefault(require("@babel/plugin-syntax-flow"));

var _visitior = require("./visitior");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = (0, _helperPluginUtils.declare)(function (api) {
  api.assertVersion(7);
  return {
    name: "transform-flow-extract-definitions",
    inherits: _pluginSyntaxFlow["default"],
    visitor: (0, _visitior.visitor)()
  };
});

exports["default"] = _default;