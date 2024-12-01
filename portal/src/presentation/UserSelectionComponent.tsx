/**
 * OpenIdentityProvider
 * Copyright (C) 2019-2024 Amir Czwink (amir130@hotmail.de)
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

import { Injectable, Component, ProgressSpinner, AutoCompleteSelectBox, JSX_CreateElement } from "acfrontend";
import { APIService } from "../services/APIService";
import { UserAccountOverviewData } from "../../dist/api";

interface UserSelectionInput
{
    userId: string | null;
    valueChanged: (newValue: string | null) => void;
}
 
@Injectable
export class UserSelectionComponent extends Component<UserSelectionInput>
{
    constructor(private apiService: APIService)
    {
        super();

        this.selectedUserName = null;
    }
    
    protected Render(): RenderValue
    {
        if( (this.input.userId !== null) && (this.selectedUserName === null) )
            return <ProgressSpinner />;

        return <AutoCompleteSelectBox<string>
            onChanged={newValue => this.input.valueChanged(newValue.key)}
            onLoadSuggestions={this.LoadUsers.bind(this)}
            selection={ this.input.userId === null ? null : { displayValue: this.selectedUserName!, key: this.input.userId } } />;
    }

    //Private variables
    private selectedUserName: string | null;

    //Private methods
    private FilterUser(searchText: string, user: UserAccountOverviewData)
    {
        switch(user.type)
        {
            case "human":
                return user.givenName.includes(searchText);
            case "service-principal":
                return user.displayName.includes(searchText);
        }
    }

    private async LoadUsers(searchText: string)
    {
        const users = (await this.apiService.users.get()).data;

        return users.Values().Filter(this.FilterUser.bind(this, searchText)).Map(this.MapUser.bind(this)).ToArray();
    }

    private MapUser(user: UserAccountOverviewData)
    {
        switch(user.type)
        {
            case "human":
                return { key: user.eMailAddress, displayValue: user.givenName };
            case "service-principal":
                return { key: user.externalId, displayValue: user.displayName };
        }
    }

    private async ReloadUserName()
    {
        this.selectedUserName = null;
        if(this.input.userId !== null)
        {
            if(this.input.userId.trim().length === 0)
            {
                this.input.valueChanged(null);
                return;
            }
            const response = await this.apiService.users._any_.get(this.input.userId);
            if(response.statusCode === 200)
                this.selectedUserName = (response.data.userAccount.type === "human") ? response.data.userAccount.givenName : response.data.userAccount.displayName;
            else
                this.input.valueChanged(null);
        }
    }

    //Event handlers
    override OnInitiated(): void
    {
        this.ReloadUserName();
    }

    override OnInputChanged(): void
    {
        this.ReloadUserName();
        this.Update();
    }
}