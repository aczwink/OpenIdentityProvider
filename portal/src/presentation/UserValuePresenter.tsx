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
import { RoutingManager } from "acfrontendex";
import { APIService } from "../services/APIService";
import { userRoute } from "../routes/users";

@Injectable
export class UserValuePresenter extends Component<{ userId: string; }>
{
    constructor(private apiService: APIService, private routingManager: RoutingManager)
    {
        super();

        this.userName = null;
    }
    
    protected Render(): RenderValue
    {
        if( this.userName === null )
            return <ProgressSpinner />;

        const url = this.routingManager.BuildURL(userRoute, {
            userId: this.input.userId
        });
        return <Anchor route={url}>{this.userName}</Anchor>;
    }

    //Private variables
    private userName: string | null;

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const response = await this.apiService.users._any_.get(this.input.userId);
        if(response.statusCode !== 200)
            throw new Error("todo implement me");
        switch(response.data.userAccount.type)
        {
            case "human":
                this.userName = response.data.userAccount.givenName;
                break;
            case "service-principal":
                this.userName = response.data.userAccount.displayName;
                break;
        }
    }
}