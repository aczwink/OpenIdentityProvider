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
import { UserAccountOverviewData, UserAccountsController } from "../data-access/UserAccountsController";
import { ActiveDirectoryService } from "./ActiveDirectoryService";
import { AuthenticationManager } from "./AuthenticationManager";
import { PasswordValidationService } from "./PasswordValidationService";

@Injectable
export class UsersManager
{
    constructor(private userAccountsController: UserAccountsController, private activeDirectoryService: ActiveDirectoryService, private authManager: AuthenticationManager,
        private passwordValidationService: PasswordValidationService
    )
    {
    }

    public async CreateUser(data: UserAccountOverviewData)
    {
        const userId = await this.userAccountsController.Create(data);
        await this.activeDirectoryService.CreateUser(userId);

        return userId;
    }

    public async SetPassword(userId: number, newPassword: string)
    {
        const error = this.passwordValidationService.Validate(newPassword);
        if(error !== undefined)
            return error;

        const pwSalt = this.CreateSalt();
        const pwHash = this.authManager.HashPassword(newPassword, pwSalt);
        
        await this.userAccountsController.UpdateUserClientSecret(userId, pwHash, pwSalt);
        await this.activeDirectoryService.SetUserPassword(userId, newPassword);
    }

    //Private methods
    private CreateSalt()
    {
        return crypto.randomBytes(16).toString("hex");
    }
}