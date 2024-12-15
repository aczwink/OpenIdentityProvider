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
import { ClaimsController } from "../data-access/ClaimsController";
import { ClaimProviderService } from "./ClaimProviderService";
import { ClientsController } from "../data-access/ClientsController";
import { UserAccountsController } from "../data-access/UserAccountsController";

@Injectable
export class ScopeEvaluationService
{
    constructor(private claimsController: ClaimsController, private claimProviderService: ClaimProviderService, private clientsController: ClientsController,
        private userAccountsController: UserAccountsController
    )
    {
    }

    //Public methods
    public async IsScopeRequestValid(clientId: string, userAccountId: string, requestedScope: string)
    {
        const clientData = await this.clientsController.Query(clientId);
        if(clientData === undefined)
            return false;

        const userId = await this.userAccountsController.QueryInternalId(userAccountId);

        const providedScope = await this.claimProviderService.ProvideScope(clientData.appRegistrationId, userId!);
        const requestedScopes = requestedScope.split(" ");
        const availableScopes = providedScope.split(" ");

        return new Set(availableScopes).IsSuperSetOf(new Set(requestedScopes));
    }

    public async ProvideScope(clientId: string)
    {
        const clientData = await this.clientsController.Query(clientId);
        if(clientData === undefined)
            return "";

        if(clientData.type === "authorization_code")
            return await this.ResolveAvailableScopeValues(clientId);

        return await this.claimProviderService.ProvideScope(clientData.appRegistrationId, clientData.appUserId!);
    }

    //Private methods
    private IsOIDCScope(scope: string)
    {
        switch(scope)
        {
            case "openid":
            case "email":
            case "profile":
                return true;
        }
        return false;
    }

    private async ResolveAvailableScopeValues(clientId: string)
    {
        const clientData = await this.clientsController.Query(clientId);
        if(clientData === undefined)
            return "";

        const variables = await this.claimsController.QueryVariables(clientData.appRegistrationId);
        const scopeVar = variables.find(x => x.claimName === "scope");
        if(scopeVar === undefined)
            return "";

        const possibleValues = await this.claimsController.QueryValues(scopeVar.id);
        return possibleValues.Values().Map(x => x.value).Filter(x => !this.IsOIDCScope(x)).Join(" ");
    }
}