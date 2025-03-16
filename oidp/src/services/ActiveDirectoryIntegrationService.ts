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
import { ActiveDirectoryService } from "./ActiveDirectoryService";
import { UserAccountData, UserAccountsController } from "../data-access/UserAccountsController";
import { GroupsController } from "../data-access/GroupsController";

@Injectable
export class ActiveDirectoryIntegrationService
{
    constructor(private activeDirectoryService: ActiveDirectoryService, private userAccountsController: UserAccountsController,
        private groupsController: GroupsController)
    {
    }

    //Public methods
    public async AddGroupToDomainAdmins(userGroupId: number)
    {
        const sAMAccountName = await this.MapToGroup_sAMAccountName(userGroupId);
        await this.activeDirectoryService.AddGroupToDomainAdmins(sAMAccountName);
    }

    public async AddMemberToGroup(userGroupId: number, userId: number)
    {
        const group_sAMAccountName = await this.MapToGroup_sAMAccountName(userGroupId);
        const user_sAMAccountName = await this.MapToUser_sAMAccountNameById(userId);

        await this.activeDirectoryService.AddMemberToGroup(group_sAMAccountName, user_sAMAccountName);
    }

    public async DeleteGroup(userGroupId: number)
    {
        const sAMAccountName = await this.MapToGroup_sAMAccountName(userGroupId);
        await this.activeDirectoryService.DeleteGroup(sAMAccountName);
    }

    public async DeleteUser(userId: number)
    {
        const sAMAccountName = await this.MapToUser_sAMAccountNameById(userId);
        await this.activeDirectoryService.DeleteUser(sAMAccountName);
    }

    public async GetUserNames(userId: number)
    {
        const sAMAccountName = await this.MapToUser_sAMAccountNameById(userId);
        return await this.activeDirectoryService.GetUserNames(sAMAccountName);
    }

    public async RemoveGroupFromDomainAdmins(userGroupId: number)
    {
        const sAMAccountName = await this.MapToGroup_sAMAccountName(userGroupId);
        await this.activeDirectoryService.RemoveGroupFromDomainAdmins(sAMAccountName);
    }

    public async RemoveMemberFromGroup(userGroupId: number, userId: number)
    {
        const group_sAMAccountName = await this.MapToGroup_sAMAccountName(userGroupId);
        const user_sAMAccountName = await this.MapToUser_sAMAccountNameById(userId);

        await this.activeDirectoryService.RemoveMemberFromGroup(group_sAMAccountName, user_sAMAccountName);
    }

    public async SetGroup(userGroupName: string, members: UserAccountData[], failIfExisting: boolean = false)
    {
        const sAMAccountName = userGroupName;
        const result = await this.activeDirectoryService.QueryGroup(sAMAccountName);
        if(result === undefined)
        {
            const result = await this.activeDirectoryService.CreateGroup(sAMAccountName);
            if(result !== undefined)
                return result;
            await this.SetGroupMembers(sAMAccountName, members.map(this.MapToUser_sAMAccountName.bind(this)));
            return;
        }
        if(failIfExisting)
            return "error_object_exists";
        throw new Error("TODO: change group to desired state");
    }

    public async SetUser(data: UserAccountData, uid: number, failIfExisting: boolean = false)
    {
        const sAMAccountName = this.MapToUser_sAMAccountName(data);
        const result = await this.activeDirectoryService.QueryUser(sAMAccountName);
        if(result === undefined)
            return await this.activeDirectoryService.CreateUser(sAMAccountName, data, uid);
        if(failIfExisting)
            return "error_object_exists";
        throw new Error("TODO: change user to desired state");
    }

    public async SetUserPassword(userId: number, newPassword: string)
    {
        const sAMAccountName = await this.MapToUser_sAMAccountNameById(userId);

        await this.activeDirectoryService.SetUserPassword(sAMAccountName, newPassword);
    }

    //Private methods
    private GetUserNamingStrategy(): "firstName"
    {
        return "firstName";
    }

    private async MapToGroup_sAMAccountName(userGroupId: number)
    {
        const group = await this.groupsController.Query(userGroupId);
        const sAMAccountName = group!.name;
        return sAMAccountName;
    }

    private MapToUser_sAMAccountName(userAccount: UserAccountData)
    {
        switch(this.GetUserNamingStrategy())
        {
            case "firstName":
                switch(userAccount.type)
                {
                    case "human":
                        return userAccount.givenName;
                    case "service-principal":
                        return userAccount.name;
                }
        }
    }

    private async MapToUser_sAMAccountNameById(userId: number)
    {
        const userAccount = await this.userAccountsController.Query(userId);
        if(userAccount === undefined)
            throw new Error("Should never happen2");
        return this.MapToUser_sAMAccountName(userAccount);
    }

    private async SetGroupMembers(group_sAMAccountName: string, member_sAMAccountNames: string[])
    {
        const currentMembers = await this.activeDirectoryService.QueryGroupMembers(group_sAMAccountName);
        const currentMembersSet = currentMembers.Values().ToSet();

        const targetSet = member_sAMAccountNames.Values().ToSet();

        const toDelete = currentMembersSet.Without(targetSet);
        const toAdd = targetSet.Without(currentMembersSet);

        for (const member of toDelete)
            await this.activeDirectoryService.RemoveMemberFromGroup(group_sAMAccountName, member);
        for (const member of toAdd)
            await this.activeDirectoryService.AddMemberToGroup(group_sAMAccountName, member);
    }
}