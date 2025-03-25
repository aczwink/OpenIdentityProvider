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

import { APIController, Body, BodyProp, Delete, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { ActiveDirectoryService } from "../services/ActiveDirectoryService";
import { DNSController, DNSRecord } from "../data-access/DNSController";

@APIController("dns")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private dnsController: DNSController, private activeDirectoryService: ActiveDirectoryService)
    {
    }

    @Post()
    public async CreateZone(
        @BodyProp name: string
    )
    {
        await this.dnsController.CreateZone(name);
        await this.activeDirectoryService.CreateDNSZone(name);
    }

    @Get()
    public async RequestZones()
    {
        return await this.dnsController.QueryZones();
    }
}

@APIController("dns/{zoneId}")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api2_
{
    constructor(private dnsController: DNSController, private activeDirectoryService: ActiveDirectoryService)
    {
    }

    @Delete()
    public async DeleteZone(
        @Path zoneId: number
    )
    {
        const zone = await this.dnsController.QueryZone(zoneId);
        if(zone === undefined)
            return NotFound("zone not found");

        await this.activeDirectoryService.DeleteDNSZone(zone.name);
        await this.dnsController.DeleteZone(zoneId);
    }

    @Post()
    public async CreateRecord(
        @Path zoneId: number,
        @Body record: DNSRecord
    )
    {
        const zone = await this.dnsController.QueryZone(zoneId);
        if(zone === undefined)
            return NotFound("zone not found");

        await this.dnsController.CreateRecord(zoneId, record);
        await this.activeDirectoryService.CreateDNSRecord(zone.name, record);
    }

    @Delete("{label}")
    public async DeleteRecord(
        @Path zoneId: number,
        @Path label: string
    )
    {
        const zone = await this.dnsController.QueryZone(zoneId);
        if(zone === undefined)
            return NotFound("zone not found");

        const record = await this.dnsController.QueryRecord(zoneId, label);
        if(record === undefined)
            return NotFound("record not found");

        await this.activeDirectoryService.DeleteDNSRecord(zone, record);
        await this.dnsController.DeleteRecord(zoneId, label);
    }

    @Get()
    public async RequestRecords(
        @Path zoneId: number
    )
    {
        return await this.dnsController.QueryRecordsOfZone(zoneId);
    }
}