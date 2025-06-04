import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, '../admin-cli.ts');

function runCli(args: string[]): string {
    return execFileSync('ts-node', [CLI_PATH, ...args], { encoding: 'utf8' });
}

describe('CLI guard tests', () => {
    it('prints help with no arguments', () => {
        const output = runCli([]);
        expect(output).toMatch(/Usage: admin-cli\.ts/);
        expect(output).toMatch(/adduser/);
        expect(output).toMatch(/getcustomerid/);
    });

    it('prints help with -h', () => {
        const output = runCli(['-h']);
        expect(output).toMatch(/Usage: admin-cli\.ts/);
    });

    it('prints help with --help', () => {
        const output = runCli(['--help']);
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
        try {
            runCli(['notacommand']);
        } catch (e: any) {
            error = e;
        }
        expect(error).not.toBeNull();
        expect(error.stdout?.toString() || error.message).toMatch(/Usage: admin-cli\.ts/);
    });
});
