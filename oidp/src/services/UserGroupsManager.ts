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
import { GroupsController, UserGroupProperties } from "../data-access/GroupsController";
import { ActiveDirectoryIntegrationService } from "./ActiveDirectoryIntegrationService";

@Injectable
export class UserGroupsManager
{
    constructor(private groupsController: GroupsController, private activeDirectoryIntegrationService: ActiveDirectoryIntegrationService)
    {
    }
    
    //Public methods
    public async AddMember(userGroupId: number, userId: number)
    {
        await this.activeDirectoryIntegrationService.AddMemberToGroup(userGroupId, userId);
        await this.groupsController.AddMember(userGroupId, userId);
    }

    public async Create(props: UserGroupProperties)
    {
        const error = await this.activeDirectoryIntegrationService.SetGroup(props.name, [], true);
        if(error !== undefined)
            return error;

        const groupId = await this.groupsController.Create(props);
        return groupId;
    }
}