# typings-resolver

---

A lib to recursively resolve all typings files of a package. Works both in browser and in node environment.

[demo](https://codesandbox.io/s/affectionate-snow-4x6q0v)

## Install

```bash
npm i typings-resolver
```

## Usage

### await resolve done

```ts
import { Resolver } from "typings-resolver";

const resolver = new Resolver();
await resolver.addPackage({ name: "react" });
const files = resolver.getFiles();
console.log("files", files);
```

### use EventEmitter

```ts
import { Resolver } from "typings-resolver";

const resolver = new Resolver();
resolver.emitter.on("add", console.log);
resolver.emitter.on("done", () => {
  const files = resolver.getFiles();
  console.log("files", files);
});
resolver.addPackage({ name: "react" });
```
