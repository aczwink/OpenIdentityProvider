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
import { ClaimsController, ClaimVariable } from "../data-access/ClaimsController";
import { GroupsController } from "../data-access/GroupsController";
import { UserAccountsController } from "../data-access/UserAccountsController";

@Injectable
export class ClaimProviderService
{
    constructor(private claimsController: ClaimsController, private groupsController: GroupsController, private userAccountsController: UserAccountsController)
    {
    }

    public async Provide(externalAppRegistrationId: string, externalUserId: string)
    {
        const userId = await this.userAccountsController.QueryInternalId(externalUserId);

        const variables = await this.claimsController.QueryVariables(externalAppRegistrationId);
        const variablesWithValues = await variables.Values().Map(this.FetchClaimValues.bind(this, userId!)).PromiseAll();

        return variablesWithValues.Values().NotUndefined().ToDictionary(kv => kv.key, kv => kv.value);
    }

    //Private methods
    private ConstructClaimResult(variable: ClaimVariable, grantedValues: string[])
    {
        switch(variable.claimType)
        {
            case "string[]":
                return grantedValues;
            case "string-list-space-separated":
                return grantedValues.join(" ");
        }
    }

    private async FetchClaimValues(userId: number, variable: ClaimVariable)
    {
        const possibleValues = await this.claimsController.QueryValues(variable.id);
        const grantedValues = [];
        for (const v of possibleValues)
        {
            if(await this.groupsController.IsUserMemberOfGroup(userId, v.groupId))
                grantedValues.push(v.value);
        }
        if(grantedValues.length === 0)
            return undefined;
        return {
            key: variable.claimName,
            value: this.ConstructClaimResult(variable, grantedValues)
        };
    }
}