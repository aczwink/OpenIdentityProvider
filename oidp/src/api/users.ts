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

import { APIController, Body, Common, Delete, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
import { UserAccountOverviewData, UserAccountsController } from "../data-access/UserAccountsController";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { ActiveDirectoryService, ActiveDirectoryUserNames } from "../services/ActiveDirectoryService";
import { UsersManager } from "../services/UsersManager";
import { Of } from "acts-util-core";

interface FullUserAccountData
{
    userAccount: UserAccountOverviewData;
    ad: ActiveDirectoryUserNames
};

@APIController("users")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private userAccountsController: UserAccountsController, private usersManager: UsersManager)
    {
    }

    @Post()
    public async CreateUser(
        @Body data: UserAccountOverviewData
    )
    {
        await this.usersManager.CreateUser(data);
    }

    @Get()
    public async RequestAllAccounts()
    {
        return await this.userAccountsController.QueryAll();
    }
}

@APIController("users/{userId}")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api2_
{
    constructor(private userAccountsController: UserAccountsController, private adService: ActiveDirectoryService, private usersManager: UsersManager)
    {
    }

    @Common()
    public async GetUser(
        @Path userId: string
    )
    {
        const internalUserId = await this.userAccountsController.QueryInternalId(userId);
        if(internalUserId === undefined)
            return NotFound("user not found");
        return internalUserId;
    }

    @Delete()
    public async DeleteUser(
        @Common internalUserId: number
    )
    {
        await this.usersManager.DeleteUser(internalUserId);
    }

    @Get()
    public async RequestAccount(
        @Common internalUserId: number
    )
    {
        const userAccount = await this.userAccountsController.Query(internalUserId);
        if(userAccount === undefined)
            return NotFound("user not found");
        const adNames = await this.adService.GetUserNames(internalUserId);

        return Of<FullUserAccountData>({
            ad: adNames,
            userAccount,
        });
    }
}