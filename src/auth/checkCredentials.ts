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

// src/auth/checkCredentials.ts
// Refactored for 12-factor backing service: database is injected, not hardcoded
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import bcrypt from 'bcrypt';

export function defineUserModel(sequelize: Sequelize) {
    class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
        declare username: string;
        declare passwordHash: string;
        declare customerId: string;
    }
    User.init(
        {
            username: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            passwordHash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            customerId: {
                type: DataTypes.STRING,
                allowNull: false, // Now required
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: false,
        }
    );
    return User;
}

// Default: use DB URL from env or fallback to file
const DB_URL = process.env.AUTH_DB_URL || ('sqlite:' + __dirname + '/users.sqlite');
export const sequelize = new Sequelize(DB_URL, { logging: false });
export const User = defineUserModel(sequelize);

async function ensureDbReady() {
    await sequelize.sync();
}

export async function addUser(username: string, password: string, customerId: string, userModel = User): Promise<boolean> {
    if (!username || !password || !customerId) return false;
    await ensureDbReady();
    const existing = await userModel.findByPk(username);
    if (existing) return false;
    const hash = await bcrypt.hash(password, 10);
    await userModel.create({ username: username as any, passwordHash: hash, customerId } as any);
    return true;
}

export async function checkCredentials(username: string, password: string, userModel = User): Promise<boolean> {
    if (!username || !password) return false;
    await ensureDbReady();
    const user = await userModel.findByPk(username);
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
}

export async function getCustomerIdByUsername(username: string, userModel = User): Promise<string | null> {
    await ensureDbReady();
    const user = await userModel.findByPk(username, { attributes: ['customerId'] });
    return user ? user.customerId : null;
}
