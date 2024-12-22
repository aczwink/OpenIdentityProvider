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
import { Injectable } from "acts-util-node";
import { DBConnectionsManager } from "./DBConnectionsManager";

export enum PKI_Type
{
    Special = 0,
    Server = 1,
}

interface PKI_Certificate
{
    name: string;
}

@Injectable
export class PKIController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async DoesSerialExist(serial: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT TRUE FROM pki WHERE serial = ?", serial);
        return row !== undefined;
    }

    public async Query(key: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT value FROM pki WHERE name = ?", key);
        return row?.value as Buffer | undefined;
    }

    public async QueryByType(type: PKI_Type)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<PKI_Certificate>("SELECT name FROM pki WHERE type = ?", type);
        return rows;
    }

    public async Set(key: string, type: PKI_Type, serial: string, value: Buffer)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.UpdateRows("pki", { value }, "name = ?", key);
        if(result.affectedRows === 0)
        {
            await conn.InsertRow("pki", {
                name: key,
                type,
                serial,
                value
            });
        }
    }
}