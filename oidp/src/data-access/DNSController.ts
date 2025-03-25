/**
 * OpenIdentityProvider
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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

export type DNSRecordType = "A" | "CNAME";

export interface DNSRecord
{
    label: string;
    recordType: DNSRecordType;
    value: string;
}

export interface DNSZone
{
    id: number;
    name: string;
}

@Injectable
export class DNSController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async CreateRecord(zoneId: number, record: DNSRecord)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.InsertRow("dnsrecords", {
            zoneId,
            ...record
        });
    }

    public async CreateZone(name: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.InsertRow("dnszones", { name });
    }

    public async DeleteRecord(zoneId: number, label: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("dnsrecords", "zoneId = ? AND label = ?", zoneId, label);
    }

    public async DeleteZone(zoneId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("dnszones", "id = ?", zoneId);
    }

    public async QueryRecord(zoneId: number, label: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne<DNSRecord>("SELECT * FROM dnsrecords WHERE zoneId = ? AND label = ?", zoneId, label);
        return row;
    }

    public async QueryRecordsOfZone(zoneId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<DNSRecord>("SELECT * FROM dnsrecords WHERE zoneId = ?", zoneId);
        return rows;
    }

    public async QueryZone(zoneId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne<DNSZone>("SELECT * FROM dnszones WHERE id = ?", zoneId);
        return row;
    }

    public async QueryZones()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<DNSZone>("SELECT * FROM dnszones");
        return rows;
    }
}