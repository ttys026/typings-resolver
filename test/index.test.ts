import { jest } from '@jest/globals';
import { Resolver } from '..';
import fs from 'fs-extra';
import { dirname } from 'path';

jest.setTimeout(60000);

describe('resolve', () => {
  it('getFiles', async () => {
    const resolver = new Resolver();
    const onAddFile = jest.fn();
    const onDoneResolve = jest.fn();
    resolver.emitter.on('add', onAddFile);
    resolver.emitter.on('done', onDoneResolve);
    await resolver.addPackage({ name: 'events' });
    const files = resolver.getFiles();

    expect(onAddFile).toHaveBeenCalledTimes(Object.keys(files).length);
    expect(onDoneResolve).toHaveBeenCalledTimes(1);
    expect(onDoneResolve).toHaveBeenCalledWith({ name: 'events' });
    expect(files).toMatchSnapshot();

    Object.entries(files).forEach(([file, content]) => {
      fs.mkdirpSync(`./tmp/${dirname(file)}`);
      fs.writeFileSync(`./tmp/${file}`, content);
    });
  })
})