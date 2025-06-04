// SPDX-License-Identifier: GPL-3.0-or-later
// Shard Sequelize model definition
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';

export function defineShardModel(sequelize: Sequelize) {
    class Shard extends Model<InferAttributes<Shard>, InferCreationAttributes<Shard>> {
        declare id: number;
        declare name: string;
        declare description: string;
        declare loginServerIp: string;
        declare loginServerPort: number;
        declare lobbyServerIp: string;
        declare lobbyServerPort: number;
        declare mcotsServerIp: string;
        declare statusId: number;
        declare statusReason: string;
        declare serverGroupName: string;
        declare population: number;
        declare maxPersonasPerUser: number;
        declare diagnosticServerHost: string;
        declare diagnosticServerPort: number;
    }
    Shard.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: DataTypes.STRING,
            loginServerIp: DataTypes.STRING,
            loginServerPort: DataTypes.INTEGER,
            lobbyServerIp: DataTypes.STRING,
            lobbyServerPort: DataTypes.INTEGER,
            mcotsServerIp: DataTypes.STRING,
            statusId: DataTypes.INTEGER,
            statusReason: DataTypes.STRING,
            serverGroupName: DataTypes.STRING,
            population: DataTypes.INTEGER,
            maxPersonasPerUser: DataTypes.INTEGER,
            diagnosticServerHost: DataTypes.STRING,
            diagnosticServerPort: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'Shard',
            tableName: 'shards',
            timestamps: false,
        }
    );
    return Shard;
}
