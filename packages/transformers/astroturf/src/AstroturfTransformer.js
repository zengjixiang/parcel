// @flow

import template from '@babel/template';
import semver from 'semver';
import invariant from 'assert';
import {Transformer} from '@parcel/plugin';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import {isIdentifier} from '@babel/types';
import {generate, parse} from '@parcel/babel-ast-utils';

const TEMPLATE_IMPORT = template.statement<
  // $FlowFixMe
  {|NAME: t.Identifier, SOURCE: string|},
  t.ImportDeclaration,
>('import * as NAME from "SOURCE";');

export default (new Transformer({
  canReuseAST({ast}) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async parse({asset, options}) {
    let code = await asset.getCode();
    if (code.includes('astroturf')) {
      return null;
    }
    return parse({
      asset,
      code,
      options,
    });
  },

  async transform({asset}) {
    asset.type = 'js';
    let ast = await asset.getAST();
    if (!ast) {
      return [asset];
    }

    let dirty;

    let cssAssets = [];
    let i = 0;

    traverse(ast.program, {
      TaggedTemplateExpression(path) {
        let {node} = path;
        // This would have to actually check if this was imported as expected
        if (isIdentifier(node.tag, {name: 'css'})) {
          i++;
          let program = path.scope.getProgramParent();

          let name = program.generateUidIdentifier('css');

          let quasis = path.node.quasi.quasis;
          invariant(quasis.length === 1);
          let content = quasis[0].value.raw;

          let uniqueKey = `astroturf${i}`;
          cssAssets.push({
            type: 'css',
            uniqueKey,
            content,
            meta: {cssModule: true},
          });
          asset.addDependency({moduleSpecifier: uniqueKey});

          program.path.unshiftContainer('body', [
            TEMPLATE_IMPORT({
              NAME: name,
              SOURCE: uniqueKey,
            }),
          ]);

          path.replaceWith(name);
          dirty = true;
        }
      },
    });

    if (dirty) {
      asset.setAST(ast);
    }

    return [asset, ...cssAssets];
  },

  generate({asset, ast, options}) {
    return generate({asset, ast, options});
  },
}): Transformer);
