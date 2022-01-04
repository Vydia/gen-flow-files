"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _glob = _interopRequireDefault(require("glob"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _parser = require("@babel/parser");

var _traverse = require("./traverse");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var _default = function _default(options) {
  var inputDirOrFile = options.inputDir,
      outputDirOrFile = options.outputDir;

  var inputIsDir = _fs["default"].statSync(inputDirOrFile).isDirectory();

  var outputIsDir = !outputDirOrFile.match(/.+\.flow$/); // Check if there's a .flow file extension E.g. .js.flow

  var inputDir = inputIsDir ? inputDirOrFile : _path["default"].dirname(inputDirOrFile);
  (0, _glob["default"])(inputIsDir ? "**/*.js" : inputDirOrFile, inputIsDir ? {
    cwd: _path["default"].resolve(process.cwd(), inputDir)
  } : undefined, function (er, files) {
    var _iterator = _createForOfIteratorHelper(files),
        _step;

    try {
      var _loop = function _loop() {
        var file = _step.value;

        _fs["default"].readFile(inputIsDir ? _path["default"].resolve(inputDir, file) : inputDirOrFile, "utf8", function (err, code) {
          if (err) throw err;
          var ast = (0, _parser.parse)(code, {
            sourceType: "module",
            plugins: [// enable common plugins
            "flow", "jsx", "asyncFunctions", "asyncGenerators", "classConstructorCall", "classProperties", "decorators-legacy", "doExpressions", "exponentiationOperator", "exportExtensions", "functionBind", "functionSent", "objectRestSpread", "trailingFunctionCommas", "dynamicImport", "numericSeparator", "optionalChaining", "importMeta", "classPrivateProperties", "bigInt", "optionalCatchBinding", "partialApplication", "throwExpressions"]
          });
          var result = (0, _traverse._traverse)(ast);

          if (result && !result.skipTransform) {
            var output = (0, _generator["default"])(ast, {
              /* options */
            }, code);
            var outputFile = outputIsDir ? _path["default"].resolve(outputDirOrFile, file + ".flow") : outputDirOrFile;

            var outputFileDir = _path["default"].dirname(outputFile);

            var createFile = function createFile() {
              _fs["default"].writeFile(outputFile, output.code, "utf8", function (err) {
                if (err) throw err;
              });
            };

            if (outputIsDir && !_fs["default"].existsSync(outputFileDir)) {
              (0, _mkdirp["default"])(outputFileDir, function (err) {
                if (err) throw err;
                createFile();
              });
            } else {
              createFile();
            }
          }
        });
      };

      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  });
};

exports["default"] = _default;