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
import { Anchor, Component, Injectable, JSX_CreateElement, ProgressSpinner } from "acfrontend";
import { APIService } from "../services/APIService";
import { RoutingManager } from "acfrontendex";
import { userGroupRoute } from "../routes/groups";

@Injectable
export class UserGroupPresenter extends Component<{ userGroupId: number; }>
{
    constructor(private apiService: APIService, private routingManager: RoutingManager)
    {
        super();

        this.userGroupName = null;
    }
    
    protected Render(): RenderValue
    {
        if( this.userGroupName === null )
            return <ProgressSpinner />;

        const url = this.routingManager.BuildURL(userGroupRoute, {
            userGroupId: this.input.userGroupId.toString()
        });
        return <Anchor route={url}>{this.userGroupName}</Anchor>;
    }

    //Private variables
    private userGroupName: string | null;

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const response = await this.apiService.usergroups._any_.get(this.input.userGroupId);
        if(response.statusCode !== 200)
            throw new Error("todo implement me");
        this.userGroupName = response.data.name;
    }
}