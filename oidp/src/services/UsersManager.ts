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
import crypto from "crypto";
import { Injectable } from "acts-util-node";
import { UserAccountData, UserAccountsController } from "../data-access/UserAccountsController";
import { AuthenticationManager } from "./AuthenticationManager";
import { PasswordValidationService } from "./PasswordValidationService";
import { GroupsController } from "../data-access/GroupsController";
import { ActiveDirectoryIntegrationService } from "./ActiveDirectoryIntegrationService";

@Injectable
export class UsersManager
{
    constructor(private userAccountsController: UserAccountsController, private activeDirectoryIntegrationService: ActiveDirectoryIntegrationService, private authManager: AuthenticationManager,
        private passwordValidationService: PasswordValidationService, private groupsController: GroupsController,
    )
    {
    }

    //Public methods
    public async CreateUser(data: UserAccountData)
    {
        const error = await this.activeDirectoryIntegrationService.CreateUser(data);
        if(error !== undefined)
            return error;
        const userId = await this.userAccountsController.Create(data);

        return userId;
    }

    public async DeleteUser(userId: number)
    {
        const groupIds = await this.groupsController.QueryGroupsUserIsMemberOf(userId);
        for (const groupId of groupIds)
            await this.RemoveMemberFromGroup(userId, groupId);

        await this.activeDirectoryIntegrationService.DeleteUser(userId);
        await this.userAccountsController.Delete(userId);
    }

    public async GetADUserNames(userId: number)
    {
        return await this.activeDirectoryIntegrationService.GetUserNames(userId);
    }

    public async RemoveMemberFromGroup(userId: number, userGroupId: number)
    {
        await this.activeDirectoryIntegrationService.RemoveMemberFromGroup(userGroupId, userId);
        await this.groupsController.RemoveMember(userGroupId, userId);
    }

    public async SetPassword(userId: number, newPassword: string)
    {
        const error = this.passwordValidationService.Validate(newPassword);
        if(error !== undefined)
            return error;

        const pwSalt = this.CreateSalt();
        const pwHash = this.authManager.HashPassword(newPassword, pwSalt);
        
        await this.activeDirectoryIntegrationService.SetUserPassword(userId, newPassword);
        await this.userAccountsController.UpdateUserClientSecret(userId, pwHash, pwSalt);
    }

    //Private methods
    private CreateSalt()
    {
        return crypto.randomBytes(16).toString("hex");
    }
}