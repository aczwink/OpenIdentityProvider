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

import { RouteSetup } from "acfrontendex";
import { APIService } from "../services/APIService";
import { UserAccount, UserGroup, UserGroupProperties } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { Use } from "acfrontend";

type GroupId = { userGroupId: number };

const createGroupRoute: RouteSetup<{}, UserGroupProperties> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).usergroups.post(data),
        schema: OpenAPISchema("UserGroupProperties")
    },
    displayText: "Create user group",
    icon: "plus",
    routingKey: "create",
};

const userGroupOverviewRoute: RouteSetup<GroupId, UserGroup> = {
    content: {
        type: "object",
        actions: [
            {
                type: "delete",
                deleteResource: ids => Use(APIService).usergroups._any_.delete(ids.userGroupId),
            }
        ],
        formTitle: (_, group) => group.name,
        requestObject: ids => Use(APIService).usergroups._any_.get(ids.userGroupId),
        schema: OpenAPISchema("UserGroup")
    },
    displayText: "Overview",
    icon: "people",
    routingKey: "overview",
};

const addMemberRoute: RouteSetup<GroupId, UserAccount> = {
    content: {
        type: "create",
        call: (ids, data) => Use(APIService).usergroups._any_.members.post(ids.userGroupId, { userId: data.id }),
        schema: OpenAPISchema("UserAccount"),
    },
    displayText: "Add member",
    icon: "plus",
    routingKey: "add",
};

const membersRoute: RouteSetup<GroupId, UserAccount> = {
    content: {
        type: "list",
        actions: [addMemberRoute],
        boundActions: [
            {
                type: "delete",
                deleteResource: (ids, user) => Use(APIService).usergroups._any_.members.delete(ids.userGroupId, { userId: user.id })
            }
        ],
        requestObjects: ids => Use(APIService).usergroups._any_.members.get(ids.userGroupId),
        schema: OpenAPISchema("UserAccount"),
    },
    displayText: "Members",
    icon: "people",
    routingKey: "members",
};

export const userGroupRoute: RouteSetup<UserGroup, GroupId> = {
    content: {
        type: "multiPage",
        actions: [],
        entries: [
            {
                displayName: "",
                entries: [userGroupOverviewRoute, membersRoute]
            }
        ],
        formTitle: _ => "User group"
    },
    displayText: "User group",
    icon: "people",
    routingKey: "{userGroupId}",
};

export const userGroupsRoutes: RouteSetup<{}, UserGroup> = {
    content: {
        type: "collection",
        actions: [createGroupRoute],
        child: userGroupRoute,
        id: "id",
        requestObjects: () => Use(APIService).usergroups.get(),
        schema: OpenAPISchema("UserGroup")
    },
    displayText: "User groups",
    icon: "people-fill",
    requiredScopes: ["admin"],
    routingKey: "usergroups",
};