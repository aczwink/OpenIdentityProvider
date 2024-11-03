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

@Injectable
export class ScopeEvaluationService
{
    constructor(private claimsController: ClaimsController, private claimProviderService: ClaimProviderService)
    {
    }

    //Public methods
    public async IsScopeRequestValid(clientId: string, userAccountId: string, requestedScope: string)
    {
        const claims = await this.claimProviderService.Provide(clientId, userAccountId);
        const requestedScopes = requestedScope.split(" ");
        const availableScopes = typeof claims.scope === "string" ? claims.scope.split(" ") : [];

        return new Set(availableScopes).IsSuperSetOf(new Set(requestedScopes));
    }

    public async ResolveAvailableScopeValues(clientId: string)
    {
        const variables = await this.claimsController.QueryVariables(clientId);
        const scopeVar = variables.find(x => x.claimName === "scope");
        if(scopeVar === undefined)
            return "";

        const possibleValues = await this.claimsController.QueryValues(scopeVar.id);
        return possibleValues.Values().Map(x => x.value).Filter(x => !this.IsOIDCScope(x)).Join(" ");
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
}