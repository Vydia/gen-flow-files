"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visitor = void 0;

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var t = require("@babel/types");

var FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;
var emptyIdentifier = {
  type: "Identifier",
  name: ""
};

var transformFunctionExpressionParam = function transformFunctionExpressionParam(param, id) {
  if (t.isAssignmentPattern(param)) {
    return transformFunctionExpressionParam(param.left, id);
  }

  var functionTypeParam = t.functionTypeParam(t.identifier(t.isObjectPattern(param) ? "arg" + id : param.name), param.typeAnnotation && param.typeAnnotation.typeAnnotation || t.anyTypeAnnotation());
  functionTypeParam.optional = param.optional;
  return functionTypeParam;
};

var transformToFunctionTypeAnnotation = function transformToFunctionTypeAnnotation(functionDeclaration) {
  var functionTypeAnnotation = t.functionTypeAnnotation(functionDeclaration.typeParameters, functionDeclaration.params.filter(function (param) {
    return !t.isRestElement(param);
  }).map(function (param, id) {
    return transformFunctionExpressionParam(param, id);
  }), null, functionDeclaration.returnType && functionDeclaration.returnType.typeAnnotation || t.anyTypeAnnotation());

  if (functionDeclaration.params.length >= 1 && t.isRestElement(functionDeclaration.params[functionDeclaration.params.length - 1])) {
    var restElement = functionDeclaration.params[functionDeclaration.params.length - 1];
    functionTypeAnnotation.rest = t.functionTypeParam(t.identifier(restElement.argument.name), restElement.typeAnnotation && restElement.typeAnnotation.typeAnnotation || t.anyTypeAnnotation());
  }

  return functionTypeAnnotation;
};

var isExportDeclaration = function isExportDeclaration(path) {
  return t.isExportDefaultDeclaration(path) || t.isExportNamedDeclaration(path);
};

var transformToDeclareExportDeclaration = function transformToDeclareExportDeclaration(path, declaration) {
  var declareExportDeclaration = t.declareExportDeclaration(declaration);
  declareExportDeclaration["default"] = t.isExportDefaultDeclaration(path);
  return declareExportDeclaration;
};

var transformToIdentifierString = function transformToIdentifierString(memberExpression) {
  if (t.isIdentifier(memberExpression)) {
    return memberExpression.name;
  }

  return "".concat(transformToIdentifierString(memberExpression.object), ".").concat(transformToIdentifierString(memberExpression.property));
};

var visitor = function visitor(options) {
  var skipTransform = false;

  var changeSkipTransform = function changeSkipTransform(newValue) {
    skipTransform = newValue;

    if (options && options.onChangeSkipTransform) {
      options.onChangeSkipTransform(skipTransform);
    }
  };

  return {
    Program: function Program(path) {
      changeSkipTransform(false);
      var directiveFound = false;
      var comments = path.container.comments;

      if (comments) {
        var _iterator = _createForOfIteratorHelper(comments),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var comment = _step.value;

            if (FLOW_DIRECTIVE.test(comment.value)) {
              directiveFound = true;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      if (!directiveFound) {
        changeSkipTransform(true);
      }
    },
    FunctionDeclaration: function FunctionDeclaration(path) {
      if (skipTransform) return;
      var declareFunction = t.declareFunction(path.node.id || emptyIdentifier);
      var functionTypeAnnotation = transformToFunctionTypeAnnotation(path.node);
      declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);

      if (isExportDeclaration(path.parentPath)) {
        var declareExportDeclaration = transformToDeclareExportDeclaration(path.parentPath, declareFunction);
        path.parentPath.replaceWith(declareExportDeclaration);
      }

      path.replaceWith(declareFunction);
    },
    ClassDeclaration: function ClassDeclaration(path) {
      if (skipTransform) return;
      var body = path.node.body.body;
      var properties = body.map(function (bodyMember) {
        if (t.isClassMethod(bodyMember)) {
          var functionTypeAnnotation = transformToFunctionTypeAnnotation(bodyMember);
          var objectTypeProperty = t.objectTypeProperty(bodyMember.key, functionTypeAnnotation);
          objectTypeProperty.method = true;
          objectTypeProperty["static"] = bodyMember["static"];
          return objectTypeProperty;
        }

        if (t.isClassProperty(bodyMember)) {
          var _objectTypeProperty = t.objectTypeProperty(bodyMember.key, bodyMember.typeAnnotation && bodyMember.typeAnnotation.typeAnnotation || t.anyTypeAnnotation());

          _objectTypeProperty.method = false;
          _objectTypeProperty["static"] = bodyMember["static"];
          return _objectTypeProperty;
        }
      }).filter(function (member) {
        return !!member;
      });
      var objectTypeAnnotation = t.objectTypeAnnotation(properties);
      var declareClass = t.declareClass(path.node.id || emptyIdentifier, path.node.typeParameters, [], objectTypeAnnotation);

      if (path.node.superClass) {
        declareClass["extends"] = [t.interfaceExtends(t.isIdentifier(path.node.superClass) ? path.node.superClass : t.identifier(transformToIdentifierString(path.node.superClass)), path.node.superTypeParameters && t.typeParameterInstantiation(path.node.superTypeParameters.params) || undefined)];
      }

      if (path.node["implements"]) {
        declareClass["implements"] = path.node["implements"];
      }

      if (isExportDeclaration(path.parentPath)) {
        var declareExportDeclaration = transformToDeclareExportDeclaration(path.parentPath, declareClass);
        path.parentPath.replaceWith(declareExportDeclaration);
      }

      path.replaceWith(declareClass);
    },
    ArrowFunctionExpression: function ArrowFunctionExpression(path) {
      if (skipTransform) return;

      if (!path.parentPath || !path.parentPath.parentPath || !t.isVariableDeclarator(path.parentPath) || !t.isVariableDeclaration(path.parentPath.parentPath)) {
        return;
      }

      var variableDeclarator = path.parentPath;
      var variableDeclaration = path.parentPath.parentPath;
      var declareVariable = t.declareVariable(t.identifier(variableDeclarator.node.id.name));
      declareVariable.id.typeAnnotation = t.typeAnnotation(transformToFunctionTypeAnnotation(path.node));

      if (isExportDeclaration(variableDeclaration.parentPath)) {
        var declareExportDeclaration = transformToDeclareExportDeclaration(variableDeclaration.parentPath, declareVariable);
        variableDeclaration.parentPath.replaceWith(declareExportDeclaration);
      }

      variableDeclaration.replaceWith(declareVariable);
    }
  };
};

exports.visitor = visitor;