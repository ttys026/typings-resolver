export const formatPackageName = (packageName: string) => {
  const [scope, name, ...rest] = packageName.split('/');
  const pkgName = packageName.startsWith('@') ? `${scope}/${name}` : scope;
  return [pkgName, [name, ...rest].join('/')]
}

export const getTypePackageName = (name: string) => {
  return `@types/${name.startsWith('@') ? name.slice(1).replace(/\//, '__') : name
    }`;
};

export const getOriginalPackageName = (name: string) => {
  if (!name.startsWith('@types/')) {
    return name;
  }
  const originalName = name.slice(7);
  return originalName.includes('__') ? `@${originalName.replace(/__/g, '/')}` : originalName;
};