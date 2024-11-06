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
import { BootstrapApp } from "acfrontendex";
import { usersRoute } from "./routes/users";
import { userGroupsRoutes } from "./routes/groups";
import { appRegistrationsRoutes } from "./routes/app-registrations";
import { RegisterCustomFormats } from "./presentation/custom-formats";

RegisterCustomFormats();

BootstrapApp({
    features: {
        oAuth2: {
            authorizeEndpoint: process.env.OIDP_AUTH_ENDPOINT!,
            clientId: process.env.OIDP_CLIENTID!,
            flow: "authorizationCode",
            redirectURI: process.env.OIDP_REDIRECTURI!,
            tokenEndpoint: process.env.OIDP_TOKEN_ENDPOINT!
        },
        OIDC: true
    },
    mountPoint: document.body,
    routes: [appRegistrationsRoutes, userGroupsRoutes, usersRoute],
    title: "OpenIdentityProvider Portal",
    version: "0.1 beta"
});