// src/auth/checkCredentials.ts

import { Sequelize, DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * Initialize Sequelize with file-based SQLite for persistence
 */
const sequelize = new Sequelize('sqlite:' + __dirname + '/users.sqlite', { logging: false });

class User extends Model {
    declare username: string;
    declare passwordHash: string;
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
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
    }
);

// Ensure the table is created before any operation
async function ensureDbReady() {
    await sequelize.sync();
}

export async function addUser(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    await ensureDbReady();
    const existing = await User.findByPk(username);
    if (existing) return false;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash: hash });
    return true;
}

/**
 * Checks if the provided username and password are valid.
 * @param username The username to check
 * @param password The password to check
 * @returns true if valid, false otherwise
 */
export async function checkCredentials(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    await ensureDbReady();
    const user = await User.findByPk(username);
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
}
