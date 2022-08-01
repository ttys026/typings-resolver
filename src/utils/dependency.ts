import ts from 'typescript';

const formatImportPath = (text: string) => {
  const [, specifier] = text.match(/["'](.*)['"]/) || [];
  return specifier || '';
}

export const getImports = (content: string) => {
  const sourceFile = ts.createSourceFile("file.d.ts", content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const imports: string[] = [];

  const traverse = (node: ts.Node) => {
    ts.forEachChild(node, ele => {
      if (ts.isImportDeclaration(ele)) {
        const imp = formatImportPath(ele.moduleSpecifier.getText());
        imports.push(imp);
      }
      if (ts.isImportTypeNode(ele)) {
        const imp = formatImportPath(ele.argument.getText());
        imports.push(imp);
      }
      if (ts.isImportEqualsDeclaration(ele) && ts.isExternalModuleReference(ele.moduleReference)) {
        const imp = formatImportPath(ele.moduleReference.expression.getText());
        imports.push(imp);
      }
      if (ts.isExportDeclaration(ele) && ele.moduleSpecifier) {
        const imp = formatImportPath(ele.moduleSpecifier.getText());
        imports.push(imp);
      }
      ts.forEachChild(ele, traverse);
    })
  }

  traverse(sourceFile);

  (sourceFile.referencedFiles || []).forEach(ele => {
    imports.push(ele.fileName);
  })

  return [...new Set(imports)];
}