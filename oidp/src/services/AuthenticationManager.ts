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
import { UserAccountsController } from "../data-access/UserAccountsController";

@Injectable
export class AuthenticationManager
{
    constructor(private userAccountsController: UserAccountsController)
    {
    }

    //Public methods
    public async Authenticate(userId: number, password: string)
    {
        const user = await this.userAccountsController.QuerySecretData(userId);
        if(user !== undefined)
        {
            const expectedHash = this.HashPassword(password, user.pwSalt);
            return expectedHash === user.pwHash;
        }

        return false;
    }

    public HashPassword(password: string, pwSalt: string)
    {
        return crypto.scryptSync(password, pwSalt, 32).toString("hex");
    }
}