// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2025 The Oxide Authors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve(__dirname, './admin-cli.ts');

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
