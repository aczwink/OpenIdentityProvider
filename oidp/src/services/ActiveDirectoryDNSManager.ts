/**
 * OpenIdentityProvider
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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
import { DNSController, DNSRecord, DNSZone } from "../data-access/DNSController";
import { ActiveDirectoryService } from "./ActiveDirectoryService";

@Injectable
export class ActiveDirectoryDNSManager
{
    constructor(private dnsController: DNSController, private activeDirectoryService: ActiveDirectoryService)
    {
    }

    //Public methods
    public async SynchronizeZone(zoneId: number)
    {
        const zone = await this.dnsController.QueryZone(zoneId);
        if(zone === undefined)
            return;

        const adZone = await this.activeDirectoryService.QueryDNSZone(zone.name);
        if(adZone === undefined)
            await this.activeDirectoryService.CreateDNSZone(zone.name);

        await this.SyncRecords(zone);
    }

    //Private methods
    private AreDNSValuesEqual(record: DNSRecord, value: string)
    {
        switch(record.recordType)
        {
            case "CNAME":
                return (record.value + ".") === value;
        }
        return record.value === value;
    }

    private async SyncRecord(zone: DNSZone, record: DNSRecord)
    {
        const value = await this.activeDirectoryService.QueryDNSRecordValue(zone.name, record.label, record.recordType);
        if(value === undefined)
            await this.activeDirectoryService.CreateDNSRecord(zone.name, record);
        else if(!this.AreDNSValuesEqual(record, value))
        {
            await this.activeDirectoryService.DeleteDNSRecord(zone, record);
            await this.activeDirectoryService.CreateDNSRecord(zone.name, record);
        }
    }

    private async SyncRecords(zone: DNSZone)
    {
        const records = await this.dnsController.QueryRecordsOfZone(zone.id);
        for (const record of records)
            await this.SyncRecord(zone, record);
    }
}