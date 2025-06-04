import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../admin-cli.ts');

function runCli(args: string[]): string {
    return execFileSync('ts-node', [CLI_PATH, ...args], { encoding: 'utf8' });
}

describe('CLI guard tests', () => {
    it('prints help with no arguments', () => {
        let output = '';
        try {
            output = runCli([]);
        } catch (e: any) {
            output = e.stdout?.toString() || e.message;
        }
        expect(output).toMatch(/Usage: admin-cli\.ts/);
        expect(output).toMatch(/adduser/);
        expect(output).toMatch(/getcustomerid/);
    });

    it('prints help with -h', () => {
        let output = '';
        try {
            output = runCli(['-h']);
        } catch (e: any) {
            output = e.stdout?.toString() || e.message;
        }
        expect(output).toMatch(/Usage: admin-cli\.ts/);
    });

    it('prints help with --help', () => {
        let output = '';
        try {
            output = runCli(['--help']);
        } catch (e: any) {
            output = e.stdout?.toString() || e.message;
        }
        expect(output).toMatch(/Usage: admin-cli\.ts/);
    });

    it('prints command-specific help for adduser', () => {
        const output = runCli(['adduser', '-h']);
        expect(output).toMatch(/Usage: admin-cli\.ts adduser/);
    });

    it('prints command-specific help for getcustomerid', () => {
        const output = runCli(['getcustomerid', '-h']);
        expect(output).toMatch(/Usage: admin-cli\.ts getcustomerid/);
    });

    it('fails gracefully on unknown command', () => {
        let error = null;
        let output = '';
        let stderr = '';
        try {
            runCli(['notacommand']);
        } catch (e: any) {
            error = e;
            output = e.stdout?.toString() || '';
            stderr = e.stderr?.toString() || '';
        }
        expect(error).not.toBeNull();
        expect(output + stderr).toMatch(/Usage: admin-cli\.ts/);
        expect(output + stderr).toMatch(/unknown command 'notacommand'/);
    });
});
