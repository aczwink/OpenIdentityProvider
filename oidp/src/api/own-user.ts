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

import { APIController, Security, Put, Body, Auth, Unauthorized, BadRequest } from "acts-util-apilib";
import { AccessToken, OIDC_API_SCHEME } from "../api_security";
import { UsersManager } from "../services/UsersManager";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { AuthenticationManager } from "../services/AuthenticationManager";

interface ChangeUserPasswordDTO
{
    /**
     * @format secret
     */
    oldPw: string;
    /**
     * @format secret
     */
    newPw: string;
}

@APIController("own-user")
@Security(OIDC_API_SCHEME, [])
class _api_
{
    constructor(private userAccountsController: UserAccountsController, private usersManager: UsersManager, private authManager: AuthenticationManager)
    {
    }

    @Put()
    public async ChangePassword(
        @Auth("jwt") accessToken: AccessToken,
        @Body data: ChangeUserPasswordDTO
    )
    {
        const userId = await this.userAccountsController.QueryInternalId(accessToken.sub);

        const result = await this.authManager.Authenticate(userId!, data.oldPw);
        if(!result)
            return Unauthorized("current password incorrect");

        const error = await this.usersManager.SetPassword(userId!, data.newPw);
        if(error !== undefined)
            return BadRequest("password does not match complexity settings. Reason: " + error);
    }
}