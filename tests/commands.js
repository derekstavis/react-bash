import chai from 'chai';
import { stateFactory } from './factories';
import Bash from '../src/bash';
import * as BaseCommands from '../src/commands';
import { Errors } from '../src/const';

describe('bash commands', () => {
    let bash;

    beforeEach(() => {
        bash = new Bash();
    });

    describe('help', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.help.exec);
        });

        it('should handle no args', () => {
            const state = stateFactory();
            // comments + commands - help
            const expected = 2 + Object.keys(BaseCommands).length - 1;
            const { history } = bash.commands.help.exec(state, {});
            chai.assert.strictEqual(history.length, expected);
        });

    });

    describe('clear', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.clear.exec);
        });

        it('should clear out the history', () => {
            const state = stateFactory({ history: [1, 2] });
            const { history } = bash.commands.clear.exec(state, {});
            chai.assert.strictEqual(history.length, 0);
        });

    });

    describe('ls', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.ls.exec);
        });

        it('should handle no args', () => {
            const state = stateFactory();
            const expected = Object.keys(state.structure)
                .filter(name => name[0] !== '.')
                .join(' ');
            const { history } = bash.commands.ls.exec(state, {});
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should handle --all arg', () => {
            const state = stateFactory();
            const expected = Object.keys(state.structure).join(' ');
            const { history } = bash.commands.ls.exec(state, { all: true });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should handle a valid path arg', () => {
            const state = stateFactory();
            const expected = Object.keys(state.structure.dir1).join(' ');
            const { history } = bash.commands.ls.exec(state, { 0: 'dir1' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should handle a non existent path', () => {
            const state = stateFactory();
            const expected = Errors.NO_SUCH_FILE.replace('$1', 'doesNotExist');
            const { history } = bash.commands.ls.exec(state, { 0: 'doesNotExist' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should handle path to file', () => {
            const state = stateFactory();
            const expected = Errors.NOT_A_DIRECTORY.replace('$1', 'file1');
            const { history } = bash.commands.ls.exec(state, { 0: 'file1' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

    });

    describe('cat', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.cat.exec);
        });

        it('should display file contents', () => {
            const state = stateFactory();
            const expected = state.structure.file1.content;
            const { history } = bash.commands.cat.exec(state, { 0: 'file1' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should display file contents from path', () => {
            const state = stateFactory();
            const expected = state.structure.dir1.dir1File.content;
            const { history } = bash.commands.cat.exec(state, { 0: 'dir1/dir1File' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should not work for directories', () => {
            const state = stateFactory();
            const expected = Errors.IS_A_DIRECTORY.replace('$1', 'dir1');
            const { history } = bash.commands.cat.exec(state, { 0: 'dir1' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should not work for invalid paths', () => {
            const state = stateFactory();
            const expected = Errors.NO_SUCH_FILE.replace('$1', 'doesNotExist');
            const { history } = bash.commands.cat.exec(state, { 0: 'doesNotExist' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should not work for nested invalid paths', () => {
            const state = stateFactory();
            const expected = Errors.NO_SUCH_FILE.replace('$1', 'dir1/doesNotExist');
            const { history } = bash.commands.cat.exec(state, { 0: 'dir1/doesNotExist' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should not work for directory paths', () => {
            const state = stateFactory();
            const expected = Errors.IS_A_DIRECTORY.replace('$1', 'dir1/childDir');
            const { history } = bash.commands.cat.exec(state, { 0: 'dir1/childDir' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

    });

    describe('mkdir', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.mkdir.exec);
        });

        it('should create a new directory', () => {
            const state = stateFactory();
            chai.assert.isUndefined(state.structure.testDir);
            const { structure } = bash.commands.mkdir.exec(state, { 0: 'testDir' });
            chai.assert.isDefined(structure.testDir);
        });

        it('should create a new directory at path', () => {
            const state = stateFactory();
            chai.assert.isUndefined(state.structure.dir1.testDir);
            const { structure } = bash.commands.mkdir.exec(state, { 0: 'dir1/testDir' });
            chai.assert.isDefined(structure.dir1.testDir);
        });

        it('should not create a directory if it already exists', () => {
            const state = stateFactory();
            const expected = Errors.FILE_EXISTS.replace('$1', 'dir1');
            chai.assert.isDefined(state.structure.dir1);
            const { history } = bash.commands.mkdir.exec(state, { 0: 'dir1' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

        it('should not create a directory from path if it already exists', () => {
            const state = stateFactory();
            const expected = Errors.FILE_EXISTS.replace('$1', 'dir1/childDir');
            chai.assert.isDefined(state.structure.dir1);
            const { history } = bash.commands.mkdir.exec(state, { 0: 'dir1/childDir' });
            chai.assert.strictEqual(history.length, 1);
            chai.assert.strictEqual(history[0].value, expected);
        });

    });

    describe('cd', () => {

        it('should exist', () => {
            chai.assert.isFunction(bash.commands.cd.exec);
        });

        it('should work with no args', () => {
            const state = stateFactory();
            state.cwd = 'dir1';
            const { cwd } = bash.commands.cd.exec(state, {});
            chai.assert.strictEqual(cwd, '');
        });

        it('should work with path', () => {
            const state = stateFactory();
            const { cwd } = bash.commands.cd.exec(state, { 0: 'dir1/childDir' });
            chai.assert.strictEqual(cwd, 'dir1/childDir');
        });

        it('should work with ..', () => {
            const state = stateFactory();
            state.cwd = 'dir1/childDir';
            const { cwd } = bash.commands.cd.exec(state, { 0: '..' });
            chai.assert.strictEqual(cwd, 'dir1');
        });

        it('should work with multiple ..', () => {
            const state = stateFactory();
            state.cwd = 'dir1/childDir';
            const { cwd } = bash.commands.cd.exec(state, { 0: '../../' });
            chai.assert.strictEqual(cwd, '');
        });

        it('should work with back and forth', () => {
            const state = stateFactory();
            state.cwd = 'dir1/childDir';
            const { cwd } = bash.commands.cd.exec(state, { 0: '../childDir' });
            chai.assert.strictEqual(cwd, 'dir1/childDir');
        });

    });

    describe('cd', () => {
        it('should exist', () => {
            chai.assert.isFunction(bash.commands.pwd.exec);
        });

        it('should print out cwd', () => {
            const state = stateFactory();
            const expected = '/dir1/childDir';
            state.cwd = 'dir1/childDir';
            const { history } = bash.commands.pwd.exec(state);
            chai.assert.strictEqual(history[history.length - 1].value, expected);
        });

        it('should print out "/" for empty path', () => {
            const state = stateFactory();
            const expected = '/';
            state.cwd = '';
            const { history } = bash.commands.pwd.exec(state);
            chai.assert.strictEqual(history[history.length - 1].value, expected);
        });
    });

});
