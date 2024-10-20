/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */
import { DBConnectionPool, DBFactory, DBResource, Injectable } from "acts-util-node";
import { CONFIG_DB } from "../config";

@Injectable
export class DBConnectionsManager
{
    constructor()
    {
        this.pool = null;
    }

    //Public methods
    public Close()
    {
        if(this.pool === null)
            return;
        this.pool.Close();
        this.pool = null;
    }

    public async CollectConnectionInfo()
    {
        return {
            host: CONFIG_DB.host,
            user: CONFIG_DB.user,
            password: CONFIG_DB.password,
            dbName: "openidentityprovider"
        };
    }

    public async CreateAnyConnectionQueryExecutor()
    {
        const instance = await this.GetPoolInstance();
        return instance.value.CreateAnyConnectionQueryExecutor();
    }

    //Private variables
    private pool: DBResource<DBConnectionPool> | null;

    //Private methods
    private async GetPoolInstance()
    {
        if(this.pool === null)
        {
            const info = await this.CollectConnectionInfo();
            const factory = new DBFactory;

            this.pool = await factory.CreateConnectionPool({
                type: "mysql",
                host: info.host,
                username: info.user,
                password: info.password,
                defaultDatabase: info.dbName
            });
        }
        return this.pool;
    }
}