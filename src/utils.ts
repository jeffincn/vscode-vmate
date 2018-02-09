'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { fs } from 'mz';
import * as semver from 'semver';

export async function isLegacyNode(cwd) {
  const pkgInfo = require(path.join(cwd, 'package.json'));
  const install = pkgInfo.engines && (pkgInfo.engines['install-alinode'] || pkgInfo.engines['install-node']);
  if (install) {
    return !semver.satisfies('7.6.0', install);
  }
}
