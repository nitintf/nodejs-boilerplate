"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Rule = void 0;
var tslint_1 = require("tslint");
/**
 * Based on: https://github.com/jasonmendes/tslint-no-focused-test
 * TODO: replace this with eslint equivalent once we switch to eslint
 */
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new NoExclusiveTestWalker(sourceFile, this.getOptions()));
    };
    Rule.metadata = {
        ruleName: 'no-exclusive-test',
        description: 'Disallows `fit`, `fdescribe`, `it.only`, `test.only`, `describe.only`, `context.only`.',
        optionsDescription: 'Not configurable.',
        options: null,
        type: 'functionality',
        typescriptOnly: false
    };
    Rule.FAILURE_STRING = 'Exclusive tests are not allowed';
    Rule.MATCH_REGEX = /^(fdescribe|fit|(context|describe|describeIntegrationTest|it|test)\.only)/;
    return Rule;
}(tslint_1.Rules.AbstractRule));
exports.Rule = Rule;
// tslint:disable max-classes-per-file
var NoExclusiveTestWalker = /** @class */ (function (_super) {
    __extends(NoExclusiveTestWalker, _super);
    function NoExclusiveTestWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NoExclusiveTestWalker.prototype.visitCallExpression = function (node) {
        var match = node.getText().match(Rule.MATCH_REGEX);
        if (match && match[0]) {
            this.addFailureAt(node.getStart(), match[0].length, Rule.FAILURE_STRING);
        }
        _super.prototype.visitCallExpression.call(this, node);
    };
    return NoExclusiveTestWalker;
}(tslint_1.RuleWalker));
