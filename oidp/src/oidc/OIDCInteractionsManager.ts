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

import { Injectable } from "acts-util-node";
import { Interaction, InteractionResults } from "oidc-provider";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { AuthenticationManager } from "../services/AuthenticationManager";

interface InteractionError
{
    //required by OIDC :S
    [key: string]: unknown;

    error: string;
    error_description: string;
}

@Injectable
export class OIDCInteractionsManager
{
    constructor(private userAccountsController: UserAccountsController, private authenticationManager: AuthenticationManager)
    {
    }

    //Public methods    
    public async HandleAuth(interaction: Interaction, externalUserId: string, password: string): Promise<InteractionResults | InteractionError>
    {
        const userAccount = await this.userAccountsController.QueryByExternalId(externalUserId);
        if((userAccount !== undefined) && (userAccount.type === "human"))
        {
            const userId = await this.userAccountsController.QueryInternalId(externalUserId);
            const result = await this.authenticationManager.Authenticate(userId!, password);
            if(result)
            {
                return {
                    login: {
                        accountId: userAccount.eMailAddress,
                    },
                };
            }
        }

        return {
            error: "login failed",
            error_description: "wrong user name or password"
        };
    }
}