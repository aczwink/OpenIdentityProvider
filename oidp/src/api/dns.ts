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

import { APIController, Body, Delete, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
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
    public async CreateRecord(
        @Body record: DNSRecord
    )
    {
        await this.dnsController.Create(record);
        await this.activeDirectoryService.CreateDNSRecord(record);
    }

    @Delete("{label}")
    public async DeleteRecord(
        @Path label: string
    )
    {
        const record = await this.dnsController.Query(label);
        if(record === undefined)
            return NotFound("record not found");

        await this.activeDirectoryService.DeleteDNSRecord(record);
        await this.dnsController.Delete(label);
    }

    @Get()
    public async RequestRecords()
    {
        return await this.dnsController.QueryAll();
    }
}