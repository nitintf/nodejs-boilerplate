import { IRuleMetadata, RuleFailure, Rules, RuleWalker } from 'tslint';
import { CallExpression, SourceFile } from 'typescript';

/**
 * Based on: https://github.com/jasonmendes/tslint-no-focused-test
 * TODO: replace this with eslint equivalent once we switch to eslint
 */
export class Rule extends Rules.AbstractRule {
  public static metadata: IRuleMetadata = {
    ruleName: 'no-exclusive-test',
    description:
      'Disallows `fit`, `fdescribe`, `it.only`, `test.only`, `describe.only`, `context.only`.',
    optionsDescription: 'Not configurable.',
    options: null,
    type: 'functionality',
    typescriptOnly: false,
  };

  public static FAILURE_STRING = 'Exclusive tests are not allowed';
  public static MATCH_REGEX =
    /^(fdescribe|fit|(context|describe|describeIntegrationTest|it|test)\.only)/;

  public apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(new NoExclusiveTestWalker(sourceFile, this.getOptions()));
  }
}

// tslint:disable max-classes-per-file
class NoExclusiveTestWalker extends RuleWalker {
  public visitCallExpression(node: CallExpression) {
    const match = node.getText().match(Rule.MATCH_REGEX);

    if (match && match[0]) {
      this.addFailureAt(node.getStart(), match[0].length, Rule.FAILURE_STRING);
    }

    super.visitCallExpression(node);
  }
}
