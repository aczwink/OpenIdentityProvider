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

import { APIController, Body, Get, Post, Put, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { ActiveDirectoryService } from "../services/ActiveDirectoryService";
import { ConfigController } from "../data-access/ConfigController";
import { Of } from "acts-util-core";

const configKey = "AD_DomainAdminUserGroup";

interface ActiveDirectoyDomainAdminData
{
    /**
     * @format usergroup-id
     */
    groupId?: number;
}

@APIController("domain")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private activeDirectoryService: ActiveDirectoryService, private configController: ConfigController)
    {
    }

    @Get()
    public async RequestDomainAdminGroup()
    {
        const data = await this.configController.Query(configKey);
        return Of<ActiveDirectoyDomainAdminData>({
            groupId: (data === undefined) ? undefined : parseInt(data)
        });
    }

    @Put()
    public async UpdateDomainAdminGroup(
        @Body data: ActiveDirectoyDomainAdminData
    )
    {
        const current = await this.RequestDomainAdminGroup();

        if((current.groupId !== undefined) && (current.groupId !== data.groupId))
            await this.activeDirectoryService.RemoveGroupFromDomainAdmins(current.groupId);
        if(data.groupId !== undefined)
            await this.activeDirectoryService.AddGroupToDomainAdmins(data.groupId);
        
        if(data.groupId === undefined)
            await this.configController.Delete(configKey);
        else
            await this.configController.Set(configKey, data.groupId);
    }
}